# COOP — Backend Context Brief

Reference this file at the start of every Claude Code session on the backend. It defines the stack, data model, scope boundaries, and requirements so decisions don't need re-explaining each time. Requirements below are transcribed directly from the Notion Master Requirements Database.

## Project

COOP (Coordinated Onboarding & Operations Platform) digitizes Saudi Energy's trainee onboarding process, currently a manual, paper-based workflow taking 5+ days. Target: 2–3 days, near-zero data entry errors, 80%+ satisfaction across user types. ~300 trainees per co-op cycle, ~2 cycles/year (~600/year, per REQ-38).

Three roles: **Student/Trainee**, **HR**, **Training Coordinator**. Supervisors are not system users.

## Stack

| Layer | Choice |
|---|---|
| Backend framework | Express.js |
| Database | SQLite |
| ORM | Prisma |
| Backend hosting | Railway (SQLite file on a persistent volume) |
| Frontend | React (CRA), hosted on Vercel — calls this API over HTTP |
| Auth | JWT-based session tokens |
| Transactional email | Resend |

### Pinned dependency versions (confirmed, don't revisit without reason)

- **Express 4** (not 5) — Express 5's wildcard route syntax changes aren't needed here; avoids an unrelated breaking-change migration.
- **Prisma 6** (not 7) — Prisma 7 moved the datasource URL out of `schema.prisma` into a separate `prisma.config.ts`; more structural change than this project needs.
- **bcryptjs** (not native `bcrypt`) — native `bcrypt`'s build toolchain (`node-pre-gyp`) pulled in a CVE via `tar` and requires compiling native bindings on every Railway deploy, a common source of flaky builds on that platform. `bcryptjs` is API-compatible (same `hash`/`compare` calls), pure JS, no native build step. Performance difference is irrelevant at this project's scale.

### Email (Resend)

Used for all HR-triggered notification requirements: REQ-17 (accept → student, with credentials), REQ-18 (accept → university, separate email), REQ-20 (reject → student). Accept and reject both originate from one HR decision route (REQ-15/REQ-19) that branches by outcome — not separate systems. REQ-35 (non-functional) confirms all system notifications go out via email — consistent with this choice.

- Free tier: 3,000 emails/month, 100/day cap, 1 verified domain — comfortably covers ~300 trainees/cycle.
- **Domain: `maryamaladsani.site`** (owned) — verify this in Resend (Domains → Add Domain → add the given SPF/DKIM/DMARC DNS records) before building REQ-17/18/20 against real addresses. Suggested sender: `noreply@maryamaladsani.site` or a dedicated subdomain like `mail.maryamaladsani.site` to keep sending reputation separate from the rest of the site.
- Until verification completes, integration can only be smoke-tested by sending to the developer's own Resend signup email (sandbox restriction).
- Env var: `RESEND_API_KEY`. Do not use Nodemailer/Gmail SMTP or any other provider — Resend is the confirmed choice.

## Data model principles

- `User → Trainee/HR/Coordinator` is implemented as a **single `User` table with a `role` discriminator column**, not class-based inheritance. Role-specific fields/relations live in related tables joined by foreign key.
- This mirrors the frontend principle already in use: React is composition-oriented, not inheritance-oriented — role-based behavior via shared hooks/context/conditional rendering, not class hierarchies. Keep backend and frontend consistent on this.
- Track onboarding progress as a **single ordered milestone field per trainee** (see below) — not three independent parallel status fields.
- REQ-36: Coordinators must be scoped to only their assigned trainees at the query level, not filtered client-side — enforce in the data layer (e.g., a `coordinatorId` filter on every Coordinator-facing query), not just hidden in the UI.
- REQ-37: role-based access control applies across all three roles at the route/middleware level.
- REQ-43: lock an account after 10 consecutive failed login attempts.
- Contract signing (REQ-07/08) is a **standalone `contractSigned` field + timestamp**, separate from the milestone field — not one of the 7 sequence steps.

### Cross-role data consistency

Trainee state (department, division, coordinator assignment, milestone status, contract status, etc.) lives as fields on a **single canonical `Trainee` record** — never duplicated into per-role tables or cached copies. Every role's dashboard endpoint queries that same record, scoped differently: HR sees all, Coordinator sees `WHERE coordinatorId = me`, Student sees their own row only. A mutation (e.g., HR assigning a department) updates that one row — there is no separate sync step, because nothing was ever copied.

Consistency model: **refetch-on-load, not real-time push** (confirmed — no polling or WebSockets needed for this project). Every frontend dashboard component must fetch fresh data from the API on mount/navigation/refresh — never hold trainee data in state or a global store that outlives the page view. As long as each page asks the backend for current state every time it's opened, HR's changes will show up on the Coordinator and Student views the next time those pages load, with no extra plumbing required.

## Onboarding milestone sequence (confirmed, linear — supersedes earlier 3-track/9-milestone model)

1. Acceptance
2. Company Card
3. Department Assignment
4. Division Assignment
5. Account Credentials
6. Desk & Device
7. Certificate

**Confirmed:** Contract viewing/signing (REQ-07, REQ-08) is **not part of the 7-step milestone timeline**. It's tracked as a standalone action with its own status (e.g., `contractSigned: boolean` + timestamp on the trainee record), available once the account exists (post REQ-16) — independent of where the trainee sits in the milestone sequence. On the Student dashboard, this should render as a separate action item/card, not a node on the roadmap.

## Scope boundaries — explicitly out of scope

- Supervisors are not system users; HR assigns trainees directly to Coordinators, who assign to divisions.
- Department assignment data comes from an **external spreadsheet** — read-only reference data in COOP, not user-editable here.
- ISD card issuance is a **system-timed auto-transition only** (REQ-22: status auto-updates to "Issued" 2 hours after request) — no real third-party ISD integration.
- Missing-student and missing-document flags are resolved **outside the system** via direct HR contact — no in-system escalation workflow.
- HR/Coordinator account **provisioning is in-scope**: HR and Coordinator users sign up directly through the system (REQ-28) — self-service, no third-party provisioning tool needed.

All items are resolved — the earlier REQ-33 ID collision (desk/device request, logout, and login availability all sharing one ID) has been fixed in Notion (see REQ-50/REQ-51/REQ-52 below), and contract signing's placement is settled above.

## Functional requirements

### Student

| ID | Title | Description | Depends On |
|---|---|---|---|
| REQ-01 | Submit onboarding application | Single form capturing name, phone, birth date, personal email, university training email, university name, college, major, GPA, start/end date, duration, nationality, national ID, blood type, signature, personal image, university transcript, CV, IBAN, and university letter | — |
| REQ-02 | Capture referral source | "How did you hear about us" field on application | Within REQ-01 |
| REQ-03 | Conditional employee ID | Require referring employee's ID if referral indicates an employee | REQ-02 |
| REQ-04 | View onboarding status by track | Display onboarding progress to the student — build against the confirmed linear milestone model (see above) | Many |
| REQ-05 | View training details | View assigned training details once available | REQ-25, REQ-11 |
| REQ-06 | View general orientation content ("Your first Day in SE") | Static informational content describing a typical day at SE | REQ-15, REQ-16 |
| REQ-07 | Digitally view contract | Review contract *(standalone feature, not a milestone step — see Data model principles)* | REQ-15, REQ-16 |
| REQ-08 | Digitally sign contract | Trainee digitally signs their contract *(standalone feature, not a milestone step)* | REQ-07 |
| REQ-09 | Download final certificate | Download completion certificate as PDF once issued by HR | REQ-26 |

### HR

| ID | Title | Description | Depends On |
|---|---|---|---|
| REQ-15 | Accept student application | Accept a student application | REQ-01 |
| REQ-16 | Auto-create student COOP account | Auto-create trainee account upon acceptance | REQ-15 |
| REQ-17 | Notify student on acceptance | Auto-send acceptance email to student including COOP account credentials | REQ-15 |
| REQ-18 | Notify university on acceptance | Auto-send separate acceptance email to the university | REQ-15 |
| REQ-19 | Reject student application | Reject a student application | REQ-01 |
| REQ-20 | Notify student on rejection | Auto-send rejection email to student | REQ-19 |
| REQ-21 | Request card from ISD | Submit card request incl. student's image, signature, name, national ID, end date, nationality, blood type | REQ-15 |
| REQ-22 | Auto-transition card status to issued | Auto-update card status to "Issued" after 2 hours | REQ-21 |
| REQ-23 | View students database | List of all students with key details | REQ-01 |
| REQ-24 | View student profile | Detailed profile of an individual student | REQ-01 |
| REQ-25 | Assign students to Coordinator | Assign a batch of students to a Coordinator | REQ-15 |
| REQ-26 | Issue completion certificate | Issue completion certificate — enabled only after Coordinator confirms training completion (REQ-14) | REQ-14 |
| REQ-27 | Withdraw student training | Withdraw a student's training | REQ-15 |

### Training Coordinator

| ID | Title | Description | Depends On |
|---|---|---|---|
| REQ-10 | Request Company User Account | Request a Saudi Energy user account for assigned trainees | REQ-25 |
| REQ-50 | Request a desk and a device | Request a desk and device for assigned trainees | — |
| REQ-11 | Assign trainees to divisions | Assign trainees to divisions | REQ-25 |
| REQ-12 | View assigned trainee database | List of trainees assigned to this Coordinator | REQ-25 |
| REQ-13 | View assigned trainee profile | Detailed profile of a trainee assigned to them | REQ-25 |
| REQ-14 | Confirm training completion | Confirm an assigned trainee has completed training (gates REQ-26) | REQ-25 |

### Cross-cutting — Auth & Account Management

| ID | Title | Description |
|---|---|---|
| REQ-28 | HR/Coordinator signup | HR and Coordinator users sign up directly through the system (self-service — confirmed in-scope, no third-party provisioning tool needed) |
| REQ-29 | Student login | Log in using credentials created upon acceptance |
| REQ-30 | HR login | Log in with role-based credentials |
| REQ-31 | Coordinator login | Log in with role-based credentials |
| REQ-32 | Password reset | Reset a forgotten password via a verified channel (email) |
| REQ-52 | Logout | Log out of authenticated session |

## Non-functional requirements

| ID | Title | Description | Priority |
|---|---|---|---|
| REQ-51 | Login availability | HR, Coordinator, and Trainee accounts can log in any time the system is available | Must |
| REQ-34 | Hosting environment | Hosted on cloud — confirmed as Railway (backend) + Vercel (frontend), supersedes "TBD" | Must |
| REQ-35 | Notification method | All notifications sent via email — confirms Resend choice | Must |
| REQ-36 | Scoped data access | Coordinators restricted to viewing only their assigned students, not the full student database | Must |
| REQ-37 | Role-based access control | Enforce RBAC limiting functionality to Student, HR, and Training Coordinator roles | Must |
| REQ-38 | Handle trainee volume | Support processing 600 trainees/year without performance degradation | Must |
| REQ-39 | System availability | Available 24/7 | Should |
| REQ-40 | Language support | English only as primary interface language | Should |
| REQ-41 | Scalability | Accommodate future growth in trainee volume/departments without architectural redesign | Should |
| REQ-42 | Self-service password recovery | Allow a user to reset a forgotten password | Should |
| REQ-43 | Account lockout protection | Temporarily lock an account after 10 consecutive failed login attempts | Should |

## Recommended backend build order

1. **Prisma schema** — `User` (role discriminator) + role relation tables + milestone/status fields + division/department reference tables
2. **Project scaffolding** — Express app structure, environment config, Railway-ready setup
3. **Auth middleware** — JWT verification, role-based route guards, HR/Coordinator signup (REQ-28), login (REQ-29–REQ-31), password reset (REQ-32), logout (REQ-52), RBAC (REQ-37), lockout (REQ-43)
4. **Core routes per role** — one role end-to-end before the next (suggest starting with Coordinator, since that dashboard already exists on the frontend)
5. **Seed/test data** — once the database is ready, let trainees submit the actual apply form (REQ-01) directly rather than relying on seed data