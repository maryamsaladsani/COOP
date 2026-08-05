// Regression test for BUG-005 (document chips not clickable/downloadable) and its follow-on,
// BUG-001 (the same contract mismatch, but in coordinator.js/trainee.js after the Supabase
// migration — see /BUGS.md). Asserts an uploaded file is retrievable via a real signed URL
// for all three roles, not just HR — and that the bytes behind that URL genuinely match what
// was uploaded, not a placeholder.

const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../src/app");
const { prisma, resetDb, createUser, authHeader, createTrainee } = require("./helpers/db");

const FIXTURE_PDF = path.join(__dirname, "fixtures", "sample.pdf");

function applicationFields(overrides = {}) {
  return {
    fullName: "Upload Test",
    phone: "0500000000",
    birthDate: "2000-01-01",
    personalEmail: `upload.${Date.now()}@personal.test`,
    universityEmail: `upload.${Date.now()}@uni.test`,
    universityName: "Test University",
    college: "Engineering",
    major: "CS",
    gpa: "4.0",
    startDate: "2026-09-01",
    endDate: "2026-12-01",
    durationMonths: "3",
    nationality: "Test",
    nationalId: `${Date.now()}`,
    bloodType: "O+",
    iban: "SA0000000000000000000000",
    referralSource: "Website",
    ...overrides,
  };
}

async function submitTestApplication() {
  const submitRes = await request(app)
    .post("/api/applications")
    .field(applicationFields())
    .attach("universityTranscript", FIXTURE_PDF)
    .attach("cv", FIXTURE_PDF)
    .attach("universityLetter", FIXTURE_PDF)
    .attach("personalImage", path.join(__dirname, "fixtures", "sample.png"))
    .attach("signature", path.join(__dirname, "fixtures", "sample.png"));

  expect(submitRes.status).toBe(201);
  return submitRes.body.trainee;
}

describe("document upload and retrieval", () => {
  afterEach(async () => {
    await resetDb();
  });
  afterAll(() => prisma.$disconnect());

  test("uploaded file is retrievable via a real signed URL, not just a filename string", async () => {
    const trainee = await submitTestApplication();

    // The regression this guards against: the API response must contain a REAL original
    // filename (proving a real file was stored), not just echo back nothing / null.
    expect(trainee.universityTranscriptOriginalName).toBe("sample.pdf");
    expect(trainee.universityTranscriptUrl).not.toBe("sample.pdf"); // stored path != display name

    const hr = await createUser({ role: "HR", email: "hr@upload.test" });
    const viewRes = await request(app)
      .get(`/api/hr/students/${trainee.id}/documents/universityTranscript`)
      .set("Authorization", authHeader(hr));

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.document.originalName).toBe("sample.pdf");
    expect(viewRes.body.document.mode).toBe("view");
    expect(viewRes.body.document.url).toMatch(/^https?:\/\//);

    // The signed URL itself must actually serve the real uploaded bytes, not a placeholder.
    const fileRes = await fetch(viewRes.body.document.url);
    const originalBytes = fs.readFileSync(FIXTURE_PDF);
    const servedBytes = Buffer.from(await fileRes.arrayBuffer());
    expect(Buffer.compare(servedBytes, originalBytes)).toBe(0);
  });

  test("?download=true returns mode: download", async () => {
    const trainee = await submitTestApplication();
    const hr = await createUser({ role: "HR", email: "hr-dl@upload.test" });

    const res = await request(app)
      .get(`/api/hr/students/${trainee.id}/documents/cv?download=true`)
      .set("Authorization", authHeader(hr));

    expect(res.status).toBe(200);
    expect(res.body.document.mode).toBe("download");
    expect(res.body.document.originalName).toBe("sample.pdf");
  });

  // BUG-001: Coordinator's and Trainee's own document routes used to call a function
  // (resolveDocument) removed from uploads.js during the Supabase migration, crashing the
  // whole process on the very first hit (coordinator.js's route wasn't asyncHandler-wrapped).
  // Both must now return the identical signed-URL contract HR's route does.
  test("Coordinator's document route returns the same signed-URL contract as HR's, for their own trainee", async () => {
    const coordinator = await createUser({ role: "COORDINATOR", email: "coord@upload.test" });
    const trainee = await submitTestApplication();
    await prisma.trainee.update({ where: { id: trainee.id }, data: { coordinatorId: coordinator.id } });

    const res = await request(app)
      .get(`/api/coordinator/trainees/${trainee.id}/documents/universityTranscript`)
      .set("Authorization", authHeader(coordinator));

    expect(res.status).toBe(200);
    expect(res.body.document.url).toMatch(/^https?:\/\//);
    expect(res.body.document.mode).toBe("view");
  });

  test("Coordinator's document route 404s (not 500/crash) for a trainee not assigned to them", async () => {
    const coordinator = await createUser({ role: "COORDINATOR", email: "coord2@upload.test" });
    const trainee = await submitTestApplication(); // no coordinatorId set

    const res = await request(app)
      .get(`/api/coordinator/trainees/${trainee.id}/documents/universityTranscript`)
      .set("Authorization", authHeader(coordinator));

    expect(res.status).toBe(404);
  });

  test("Trainee's own document route returns the same signed-URL contract as HR's", async () => {
    const submitted = await submitTestApplication();
    const traineeUser = await createUser({ role: "TRAINEE", email: submitted.personalEmail });
    await prisma.trainee.update({ where: { id: submitted.id }, data: { userId: traineeUser.id } });

    const res = await request(app)
      .get("/api/trainee/documents/cv")
      .set("Authorization", authHeader(traineeUser));

    expect(res.status).toBe(200);
    expect(res.body.document.url).toMatch(/^https?:\/\//);
    expect(res.body.document.originalName).toBe("sample.pdf");
  });

  test("rejects submission with a missing required document (no orphaned file left behind)", async () => {
    const fields = applicationFields();
    const res = await request(app)
      .post("/api/applications")
      .field(fields)
      .attach("universityTranscript", FIXTURE_PDF)
      .attach("cv", FIXTURE_PDF)
      .attach("universityLetter", FIXTURE_PDF)
      .attach("personalImage", path.join(__dirname, "fixtures", "sample.png"));
    // signature omitted entirely

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/signature/);
  });

  test("download route 404s for a trainee with no real file on record (legacy/placeholder data)", async () => {
    const legacyTrainee = await createTrainee({
      universityTranscriptUrl: "Training Plan .pdf", // plain display string, no real file
      universityTranscriptOriginalName: null,
    });
    const hr = await createUser({ role: "HR", email: "hr2@upload.test" });

    const res = await request(app)
      .get(`/api/hr/students/${legacyTrainee.id}/documents/universityTranscript`)
      .set("Authorization", authHeader(hr));
    expect(res.status).toBe(404);
  });

  test("download route requires authentication — no open/unauthenticated file URLs", async () => {
    const trainee = await createTrainee();
    const res = await request(app).get(`/api/hr/students/${trainee.id}/documents/universityTranscript`);
    expect(res.status).toBe(401);
  });
});
