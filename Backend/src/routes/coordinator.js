// Coordinator routes: account request (REQ-10), desk/device request (REQ-50), division
// assignment (REQ-11), assigned trainee list/profile (REQ-12/13), training completion
// confirmation (REQ-14) — all scoped to coordinatorId (REQ-36).

const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const prisma = require("../lib/prisma");
const { canAdvance } = require("../lib/milestone");

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
    include: { department: { include: { coordinator: { select: { id: true, fullName: true } } } } },
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

// --- REQ-12: assigned trainee list, scoped at the query level (not fetch-all + filter) ---
router.get("/trainees", async (req, res) => {
  const trainees = await prisma.trainee.findMany({
    where: { coordinatorId: req.user.id },
    orderBy: { createdAt: "asc" },
    include: { department: { include: { coordinator: { select: { id: true, fullName: true } } } } },
  });

  res.status(200).json({ trainees });
});

// --- REQ-13: single trainee profile ------------------------------------------------------
router.get("/trainees/:id", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res);
  if (!trainee) return;

  res.status(200).json({ trainee });
});

// --- REQ-11: division assignment, DEPARTMENT_ASSIGNMENT -> DIVISION_ASSIGNMENT -----------
router.patch("/trainees/:id/division", async (req, res) => {
  const { division } = req.body || {};
  if (!division) {
    return res.status(400).json({ message: "division is required" });
  }

  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (!canAdvance(trainee.milestone, "DIVISION_ASSIGNMENT")) {
    return res.status(409).json({
      message: `Trainee must be at DEPARTMENT_ASSIGNMENT to assign a division (currently at ${trainee.milestone})`,
    });
  }

  const updated = await prisma.trainee.update({
    where: { id: trainee.id },
    data: { division, milestone: "DIVISION_ASSIGNMENT" },
  });

  res.status(200).json({ trainee: updated });
});

// --- REQ-10: company account request, DIVISION_ASSIGNMENT -> ACCOUNT_CREDENTIALS ---------
router.patch("/trainees/:id/request-account", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (!canAdvance(trainee.milestone, "ACCOUNT_CREDENTIALS")) {
    return res.status(409).json({
      message: `Trainee must be at DIVISION_ASSIGNMENT to request an account (currently at ${trainee.milestone})`,
    });
  }

  const updated = await prisma.trainee.update({
    where: { id: trainee.id },
    data: { milestone: "ACCOUNT_CREDENTIALS" },
  });

  res.status(200).json({ trainee: updated });
});

// --- REQ-50: desk/device request, ACCOUNT_CREDENTIALS -> DESK_DEVICE ---------------------
router.patch("/trainees/:id/request-desk-device", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (!canAdvance(trainee.milestone, "DESK_DEVICE")) {
    return res.status(409).json({
      message: `Trainee must be at ACCOUNT_CREDENTIALS to request a desk and device (currently at ${trainee.milestone})`,
    });
  }

  const updated = await prisma.trainee.update({
    where: { id: trainee.id },
    data: { milestone: "DESK_DEVICE" },
  });

  res.status(200).json({ trainee: updated });
});

// --- REQ-14: training completion confirmation ---------------------------------------------
// Gates REQ-26 (HR issues certificate) but does not itself advance milestone to CERTIFICATE —
// that's set by HR in a later phase.
router.patch("/trainees/:id/confirm-training", async (req, res) => {
  const trainee = await loadOwnedTrainee(req, res, { blockIfWithdrawn: true });
  if (!trainee) return;

  if (trainee.milestone !== "DESK_DEVICE") {
    return res.status(409).json({
      message: `Trainee must be at DESK_DEVICE to confirm training completion (currently at ${trainee.milestone})`,
    });
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
