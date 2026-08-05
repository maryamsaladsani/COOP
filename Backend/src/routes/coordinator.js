// Coordinator routes: account request (REQ-10), desk/device request (REQ-50), division
// assignment (REQ-11), assigned trainee list/profile (REQ-12/13), training completion
// confirmation (REQ-14) — all scoped to coordinatorId (REQ-36).
//
// Each of the four actions below is independently triggerable — the 7-step onboarding
// roadmap (Backend/src/lib/milestone.js) is a visual progress tracker only, not a
// sequential gate between coordinator actions. The one shared precondition across all
// four is contractSigned === true; there is no "must be at step X" check between them
// (that's what used to block e.g. requesting an account before division assignment).

const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const prisma = require("../lib/prisma");
const asyncHandler = require("../lib/asyncHandler");
const { isMilestoneBehind } = require("../lib/milestone");
const { createDocumentSignedUrl } = require("../lib/uploads");

const router = express.Router();

router.use(requireAuth);
router.use(roleGuard("COORDINATOR"));

// Fetches a trainee and enforces REQ-36 scoping in one place. Returns null (and has
// already sent a 404) if the trainee doesn't exist OR belongs to a different coordinator —
// deliberately the same response for both, so this endpoint can't be used to confirm
// that a given trainee ID exists under someone else's coordinator.
//
// blockIfWithdrawn (REQ-27): mutation routes pass true so a withdrawn trainee 409s instead
// of being acted on further; read-only GETs omit it so a withdrawn trainee's profile can
// still be viewed.
async function loadOwnedTrainee(req, res, { blockIfWithdrawn = false } = {}) {
  const trainee = await prisma.trainee.findUnique({
    where: { id: req.params.id },
    include: { department: { include: { coordinator: { select: { id: true, fullName: true } }, divisions: { orderBy: { name: "asc" } } } } },
  });

  if (!trainee || trainee.coordinatorId !== req.user.id) {
    res.status(404).json({ message: "Trainee not found" });
    return null;
  }

  if (blockIfWithdrawn && trainee.withdrawn) {
    res.status(409).json({ message: "This trainee has been withdrawn; no further actions can be taken" });
    return null;
  }

  return trainee;
}

// Shared precondition for every coordinator action (Fix 3): the trainee must have signed
// their contract first. Returns true (and has already sent a 409) if blocked.
function blockIfContractUnsigned(trainee, res) {
  if (!trainee.contractSigned) {
    res.status(409).json({
      message: "Trainee has not signed their contract yet — actions unlock once signed",
    });
    return true;
  }
  return false;
}

// --- REQ-12: assigned trainee list, scoped at the query level (not fetch-all + filter) ---
router.get("/trainees", async (req, res) => {
  const trainees = await prisma.trainee.findMany({
    where: { coordinatorId: req.user.id },
    orderBy: { createdAt: "asc" },
    include: { department: { include: { coordinator: { select: { id: true, fullName: true } }, divisions: { orderBy: { name: "asc" } } } } },
  });

  res.status(200).json({ trainees });
});

// --- REQ-13: single trainee profile ------------------------------------------------------
router.get("/trainees/:id", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res);
  if (!trainee) return;

  res.status(200).json({ trainee });
});

// --- REQ-01: application document URL — scoped to this coordinator's own trainees --------
// Same Supabase signed-URL contract as hr.js's equivalent route (BUG-001 fix): view at
// GET .../documents/:field, download at GET .../documents/:field?download=true. Wrapped in
// asyncHandler deliberately — this file's other routes aren't, but an uncaught error here
// previously took the whole process down (see /BUGS.md).
router.get(
  "/trainees/:id/documents/:field",
  asyncHandler(async (req, res) => {
    const trainee = await loadOwnedTrainee(req, res);
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

// --- REQ-11: division assignment — independent action, gated only on contractSigned ------
router.patch("/trainees/:id/division", async (req, res) => {
  const { division } = req.body || {};
  if (!division) {
    return res.status(400).json({ message: "division is required" });
  }

  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (blockIfContractUnsigned(trainee, res)) return;

  // Scoped to the trainee's own department's divisions when that department has any
  // defined — departments seeded with no division list yet (most of them, currently)
  // fall back to accepting any value, so division assignment isn't blocked while HR/the
  // spreadsheet source catches up on filling those in.
  const departmentDivisions = trainee.department?.divisions?.map((d) => d.name) || [];
  if (departmentDivisions.length > 0 && !departmentDivisions.includes(division)) {
    return res.status(400).json({
      message: `division must be one of this trainee's department's divisions: ${departmentDivisions.join(", ")}`,
    });
  }

  const data = { division };
  if (isMilestoneBehind(trainee.milestone, "DIVISION_ASSIGNMENT")) {
    data.milestone = "DIVISION_ASSIGNMENT";
  }

  const updated = await prisma.trainee.update({ where: { id: trainee.id }, data });

  res.status(200).json({ trainee: updated });
});

// --- REQ-10: company account request — independent action, gated only on contractSigned --
router.patch("/trainees/:id/request-account", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (blockIfContractUnsigned(trainee, res)) return;

  if (trainee.accountRequested) {
    return res.status(409).json({ message: "Account has already been requested for this trainee" });
  }

  const data = { accountRequested: true, accountRequestedAt: new Date() };
  if (isMilestoneBehind(trainee.milestone, "ACCOUNT_CREDENTIALS")) {
    data.milestone = "ACCOUNT_CREDENTIALS";
  }

  const updated = await prisma.trainee.update({ where: { id: trainee.id }, data });

  res.status(200).json({ trainee: updated });
});

// --- REQ-50: desk/device request — independent action, gated only on contractSigned ------
router.patch("/trainees/:id/request-desk-device", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (blockIfContractUnsigned(trainee, res)) return;

  if (trainee.deskDeviceRequested) {
    return res.status(409).json({ message: "Desk and device have already been requested for this trainee" });
  }

  const data = { deskDeviceRequested: true, deskDeviceRequestedAt: new Date() };
  if (isMilestoneBehind(trainee.milestone, "DESK_DEVICE")) {
    data.milestone = "DESK_DEVICE";
  }

  const updated = await prisma.trainee.update({ where: { id: trainee.id }, data });

  res.status(200).json({ trainee: updated });
});

// --- REQ-14: training completion confirmation — independent action, gated only on --------
// contractSigned. Does not itself advance milestone to CERTIFICATE — that's set by HR's
// issue-certificate route (REQ-26), which checks all six prior steps directly (see hr.js).
router.patch("/trainees/:id/confirm-training", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (blockIfContractUnsigned(trainee, res)) return;

  if (trainee.trainingCompleted) {
    return res.status(409).json({ message: "Training completion has already been confirmed for this trainee" });
  }

  const updated = await prisma.trainee.update({
    where: { id: trainee.id },
    data: { trainingCompleted: true, trainingCompletedAt: new Date() },
  });

  res.status(200).json({ trainee: updated });
});

router.all("*", (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router;
