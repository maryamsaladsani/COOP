// HR routes: accept/reject applications (REQ-15/19), notifications (REQ-17/18/20), card
// requests (REQ-21), student database/profile (REQ-23/24), department+coordinator assignment
// (REQ-25), certificate issuance (REQ-26), withdrawal (REQ-27). HR sees all students —
// no coordinatorId-style scoping (unlike Coordinator routes).

const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");

const { requireAuth } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const prisma = require("../lib/prisma");
const resend = require("../lib/resend");
const asyncHandler = require("../lib/asyncHandler");
const formatDate = require("../lib/formatDate");
const { isMilestoneBehind } = require("../lib/milestone");
const { resolveDocument } = require("../lib/uploads");

const router = express.Router();

router.use(requireAuth);
router.use(roleGuard("HR"));

const SALT_ROUNDS = 10;
const EMAIL_SENDER = "COOP <noreply@coop.maryamaladsani.site>";

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url"); // ~12 chars, URL-safe
}

// REQ-23 "key details" list view vs REQ-24's full profile — a smaller field set here.
function toStudentSummary(t) {
  return {
    id: t.id,
    fullName: t.fullName,
    personalEmail: t.personalEmail,
    universityName: t.universityName,
    major: t.major,
    nationalId: t.nationalId,
    applicationStatus: t.applicationStatus,
    milestone: t.milestone,
    cardStatus: t.cardStatus,
    coordinatorId: t.coordinatorId,
    departmentId: t.departmentId,
    division: t.division,
    withdrawn: t.withdrawn,
    trainingCompleted: t.trainingCompleted,
    certificateIssued: t.certificateIssued,
    createdAt: t.createdAt,
  };
}

// Best-effort send with the Resend error-checking pattern from Phase 3 (the SDK resolves
// {data, error} instead of throwing on API-level failures — check both). Failures are logged,
// never thrown, and the plaintext password (when passed) is never included in the log line.
async function sendEmail({ to, subject, html }, logContext) {
  try {
    const { error } = await resend.emails.send({ from: EMAIL_SENDER, to, subject, html });
    if (error) {
      console.error(`[hr] Failed to send email (${logContext}) to ${to}:`, error);
    }
  } catch (err) {
    console.error(`[hr] Failed to send email (${logContext}) to ${to}:`, err);
  }
}

async function sendAcceptanceEmails(trainee, tempPassword) {
  // REQ-17: acceptance + credentials, to the student.
  await sendEmail(
    {
      to: trainee.personalEmail,
      subject: "Your COOP application has been accepted",
      html:
        `<p>Congratulations ${trainee.fullName}, your Saudi Energy COOP application has been accepted.</p>` +
        `<p>Your COOP account has been created. Log in with:</p>` +
        `<p>Email: ${trainee.personalEmail}<br/>Temporary password: ${tempPassword}</p>` +
        `<p>Please log in and change your password as soon as possible.</p>`,
    },
    "REQ-17 acceptance"
  );

  // REQ-18: separate acceptance notification to the university — no credentials in this one.
  await sendEmail(
    {
      to: trainee.universityEmail,
      subject: `COOP acceptance confirmation for ${trainee.fullName}`,
      html:
        `<p>This confirms that ${trainee.fullName} (National ID: ${trainee.nationalId}) has been ` +
        `accepted into the Saudi Energy COOP program, running from ${formatDate(trainee.startDate)} ` +
        `to ${formatDate(trainee.endDate)}.</p>`,
    },
    "REQ-18 university notification"
  );
}

async function sendRejectionEmail(trainee) {
  // REQ-20
  await sendEmail(
    {
      to: trainee.personalEmail,
      subject: "Update on your COOP application",
      html:
        `<p>Dear ${trainee.fullName}, thank you for applying to the Saudi Energy COOP program. ` +
        `After review, we are unable to move forward with your application at this time.</p>`,
    },
    "REQ-20 rejection"
  );
}

// No REQ number covers this (REQ-27 only says "withdraw a student's training" — unlike
// accept/reject, there's no matching "notify on withdrawal" requirement in the REQ table).
// Added anyway: the frontend's withdraw page already tells HR "this notifies the trainee by
// email" and can't be quietly wrong about that, and it's the same best-effort Resend pattern
// as REQ-17/18/20 either way.
async function sendWithdrawalEmail(trainee) {
  await sendEmail(
    {
      to: trainee.personalEmail,
      subject: "Update on your COOP training",
      html:
        `<p>Dear ${trainee.fullName}, your Saudi Energy COOP training has been withdrawn. ` +
        `Please contact HR directly if you have any questions.</p>`,
    },
    "withdrawal notification"
  );
}

// --- Department reference list (needed for the REQ-25 assign-department picker) ----------
// Not in the original route list — added because the frontend's "assign to department" UI
// has no way to know which departments/departmentIds exist without this. Read-only,
// spreadsheet-sourced data (see BACKEND_CONTEXT.md) — HR picks, never edits, a department.
router.get(
  "/departments",
  asyncHandler(async (req, res) => {
    const departments = await prisma.department.findMany({
      include: {
        coordinator: { select: { id: true, fullName: true } },
        divisions: { orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    });

    const shaped = departments.map((d) => ({
      id: d.id,
      name: d.name,
      branch: d.branch,
      businessLine: d.businessLine,
      buildingNumber: d.buildingNumber,
      floorNumber: d.floorNumber,
      coordinatorId: d.coordinatorId,
      coordinatorName: d.coordinator ? d.coordinator.fullName : null,
      divisions: d.divisions.map((div) => div.name),
    }));

    res.status(200).json({ departments: shaped });
  })
);

// --- Link a Coordinator to a department (fills the gap flagged above the REQ-25 route below:
// department.coordinatorId previously had no way to be set except direct DB/seed access) ------
router.patch(
  "/departments/:id/coordinator",
  asyncHandler(async (req, res) => {
    const { coordinatorId } = req.body || {};

    if (!coordinatorId) {
      return res.status(400).json({ message: "coordinatorId is required" });
    }

    const department = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const coordinator = await prisma.user.findUnique({ where: { id: coordinatorId } });
    if (!coordinator || coordinator.role !== "COORDINATOR") {
      return res.status(400).json({ message: "coordinatorId must reference an existing user with role COORDINATOR" });
    }

    const updated = await prisma.department.update({
      where: { id: department.id },
      data: { coordinatorId },
      include: { coordinator: { select: { id: true, fullName: true } } },
    });

    res.status(200).json({
      department: {
        id: updated.id,
        name: updated.name,
        branch: updated.branch,
        businessLine: updated.businessLine,
        buildingNumber: updated.buildingNumber,
        floorNumber: updated.floorNumber,
        coordinatorId: updated.coordinatorId,
        coordinatorName: updated.coordinator ? updated.coordinator.fullName : null,
      },
    });
  })
);

// --- REQ-23: all students, key details, no scoping --------------------------------------
router.get(
  "/students",
  asyncHandler(async (req, res) => {
    const trainees = await prisma.trainee.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json({ students: trainees.map(toStudentSummary) });
  })
);

// --- REQ-24: full student profile --------------------------------------------------------
router.get(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({ where: { id: req.params.id } });
    if (!trainee) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ student: trainee });
  })
);

// --- REQ-01: download an application document — HR sees all students, no scoping --------
router.get(
  "/students/:id/documents/:field",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({ where: { id: req.params.id } });
    if (!trainee) {
      return res.status(404).json({ message: "Student not found" });
    }

    const document = resolveDocument(trainee, req.params.field);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.download(document.absolutePath, document.originalName, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ message: "Document file is missing from storage" });
      }
    });
  })
);

// --- REQ-15/16/17/18: accept application --------------------------------------------------
router.patch(
  "/students/:id/accept",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({ where: { id: req.params.id } });
    if (!trainee) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (trainee.applicationStatus !== "PENDING") {
      return res.status(409).json({
        message: `Application must be PENDING to accept (currently ${trainee.applicationStatus})`,
      });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    let updatedTrainee;
    try {
      updatedTrainee = await prisma.$transaction(async (tx) => {
        // ASSUMPTION (flagged): using personalEmail as the login identifier. REQ-01 captures
        // both a personalEmail and a universityEmail, and none of REQ-15/16/17 states which
        // becomes the account login — personalEmail is used here since it's more likely to
        // stay valid after graduation (university emails often expire/deactivate). See the
        // final summary for the full reasoning; this is easy to flip to universityEmail if
        // that assumption is wrong.
        const user = await tx.user.create({
          data: {
            email: trainee.personalEmail,
            password: hashedPassword,
            fullName: trainee.fullName,
            phone: trainee.phone,
            role: "TRAINEE",
          },
        });

        return tx.trainee.update({
          where: { id: trainee.id },
          data: { applicationStatus: "ACCEPTED", acceptedAt: new Date(), userId: user.id },
        });
      });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ message: "A user account with this email already exists" });
      }
      throw err;
    }

    // Best-effort (REQ-17/18) — DB state above is authoritative regardless of email outcome.
    await sendAcceptanceEmails(updatedTrainee, tempPassword);

    return res.status(200).json({ trainee: updatedTrainee });
  })
);

// --- REQ-19/20: reject application --------------------------------------------------------
router.patch(
  "/students/:id/reject",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({ where: { id: req.params.id } });
    if (!trainee) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (trainee.applicationStatus !== "PENDING") {
      return res.status(409).json({
        message: `Application must be PENDING to reject (currently ${trainee.applicationStatus})`,
      });
    }

    const updated = await prisma.trainee.update({
      where: { id: trainee.id },
      data: { applicationStatus: "REJECTED", rejectedAt: new Date() },
    });

    await sendRejectionEmail(updated); // best-effort (REQ-20)

    return res.status(200).json({ trainee: updated });
  })
);

// --- REQ-21: request ISD card ---------------------------------------------------------------
// No waiting period — cardStatus moves straight to ISSUED. HR, Coordinator, and Trainee
// dashboards all read this same field directly (see traineeAdapter.js's cardTrackStatus and
// trainee.js's GET /status), so there's a single source of truth and nothing to reconcile.
router.patch(
  "/students/:id/request-card",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({ where: { id: req.params.id } });
    if (!trainee) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (trainee.applicationStatus !== "ACCEPTED") {
      return res.status(409).json({
        message: `Student must be ACCEPTED to request a card (currently ${trainee.applicationStatus})`,
      });
    }
    if (trainee.cardStatus !== "NOT_REQUESTED") {
      return res.status(409).json({
        message: `Card has already been requested or issued (currently ${trainee.cardStatus})`,
      });
    }

    const now = new Date();
    const data = { cardStatus: "ISSUED", cardRequestedAt: now, cardIssuedAt: now };
    if (isMilestoneBehind(trainee.milestone, "COMPANY_CARD")) {
      data.milestone = "COMPANY_CARD";
    }

    const updated = await prisma.trainee.update({ where: { id: trainee.id }, data });

    return res.status(200).json({ trainee: updated });
  })
);

// --- REQ-25: assign a batch of students to a department (+ derived coordinator) -----------
// ASSUMPTION (flagged): implemented as a collection-level route (no single :id in the path)
// because REQ-25 is fundamentally a batch operation ("assign a batch of students to a
// Coordinator") — a single :id segment doesn't fit that shape. Also flagged: HR assigns a
// *department*, not a Coordinator directly; coordinatorId is derived from
// Department.coordinatorId in the same operation. This mirrors the Department model's design
// (a coordinatorId FK already on Department) but means HR never picks a Coordinator by name —
// only by department, and the department must already have a coordinator assigned (via that
// coordinator's own signup + Department seeding) or this route rejects.
router.patch(
  "/students/assign-department",
  asyncHandler(async (req, res) => {
    const { studentIds, departmentId } = req.body || {};

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds must be a non-empty array" });
    }
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    if (!department.coordinatorId) {
      return res
        .status(409)
        .json({ message: "Department has no coordinator assigned yet — cannot assign trainees to it" });
    }

    const trainees = await prisma.trainee.findMany({ where: { id: { in: studentIds } } });
    if (trainees.length !== studentIds.length) {
      const foundIds = new Set(trainees.map((t) => t.id));
      const missing = studentIds.filter((id) => !foundIds.has(id));
      return res.status(404).json({ message: `Student(s) not found: ${missing.join(", ")}` });
    }

    // Card Request (REQ-21) and Department Assignment (REQ-25) are independent HR actions —
    // neither depends on the other's completion. The only real precondition here is that the
    // student has been accepted; whether ISD's card has been requested/issued is unrelated.
    const notReady = trainees.filter((t) => t.applicationStatus !== "ACCEPTED");
    if (notReady.length > 0) {
      return res.status(409).json({
        message: `Student(s) must be ACCEPTED to assign a department: ${notReady
          .map((t) => `${t.id} (${t.applicationStatus})`)
          .join(", ")}`,
      });
    }

    const updated = await prisma.$transaction(
      trainees.map((t) => {
        const data = { departmentId: department.id, coordinatorId: department.coordinatorId };
        // Advance milestone forward only — never regress a trainee who has already
        // progressed past DEPARTMENT_ASSIGNMENT (e.g. re-assigning to a different department
        // after the coordinator has moved them on to DIVISION_ASSIGNMENT).
        if (isMilestoneBehind(t.milestone, "DEPARTMENT_ASSIGNMENT")) {
          data.milestone = "DEPARTMENT_ASSIGNMENT";
        }
        return prisma.trainee.update({ where: { id: t.id }, data });
      })
    );

    return res.status(200).json({ trainees: updated });
  })
);

// --- REQ-26: issue completion certificate -------------------------------------------------
// This is the one case (Fix 2's stated exception) where a dependency check remains: unlike
// the four independent Coordinator actions, certificate issuance requires ALL six prior
// milestones actually complete. Because those actions no longer gate each other, they can
// land in any order — the single `milestone` display field only tracks the furthest step
// reached and can't prove every step happened, so this checks each real field directly.
router.patch(
  "/students/:id/issue-certificate",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({ where: { id: req.params.id } });
    if (!trainee) {
      return res.status(404).json({ message: "Student not found" });
    }

    const incomplete = [];
    if (trainee.cardStatus !== "ISSUED") incomplete.push("Company Card");
    if (!trainee.departmentId || !trainee.coordinatorId) incomplete.push("Department Assignment");
    if (!trainee.division) incomplete.push("Division Assignment");
    if (!trainee.accountRequested) incomplete.push("Account Credentials");
    if (!trainee.deskDeviceRequested) incomplete.push("Desk & Device");
    if (!trainee.trainingCompleted) incomplete.push("Training Completion (Coordinator confirmation)");

    if (incomplete.length > 0) {
      return res.status(409).json({
        message: `Cannot issue certificate — incomplete milestone(s): ${incomplete.join(", ")}`,
      });
    }

    const updated = await prisma.trainee.update({
      where: { id: trainee.id },
      data: { certificateIssued: true, certificateIssuedAt: new Date(), milestone: "CERTIFICATE" },
    });

    return res.status(200).json({ trainee: updated });
  })
);

// --- REQ-27: withdraw, allowed any time before certificate issuance -----------------------
router.patch(
  "/students/:id/withdraw",
  asyncHandler(async (req, res) => {
    const trainee = await prisma.trainee.findUnique({ where: { id: req.params.id } });
    if (!trainee) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (trainee.certificateIssued) {
      return res.status(409).json({ message: "Cannot withdraw a trainee whose certificate has already been issued" });
    }
    if (trainee.withdrawn) {
      return res.status(409).json({ message: "Trainee has already been withdrawn" });
    }

    const updated = await prisma.trainee.update({
      where: { id: trainee.id },
      data: { withdrawn: true, withdrawnAt: new Date() },
    });

    await sendWithdrawalEmail(updated); // best-effort, see sendWithdrawalEmail comment above

    return res.status(200).json({ trainee: updated });
  })
);

router.all("*", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router;
