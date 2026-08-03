// Shared onboarding milestone helpers — generic across roles (Coordinator, HR, Trainee
// routes all reuse this), not Coordinator-specific. Mirrors the Milestone enum order in
// prisma/schema.prisma; keep the two in sync if the sequence ever changes.

const MILESTONE_ORDER = [
  "ACCEPTANCE",
  "COMPANY_CARD",
  "DEPARTMENT_ASSIGNMENT",
  "DIVISION_ASSIGNMENT",
  "ACCOUNT_CREDENTIALS",
  "DESK_DEVICE",
  "CERTIFICATE",
];

// True only for a single step forward from `currentMilestone` to `targetMilestone` —
// no skipping ahead, no going backward, no staying in place.
function canAdvance(currentMilestone, targetMilestone) {
  const currentIndex = MILESTONE_ORDER.indexOf(currentMilestone);
  const targetIndex = MILESTONE_ORDER.indexOf(targetMilestone);

  if (currentIndex === -1 || targetIndex === -1) {
    return false;
  }

  return targetIndex === currentIndex + 1;
}

module.exports = { MILESTONE_ORDER, canAdvance };
