// Trainee routes: application status (REQ-04), training details (REQ-05), orientation
// content (REQ-06), contract view/sign (REQ-07/08), certificate download (REQ-09). Every
// route resolves the caller's own Trainee row via Trainee.userId = req.user.id.

const express = require("express");
const PDFDocument = require("pdfkit");

const { requireAuth } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const prisma = require("../lib/prisma");
const asyncHandler = require("../lib/asyncHandler");
const formatDate = require("../lib/formatDate");
const { MILESTONE_ORDER } = require("../lib/milestone");
const { DOCUMENT_FIELDS, createDocumentSignedUrl } = require("../lib/uploads");

const router = express.Router();

router.use(requireAuth);
router.use(roleGuard("TRAINEE"));

// Same pattern as Coordinator's loadOwnedTrainee, local to this file: resolves the caller's
// own Trainee row rather than scoping by coordinatorId.
async function loadOwnTrainee(req, res) {
  const trainee = await prisma.trainee.findUnique({ where: { userId: req.user.id } });

  if (!trainee) {
    res.status(404).json({ message: "Trainee record not found" });
    return null;
  }

  return trainee;
}

// PLACEHOLDER CONTENT — not real legal terms. REQ-07/08 need something to render/sign
// against, but no contract copy exists anywhere in the schema or requirements. Replace with
// reviewed legal text before this goes near production.
function buildPlaceholderContract(trainee) {
  return {
    isPlaceholder: true,
    text:
      `COOP TRAINING AGREEMENT (PLACEHOLDER — NOT LEGAL TEXT)\n\n` +
      `This agreement is entered into between Saudi Energy and ${trainee.fullName} ` +
      `(National ID: ${trainee.nationalId}) for a co-operative training program in the ` +
      `${trainee.major} field, running from ${formatDate(trainee.startDate)} to ` +
      `${formatDate(trainee.endDate)} (${trainee.durationMonths} months).\n\n` +
      `By signing below, the trainee acknowledges participation in the Saudi Energy COOP ` +
      `program under its standard terms and conditions.\n\n` +
      `[Placeholder text — replace with reviewed legal contract language.]`,
  };
}

// --- REQ-04: onboarding status/roadmap -----------------------------------------------------
// Fix 1/4: returns the real cardStatus and contractSigned fields directly (not derived from
// milestone position) so this dashboard reads the exact same source of truth as HR's and the
// Coordinator's — no separate locally-approximated status values per role.
router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnTrainee(req, res);
    if (!trainee) return;

    const currentIndex = MILESTONE_ORDER.indexOf(trainee.milestone);
    const roadmap = MILESTONE_ORDER.map((step, index) => ({
      step,
      status: index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming",
    }));

    res.status(200).json({
      milestone: trainee.milestone,
      roadmap,
      withdrawn: trainee.withdrawn,
      // BUG-003: real column, just never threaded through before — the Acceptance step's
      // "Accepted on {date}" caption needs this to not fall back to a bare "—".
      acceptedAt: trainee.acceptedAt,
      cardStatus: trainee.cardStatus,
      cardRequestedAt: trainee.cardRequestedAt,
      cardIssuedAt: trainee.cardIssuedAt,
      accountRequested: trainee.accountRequested,
      deskDeviceRequested: trainee.deskDeviceRequested,
      contractSigned: trainee.contractSigned,
      contractSignedAt: trainee.contractSignedAt,
      trainingCompleted: trainee.trainingCompleted,
      trainingCompletedAt: trainee.trainingCompletedAt,
      certificateIssued: trainee.certificateIssued,
      certificateIssuedAt: trainee.certificateIssuedAt,
    });
  })
);

// --- REQ-01: this trainee's own application documents, metadata only (no /status bloat) ---
router.get(
  "/documents",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnTrainee(req, res);
    if (!trainee) return;

    const documents = Object.fromEntries(
      Object.entries(DOCUMENT_FIELDS).map(([field, columns]) => [field, trainee[columns.nameColumn] || null])
    );

    res.status(200).json({ documents });
  })
);

// --- REQ-01: one of this trainee's own application documents — same Supabase signed-URL
// contract as hr.js's/coordinator.js's equivalent routes (BUG-001 fix): view at
// GET .../documents/:field, download at GET .../documents/:field?download=true.
router.get(
  "/documents/:field",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnTrainee(req, res);
    if (!trainee) return;

    const wantsDownload = req.query.download === "true";
    const document = await createDocumentSignedUrl(trainee, req.params.field, 300, wantsDownload);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({
      document: {
        url: document.url,
        originalName: document.originalName,
        mode: wantsDownload ? "download" : "view",
        expiresInSeconds: 300,
      },
    });
  })
);

// --- REQ-05: training details, available as soon as a department is assigned --------------
// BUG-004 fix: this used to also require `division` before returning anything at all, which
// made the Trainee dashboard's Department Assignment step look unassigned until the
// Coordinator separately set a division — even though departmentId/coordinatorId are set
// together, atomically, by HR's assign-department action. coordinatorId is guarded
// defensively below even though it's always set alongside departmentId in practice;
// division/coordinatorName individually degrade to null in the response if not set yet,
// which the frontend already renders as "pending" rather than crashing.
router.get(
  "/training-details",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnTrainee(req, res);
    if (!trainee) return;

    if (!trainee.departmentId) {
      return res.status(200).json({ available: false, message: "Training details are not available yet." });
    }

    const [coordinator, department] = await Promise.all([
      trainee.coordinatorId ? prisma.user.findUnique({ where: { id: trainee.coordinatorId } }) : null,
      prisma.department.findUnique({ where: { id: trainee.departmentId } }),
    ]);

    res.status(200).json({
      available: true,
      division: trainee.division,
      coordinatorName: coordinator ? coordinator.fullName : null,
      department: department
        ? {
            name: department.name,
            branch: department.branch,
            businessLine: department.businessLine,
            buildingNumber: department.buildingNumber,
            floorNumber: department.floorNumber,
          }
        : null,
    });
  })
);

// --- REQ-06: static orientation content ----------------------------------------------------
// Placeholder copy — easy to edit later, no DB needed.
router.get("/orientation", (req, res) => {
  res.status(200).json({
    title: "Your First Day in SE",
    content: [
      "Welcome to Saudi Energy! Here's what to expect on your first day as a COOP trainee.",
      "Arrive at the main reception 15 minutes before your scheduled start time with a valid ID.",
      "HR will meet you for a short welcome briefing and badge issuance.",
      "Your Training Coordinator will walk you to your assigned division and introduce you to your team.",
      "IT will help you get set up with your company account, desk, and device if not already provisioned.",
      "Lunch is available in the main cafeteria — ask any team member for directions.",
      "By the end of the day, you should know your reporting manager, desk location, and first-week goals.",
    ],
  });
});

// --- REQ-07: view contract (placeholder content) -------------------------------------------
router.get(
  "/contract",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnTrainee(req, res);
    if (!trainee) return;

    res.status(200).json({
      contract: buildPlaceholderContract(trainee),
      contractSigned: trainee.contractSigned,
      contractSignedAt: trainee.contractSignedAt,
    });
  })
);

// --- REQ-08: sign contract, standalone from milestone (per BACKEND_CONTEXT.md) ------------
router.post(
  "/contract/sign",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnTrainee(req, res);
    if (!trainee) return;

    if (trainee.contractSigned) {
      return res.status(409).json({ message: "Contract has already been signed" });
    }

    const updated = await prisma.trainee.update({
      where: { id: trainee.id },
      data: { contractSigned: true, contractSignedAt: new Date() },
    });

    res.status(200).json({ contractSigned: updated.contractSigned, contractSignedAt: updated.contractSignedAt });
  })
);

// --- REQ-09: download certificate PDF, only once issued ------------------------------------
router.get(
  "/certificate",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnTrainee(req, res);
    if (!trainee) return;

    if (!trainee.certificateIssued) {
      return res.status(404).json({ message: "Certificate has not been issued yet" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="coop-certificate-${trainee.id}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 72 });
    doc.pipe(res);

    doc.fontSize(24).text("Certificate of Completion", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).text("Saudi Energy Co-operative Training Program", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).text("This certifies that", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(20).text(trainee.fullName, { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(14)
      .text(
        `has successfully completed the co-operative training program from ${formatDate(
          trainee.startDate
        )} to ${formatDate(trainee.endDate)}.`,
        { align: "center" }
      );
    doc.moveDown(2);
    doc.fontSize(10).text(`Issued: ${formatDate(trainee.certificateIssuedAt)}`, { align: "center" });

    doc.end();
  })
);

router.all("*", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router;
