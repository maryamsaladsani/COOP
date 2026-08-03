// Adapts a real backend Trainee (flat milestone + a few status fields, see
// ../../Backend/prisma/schema.prisma) into the richer per-track "record" shape
// the existing dashboard UI already renders (trackSummaries.js, DataTable
// columns, profile pages) — so those components need no changes, only the
// data source feeding them does.
//
// FIDELITY GAPS (flagged — the real backend genuinely has none of this data,
// this isn't a bug in the mapping):
//   - firstName/lastName: backend only stores fullName. Split on the first
//     space — wrong for multi-word last names, but there's no way to recover
//     the original split since it was joined at submission time.
//   - accountCredentials / deskDevice: the mock models these as async
//     "requested -> issued" like the card (REQ-22's 2hr timer), but the real
//     Coordinator actions (REQ-10/REQ-50) are synchronous — milestone jumps
//     straight from not-done to done with no "under_issuing"/"requested"
//     middle state to show.
//   - divisionAssignment.managerName/altSupervisorName: division is a plain
//     string field in the real schema — there's no manager/alt-supervisor
//     concept at all. Always null here.
//   - departmentAssignment.assignedAt / divisionAssignment.assignedAt: no
//     dedicated timestamp column for either in the schema (only the row's
//     overall updatedAt, which isn't attributable to one specific field).
//     Always null here.
//   - training.started/notStarted: the real backend has exactly one
//     Coordinator action, confirm-training (completion only, REQ-14) — no
//     "started"/"not started" concept exists server-side. `started` is
//     derived (true once milestone has reached DESK_DEVICE, since that's
//     the only point the real confirm-training action becomes callable);
//     `notStarted` is always false.
//   - contract.availableAt: the mock gates this on training having started;
//     the real requirement (REQ-07 depends on REQ-15/REQ-16 only) gates it
//     on the account existing, i.e. as soon as the trainee has userId. This
//     is a correction, not a gap — the mock's extra gate wasn't in the spec.

const MILESTONE_ORDER = [
  "ACCEPTANCE",
  "COMPANY_CARD",
  "DEPARTMENT_ASSIGNMENT",
  "DIVISION_ASSIGNMENT",
  "ACCOUNT_CREDENTIALS",
  "DESK_DEVICE",
  "CERTIFICATE",
];

export function milestoneReached(trainee, step) {
  const current = MILESTONE_ORDER.indexOf(trainee.milestone);
  const target = MILESTONE_ORDER.indexOf(step);
  return current >= target;
}

export { MILESTONE_ORDER };

function splitName(fullName) {
  const trimmed = (fullName || "").trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1) };
}

function cardTrackStatus(cardStatus) {
  if (cardStatus === "ISSUED") return "issued";
  if (cardStatus === "REQUESTED") return "under_issuing";
  return "not_requested";
}

function buildTracks(t, department) {
  if (t.applicationStatus !== "ACCEPTED") return null;

  const trainingStarted = milestoneReached(t, "DESK_DEVICE");

  return {
    acceptance: { status: "accepted" },
    card: {
      status: cardTrackStatus(t.cardStatus),
      underIssuingAt: t.cardStatus === "REQUESTED" ? t.cardRequestedAt : null,
    },
    accountCredentials: {
      status: milestoneReached(t, "ACCOUNT_CREDENTIALS") ? "issued" : "not_requested",
      underIssuingAt: null,
    },
    departmentAssignment: {
      status: t.departmentId ? "assigned" : "pending",
      department: department ? department.name : null,
      coordinatorUsername: t.coordinatorId || null,
      coordinatorName: department ? department.coordinatorName : null,
      assignedAt: null,
    },
    divisionAssignment: {
      status: t.division ? "assigned" : "pending",
      division: t.division || null,
      managerName: null,
      altSupervisorName: null,
      assignedAt: null,
    },
    deskDevice: {
      status: milestoneReached(t, "DESK_DEVICE") ? "ready" : "not_requested",
      requestedAt: null,
      readyAt: null,
    },
    training: {
      started: trainingStarted,
      startedAt: null,
      completed: Boolean(t.trainingCompleted),
      completedAt: t.trainingCompletedAt || null,
      notStarted: false,
      notStartedAt: null,
    },
    contract: {
      // REQ-07 depends on REQ-15/16 (account existing) — available as soon as
      // the trainee has a userId, not gated on training start.
      availableAt: t.userId ? t.createdAt : null,
      signed: Boolean(t.contractSigned),
      signedAt: t.contractSignedAt || null,
      signedName: t.contractSigned ? t.fullName : null,
    },
    certificate: {
      status: t.certificateIssued ? "issued" : "pending",
      issuedAt: t.certificateIssuedAt || null,
    },
  };
}

// `departmentsById` is optional — pages that only need the list view (no
// department name resolution) can omit it; departmentAssignment.department/
// coordinatorName will just be null until the caller has the department list.
export function adaptTrainee(t, departmentsById = {}) {
  const { firstName, lastName } = splitName(t.fullName);
  // Two shapes feed this: HR's endpoints return a flat departmentId (resolved
  // via the separate departmentsById lookup, see useHRData); Coordinator's
  // endpoints nest the department relation directly on the trainee (no
  // separate departments-list route exists for that role — see
  // coordinator.js's `include: { department: ... }`). Nested wins when present.
  const department = t.department
    ? {
        name: t.department.name,
        branch: t.department.branch,
        businessLine: t.department.businessLine,
        buildingNumber: t.department.buildingNumber,
        floorNumber: t.department.floorNumber,
        coordinatorName: t.department.coordinator ? t.department.coordinator.fullName : null,
      }
    : t.departmentId
    ? departmentsById[t.departmentId]
    : null;
  const applicationStatus = t.withdrawn ? "withdrawn" : (t.applicationStatus || "").toLowerCase();

  return {
    id: t.id,
    firstName,
    lastName,
    phone: t.phone,
    birthDate: t.birthDate,
    personalEmail: t.personalEmail,
    universityEmail: t.universityEmail,
    universityName: t.universityName,
    college: t.college,
    major: t.major,
    gpa: t.gpa,
    startDate: t.startDate,
    endDate: t.endDate,
    duration: t.durationMonths ? `${t.durationMonths} months` : null,
    nationality: t.nationality,
    nationalId: t.nationalId,
    bloodType: t.bloodType,
    referralSource: t.referralSource,
    employeeReferralId: t.referringEmployeeId,
    signatureFileName: t.signatureUrl,
    personalImageFileName: t.personalImageUrl,
    transcriptFileName: t.universityTranscriptUrl,
    cvFileName: t.cvUrl,
    universityLetterFileName: t.universityLetterUrl,
    iban: t.iban,
    submittedAt: t.createdAt,
    applicationStatus,
    decisionAt: t.acceptedAt || t.rejectedAt || t.withdrawnAt || null,
    withdrawalReason: null, // not persisted server-side (see summary)
    username: null,
    cardRequestStatus: t.cardStatus && t.cardStatus !== "NOT_REQUESTED" ? "requested" : "not_requested",
    trainingDetails: department
      ? {
          branch: department.branch,
          businessLine: department.businessLine,
          buildingNumber: department.buildingNumber,
          floorNumber: department.floorNumber,
        }
      : null,
    tracks: buildTracks(t, department),
    // Fields the mock never had, exposed for real-backend-aware call sites
    // (e.g. the assign-department picker needs the real departmentId/coordinatorId,
    // not just their display names).
    departmentId: t.departmentId,
    coordinatorId: t.coordinatorId,
    milestone: t.milestone,
  };
}

export function adaptTrainees(trainees, departmentsById = {}) {
  return trainees.map((t) => adaptTrainee(t, departmentsById));
}
