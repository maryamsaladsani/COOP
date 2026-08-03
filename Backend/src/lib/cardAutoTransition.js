// REQ-22: card status auto-updates to ISSUED 2 hours after REQ-21's request.
//
// MECHANISM CHOICE (flagged — not specified by the requirements): implemented as
// check-on-read rather than a background timer/cron job. Whenever a trainee record is
// fetched through one of the read endpoints that calls this helper (HR's student list/detail,
// Trainee's own status route), we check whether cardStatus is REQUESTED and 2+ hours have
// elapsed since cardRequestedAt; if so we apply the transition right then, before responding.
//
// Why: Railway + SQLite here has no job scheduler/cron dependency, and a real timer
// (setTimeout per request) wouldn't survive a server restart — any in-flight timers would
// silently vanish and the transition would never fire. Check-on-read has no moving parts to
// lose: the transition becomes true "as of" the next read after 2 hours pass, computed fresh
// from cardRequestedAt every time, so it's correct regardless of process restarts, and there's
// no scheduler infrastructure to add for a project this size.
//
// Trade-off: the transition isn't visible to anyone until something reads that trainee row.
// If the record is only ever read again in month, that's when the update actually lands in
// the DB — not exactly 2 real-world hours later. Given REQ-04/REQ-23/REQ-24 all refetch on
// every page load (per BACKEND_CONTEXT.md's refetch-on-load model), this gap in practice is
// bounded by "how soon does anyone open that page," which is normally minutes, not longer.

const prisma = require("./prisma");
const { canAdvance } = require("./milestone");

const CARD_AUTO_ISSUE_WINDOW_MS = 2 * 60 * 60 * 1000;

async function applyCardAutoTransition(trainee) {
  if (trainee.cardStatus !== "REQUESTED" || !trainee.cardRequestedAt) {
    return trainee;
  }

  const elapsed = Date.now() - new Date(trainee.cardRequestedAt).getTime();
  if (elapsed < CARD_AUTO_ISSUE_WINDOW_MS) {
    return trainee;
  }

  const data = { cardStatus: "ISSUED", cardIssuedAt: new Date() };

  // Defensive: only advance milestone if ACCEPTANCE -> COMPANY_CARD is actually the next
  // step for this trainee. In the normal flow it always is (nothing else moves milestone
  // before this), but routing every transition through canAdvance() keeps this helper safe
  // even if that assumption is ever violated.
  if (canAdvance(trainee.milestone, "COMPANY_CARD")) {
    data.milestone = "COMPANY_CARD";
  }

  return prisma.trainee.update({ where: { id: trainee.id }, data });
}

async function applyCardAutoTransitionToMany(trainees) {
  return Promise.all(trainees.map((trainee) => applyCardAutoTransition(trainee)));
}

module.exports = { applyCardAutoTransition, applyCardAutoTransitionToMany, CARD_AUTO_ISSUE_WINDOW_MS };
