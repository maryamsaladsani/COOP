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

// The 7-step roadmap is a visual progress tracker only (see hr.js/coordinator.js route
// comments) — individual actions (Card Request, Department Assignment, Division
// Assignment, Account Credentials, Desk & Device) are independently triggerable in any
// order once their own real precondition is met, they don't gate each other. This helper
// is only for keeping the single `milestone` display field moving forward as actions land,
// never regressing a trainee whose independent actions already passed `targetMilestone`.
function isMilestoneBehind(currentMilestone, targetMilestone) {
  return MILESTONE_ORDER.indexOf(currentMilestone) < MILESTONE_ORDER.indexOf(targetMilestone);
}

module.exports = { MILESTONE_ORDER, isMilestoneBehind };
