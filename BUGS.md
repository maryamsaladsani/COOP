# COOP Bug Log

## Process (read before fixing anything)

Any bug found — by Maryam, by manual/screenshot testing, by the automated suite, or by Claude
Code during unrelated work — gets an entry here **before or alongside** being fixed. Don't fix
silently.

1. **Log it first.** Add an entry below with the next sequential `BUG-XXX` ID, a title, and
   `Status: Open`. Fill in `Root cause` only once actually diagnosed — write "needs
   investigation" rather than guessing.
2. **Fix it.** Update `Status` to `Fixed`, fill in `Root cause` and `Fix applied` (which files
   changed; a commit hash once the change is actually committed — don't fabricate one).
3. **Add a regression test where possible.** Link it in `Test coverage`. If a test genuinely
   isn't practical (e.g. requires a live third-party service), say so instead of leaving it
   blank.
4. **If a "fixed" bug comes back**, do not open a new ID — flip its `Status` to `Regressed`,
   add a dated note under it, and re-diagnose. Reusing the ID keeps the history in one place
   instead of scattering re-reports across duplicates.

Test suites live in `Backend/tests/` (Jest + Supertest, run with `npm test` from `Backend/`)
and colocated as `*.test.jsx` next to the component/page under test in `Frontend/src/` (Jest +
React Testing Library, run with `npm test` from `Frontend/`).

---

## BUG-001: Company Card status inconsistent across HR/Coordinator/Trainee dashboards

- **Status:** Fixed
- **Where found:** HR dashboard, Coordinator dashboard, Trainee dashboard — same student,
  same moment, three different displayed card statuses ("Under Issuing" on HR/Coordinator,
  "Not requested" on Trainee).
- **Root cause:** Two compounding issues. (1) `request-card` set `cardStatus: "REQUESTED"`
  and relied on a simulated 2-hour check-on-read timer (`cardAutoTransition.js`) to flip it to
  `ISSUED` later — but that helper was only ever invoked from HR's own read routes, never
  Coordinator's, so the two roles' raw DB reads could disagree during the window. (2) The
  Trainee dashboard's `cardStatus` was never fetched from the real field at all —
  `DataContext.jsx` derived it client-side from `milestone` position via `milestoneReached()`,
  which is a fundamentally different (and laggier) signal than the real `cardStatus` column.
- **Fix applied:** `request-card` now sets `cardStatus` straight to `ISSUED`, no intermediate
  state, no timer. Deleted `Backend/src/lib/cardAutoTransition.js` entirely. `GET
  /api/trainee/status` now returns the real `cardStatus` (and `accountRequested`,
  `deskDeviceRequested`, `contractSigned`, `trainingCompleted`, `certificateIssued`) so the
  Trainee dashboard reads the same source of truth as HR/Coordinator instead of approximating
  it. Not committed yet — working tree changes across `Backend/src/routes/hr.js`,
  `Backend/src/routes/trainee.js`, `Frontend/src/data/DataContext.jsx`,
  `Frontend/src/data/traineeAdapter.js`.
- **Test coverage:** `Backend/tests/milestone-consistency.test.js` — asserts `cardStatus`
  (and `contractSigned`) match across all three role endpoints at multiple stages of the
  lifecycle, including immediately after `request-card` (no waiting-period drift).

---

## BUG-002: Coordinator actions incorrectly gated by strict milestone sequence

- **Status:** Fixed
- **Where found:** Coordinator dashboard — "Request company user account" blocked with
  "Trainee must be at DIVISION_ASSIGNMENT... (currently at DEPARTMENT_ASSIGNMENT)" even
  though nothing in the product requirements ties these two actions together.
- **Root cause:** `coordinator.js`'s four action routes (request-account, request-desk-device,
  division, confirm-training) each called `canAdvance(trainee.milestone, TARGET)`, which only
  returns true if the trainee's current milestone is exactly one step behind the target — i.e.
  every action silently required the immediately-preceding action to have already happened,
  even though the 7-step roadmap was only ever meant to be a display-order model.
- **Fix applied:** Removed all `canAdvance` sequence checks between the four Coordinator
  actions. Replaced `Backend/src/lib/milestone.js`'s `canAdvance` with `isMilestoneBehind`, used
  only to advance the single display `milestone` field forward (never as a gate). See BUG-003
  for what replaced the sequence check. Not committed yet — `Backend/src/routes/coordinator.js`,
  `Backend/src/lib/milestone.js`.
- **Test coverage:** `Backend/tests/coordinator-gating.test.js` — explicitly calls the four
  actions out of roadmap order (desk/device and training-confirm before account) and asserts
  all succeed once contract is signed.

---

## BUG-003: No contract-signature enforcement blocking coordinator actions

- **Status:** Fixed
- **Where found:** Same investigation as BUG-002 — once the milestone-sequence gate was
  identified as the wrong mechanism, there was no replacement precondition at all; every
  Coordinator action would have been fully unblocked with no gating whatsoever.
- **Root cause:** N/A (this was implemented alongside BUG-002's fix, not a pre-existing gap
  being patched — flagging here because the ticket that drove both fixes explicitly required a
  contractSigned precondition as the replacement mechanism).
- **Fix applied:** Added `blockIfContractUnsigned()` to `Backend/src/routes/coordinator.js`,
  called at the top of all four actions — 409 with `"Trainee has not signed their contract
  yet — actions unlock once signed"` when `contractSigned === false`. Frontend:
  `CoordinatorStudentProfilePage.jsx` and `bulkActions.jsx`/`CoordinatorBulkActionPage.jsx`
  disable the action buttons and show the same messaging. Not committed yet.
- **Test coverage:** `Backend/tests/coordinator-gating.test.js` — each action tested for 409
  when unsigned, 200 when signed (backend). No frontend test yet for the disabled-button
  states specifically — see coverage gaps below.

---

## BUG-004: No trainee-facing prompt to sign contract

- **Status:** Fixed
- **Where found:** Trainee dashboard — nothing told the trainee their contract was blocking
  their coordinator's ability to act on their onboarding.
- **Root cause:** Feature gap, not a regression — this notice never existed.
- **Fix applied:** New `Frontend/src/components/dashboard/ContractSignatureNotice.jsx`,
  rendered on `TraineeDashboardPage.jsx` when `!tracks.contract.signed`. Dismissible for the
  session via `sessionStorage`, keyed by `CONTRACT_NOTICE_DISMISSED_KEY` (exported from
  `AuthContext.jsx`, cleared on `logout()` so it reappears on the next login while still
  unsigned). Not committed yet.
- **Test coverage:** `Frontend/src/pages/trainee/TraineeDashboardPage.test.jsx` — shows when
  unsigned, hides when signed, dismiss hides it for the session without needing
  `contractSigned` to change, doesn't render during loading/error states.

---

## BUG-005: Document chips not clickable/downloadable

- **Status:** Fixed (for documents uploaded after the fix — see caveat)
- **Where found:** HR Student Profile page initially; same issue latent on Coordinator and
  Trainee views, which didn't even have a documents section until this fix. Reported three
  times before being correctly root-caused.
- **Root cause (from the Step 1–3 debug protocol, restated here for the record):**
  - **Step 1 (DB):** No file-storage field existed at all. `Trainee.signatureUrl` /
    `personalImageUrl` / `universityTranscriptUrl` / `cvUrl` / `universityLetterUrl` held
    plain display strings (e.g. `"Training Plan .pdf"`) — the original browser `File` object's
    `.name`, never its bytes.
  - **Step 2 (API):** The API faithfully returned those same plain strings — not a
    serialization bug hiding real data; there was nothing to serialize.
  - **Step 3 (upload flow):** `ApplicationPage.jsx` never uploaded file content — its
    `handleFileChange` only ever read `e.target.files[0].name`. The backend had no `multer`/
    equivalent, no disk write, no object-store call. This was true from the project's
    inception, not a regression.
  - **Follow-up finding (2nd/3rd reports):** After the real upload pipeline was built, chips
    still failed for specific pre-existing trainee records (e.g. `cmsej0yfa0005vb42omxeminw`)
    because those rows were created *before* the fix landed and never had real files to begin
    with — confirmed by comparing `createdAt` against the migration timestamp. Not a second
    bug; expected behavior for data that predates the fix. One such record was backfilled with
    explicitly-labeled placeholder files (not the original, unrecoverable bytes) at Maryam's
    request, purely to unblock manual verification.
- **Fix applied:** Real `multer` disk storage (`Backend/src/lib/uploads.js`), new
  `*OriginalName` columns alongside the existing `*Url` columns (migration
  `20260804105449_add_document_original_names`), `POST /api/applications` rewritten for
  `multipart/form-data`, three new authenticated per-role download routes (HR/Coordinator/
  Trainee, each scoped to their own access rules), new shared
  `Frontend/src/components/dashboard/DocumentChip.jsx` wired into all three role views. Not
  committed yet.
- **Test coverage:** `Backend/tests/document-upload.test.js` — uploads a real fixture file,
  asserts the API response contains a real original filename distinct from the stored path,
  downloads it back and asserts byte-for-byte equality, asserts 404 for legacy
  no-real-file records, asserts 401 for unauthenticated access.
  `Frontend/src/components/dashboard/DocumentChip.test.jsx` — clickable button + calls the
  correct role-scoped path when available, non-interactive `<span>` with no click handler when
  not.

---

## BUG-006: Coordinator signup allows free-text department entry not linked to real Department records

- **Status:** Fixed
- **Where found:** `/signup` page, Training Coordinator role — "Department" was a free-text
  input with browser-autocomplete garbage values, and downstream HR's "Assign to Coordinator"
  flow would reject that coordinator's department with "no coordinator assigned yet."
- **Root cause:** Worse than a string mismatch — the typed Department/Division values were
  never sent to the backend at all (`mockAuth.js`'s own comment already admitted this:
  "department, division, companyRole... which the backend has no storage for"). `User` had no
  department field, string or otherwise. The real relation
  (`Department.coordinatorId -> User`) already existed for HR's manual linking action, it just
  never got set at signup time — so every self-service coordinator signup left the coordinator
  with zero departments linked. Confirmed live: the one real coordinator account in the dev DB
  at the time (`2@COOP.sa`) had no department linked.
- **Fix applied:** New public `GET /api/departments` (no auth) for the signup dropdown.
  `POST /api/auth/signup` now requires `departmentId` for `role: COORDINATOR`, validates it
  against a real `Department`, and links `Department.coordinatorId` atomically in the same
  transaction as account creation — rejecting (409) if the department already has a different
  coordinator, with no orphaned account left behind either way.
  `Frontend/src/pages/SignUpPage.jsx`'s free-text field replaced with a real `SelectField`;
  the Division field was removed from signup entirely (no schema concept for a coordinator's
  "own" division — kept it would have recreated this exact bug pattern).
  `Backend/prisma/report-unlinked-coordinators.js` (`npm run report:unlinked-coordinators`)
  lists existing coordinators with no department link, for manual reassignment — no
  auto-matching performed. Not committed yet.
- **Test coverage:** `Backend/tests/coordinator-signup.test.js` — rejects missing
  `departmentId`, rejects an unlisted/fake ID, links atomically on success, rejects (with no
  orphaned account) when the department is already claimed, confirms HR signup doesn't require
  one at all.

---

## No new bugs found by the test suite itself

All 36 tests pass on the current code without surfacing new product-level bugs. Two
**test-infrastructure** gaps were found and fixed while setting the suite up (not app bugs —
see the coverage-gaps summary for detail): `react-router-dom` v7 isn't resolvable under the
Jest 27 bundled with `react-scripts` 5 without a `moduleNameMapper`, and that same Jest
environment doesn't polyfill `TextEncoder` globally. Both fixed in
`Frontend/package.json`/`Frontend/src/setupTests.js` so future test files don't hit them.
