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
//   - accountCredentials / deskDevice: the real Coordinator actions (REQ-10/REQ-50)
//     are synchronous (no ISD-style waiting period) — sourced directly from the
//     accountRequested/deskDeviceRequested fields, so there's no "under_issuing"/
//     "requested" middle state to show, only not-done/done.
//   - divisionAssignment.managerName/altSupervisorName: division is a plain
//     string field in the real schema — there's no manager/alt-supervisor
//     concept at all. Always null here.
//   - departmentAssignment.assignedAt / divisionAssignment.assignedAt: no
//     dedicated timestamp column for either in the schema (only the row's
//     overall updatedAt, which isn't attributable to one specific field).
//     Always null here.
//   - training.started/notStarted: the real backend has exactly one
//     Coordinator action, confirm-training (completion only, REQ-14) — no
//     "started"/"not started" concept exists server-side. `started` is a
//     descriptive proxy (true once deskDeviceRequested is set — desk/device
//     being ready is a reasonable "they're plausibly on-site now" signal for
//     dashboard summaries) — it is NOT a precondition for confirm-training,
//     which since Fix 2/3 only requires contractSigned, independent of every
//     other track. `notStarted` is always false.
//   - contract.availableAt: the mock gates this on training having started;
//     the real requirement (REQ-07 depends on REQ-15/REQ-16 only) gates it
//     on the account existing, i.e. as soon as the trainee has userId. This
//     is a correction, not a gap — the mock's extra gate wasn't in the spec.

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

// Field keys must match Backend/src/lib/uploads.js's DOCUMENT_FIELDS exactly — they're
// used directly in the authenticated download route path (GET .../documents/:field).
// Shared between adaptTrainee() (HR/Coordinator, which get the full raw trainee row) and
// DataContext.jsx's useTraineeDocuments() (Trainee's own view, which only gets the
// metadata endpoint's { field: originalName | null } shape — no legacy *Url fallback,
// since a trainee's own current documents always went through the real upload flow).
const DOCUMENT_LABELS = {
  universityTranscript: "Training Plan / Transcript",
  cv: "CV",
  universityLetter: "University Letter",
  personalImage: "Personal Photo",
  signature: "Signature",
};

// `resolve(field)` returns { available, fileName } for that field key. `available` must
// reflect ONLY whether a real uploaded file is on record (never a legacy-fallback filename)
// since it's what gates whether DocumentChip renders as clickable.
export function buildDocumentList(resolve) {
  return Object.entries(DOCUMENT_LABELS).map(([field, label]) => {
    const { available, fileName } = resolve(field);
    return { field, label, fileName: fileName || label, available: Boolean(available) };
  });
}

function buildTracks(t, department) {
  if (t.applicationStatus !== "ACCEPTED") return null;

  // Fix 2/3: Coordinator actions are independent of each other (no roadmap-sequence
  // gate between them), so these must be sourced from their own real fields — a
  // milestone-position check would be wrong the moment any action lands out of order
  // (e.g. desk/device requested before an account, which is now allowed).
  const accountRequested = Boolean(t.accountRequested);
  const deskDeviceRequested = Boolean(t.deskDeviceRequested);

  return {
    acceptance: { status: "accepted" },
    card: {
      status: cardTrackStatus(t.cardStatus),
      underIssuingAt: t.cardStatus === "REQUESTED" ? t.cardRequestedAt : null,
    },
    accountCredentials: {
      status: accountRequested ? "issued" : "not_requested",
      underIssuingAt: null,
    },
    departmentAssignment: {
      status: t.departmentId ? "assigned" : "pending",
      department: department ? department.name : null,
      coordinatorUsername: t.coordinatorId || null,
      coordinatorName: department ? department.coordinatorName : null,
      // Scopes the Coordinator's "Assign division" picker to this trainee's own
      // department (Fix: divisions are no longer a single global list) — empty when
      // unassigned or when the department has no divisions defined yet.
      divisions: department?.divisions || [],
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
      status: deskDeviceRequested ? "ready" : "not_requested",
      requestedAt: null,
      readyAt: null,
    },
    training: {
      // Descriptive only (see FIDELITY GAPS above) — not a precondition for confirming
      // completion, which is gated solely on contractSigned.
      started: deskDeviceRequested,
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

// Fix 2's stated exception: certificate issuance is the one case that still requires ALL
// six prior milestones actually complete (not just "furthest one reached"), since the four
// Coordinator actions no longer gate each other and can land in any order. Mirrors the
// backend's own check in hr.js's issue-certificate route — keep the two in sync.
export function isCertificateReady(tracks) {
  return (
    tracks.card.status === "issued" &&
    tracks.departmentAssignment.status === "assigned" &&
    tracks.divisionAssignment.status === "assigned" &&
    tracks.accountCredentials.status === "issued" &&
    tracks.deskDevice.status === "ready" &&
    tracks.training.completed
  );
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
  // divisions: HR's /api/hr/departments already shapes these as plain name strings;
  // Coordinator's nested t.department.divisions is the raw Prisma include (Division rows
  // with id/name/departmentId) — normalized to plain strings here either way, so
  // CoordinatorStudentProfilePage/bulkActions can treat `department.divisions` uniformly
  // regardless of which role's endpoint the record came from.
  const department = t.department
    ? {
        name: t.department.name,
        branch: t.department.branch,
        businessLine: t.department.businessLine,
        buildingNumber: t.department.buildingNumber,
        floorNumber: t.department.floorNumber,
        coordinatorName: t.department.coordinator ? t.department.coordinator.fullName : null,
        divisions: (t.department.divisions || []).map((d) => (typeof d === "string" ? d : d.name)),
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
    // *OriginalName is the real uploaded filename (set once REQ-01's actual file storage
    // landed); *Url falls back to display-only for rows submitted before that existed —
    // see documents[].available below for which ones actually have a downloadable file.
    signatureFileName: t.signatureOriginalName || t.signatureUrl,
    personalImageFileName: t.personalImageOriginalName || t.personalImageUrl,
    transcriptFileName: t.universityTranscriptOriginalName || t.universityTranscriptUrl,
    cvFileName: t.cvOriginalName || t.cvUrl,
    universityLetterFileName: t.universityLetterOriginalName || t.universityLetterUrl,
    // Drives DocumentChipList everywhere it's rendered (HR/Coordinator). fileName falls
    // back to the legacy *Url for rows submitted before real file storage existed, but
    // `available` (which gates whether the chip is clickable) is only true when a real
    // uploaded file is on record.
    documents: buildDocumentList((field) => ({
      available: Boolean(t[`${field}OriginalName`]),
      fileName: t[`${field}OriginalName`] || t[`${field}Url`],
    })),
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
