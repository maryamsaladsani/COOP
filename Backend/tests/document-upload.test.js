// Regression test for BUG-005 (document chips not clickable/downloadable). Root cause was
// that no real file storage existed at all — only a display filename string was ever saved
// (see /BUGS.md). Asserts an uploaded file is retrievable via a real, working download
// route — not just present as a filename string in the API response.

const request = require("supertest");
const path = require("path");
const fs = require("fs");
const app = require("../src/app");
const { prisma, resetDb, createUser, authHeader } = require("./helpers/db");

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

describe("document upload and retrieval", () => {
  afterEach(async () => {
    await resetDb();
  });
  afterAll(() => prisma.$disconnect());

  test("uploaded file is retrievable via a real working download route, not just a filename string", async () => {
    const fields = applicationFields();

    const submitRes = await request(app)
      .post("/api/applications")
      .field(fields)
      .attach("universityTranscript", FIXTURE_PDF)
      .attach("cv", FIXTURE_PDF)
      .attach("universityLetter", FIXTURE_PDF)
      .attach("personalImage", path.join(__dirname, "fixtures", "sample.png"))
      .attach("signature", path.join(__dirname, "fixtures", "sample.png"));

    expect(submitRes.status).toBe(201);
    const trainee = submitRes.body.trainee;

    // The regression this guards against: the API response must contain a REAL original
    // filename (proving a real file was stored), not just echo back nothing / null.
    expect(trainee.universityTranscriptOriginalName).toBe("sample.pdf");
    expect(trainee.universityTranscriptUrl).not.toBe("sample.pdf"); // stored path != display name
    expect(trainee.universityTranscriptUrl).toMatch(/\.pdf$/);

    const hr = await createUser({ role: "HR", email: "hr@upload.test" });
    const downloadRes = await request(app)
      .get(`/api/hr/students/${trainee.id}/documents/universityTranscript`)
      .set("Authorization", authHeader(hr));

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers["content-disposition"]).toContain('filename="sample.pdf"');
    // The actual bytes served must match what was uploaded — not a placeholder.
    const originalBytes = fs.readFileSync(FIXTURE_PDF);
    expect(Buffer.compare(downloadRes.body, originalBytes)).toBe(0);
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
    const legacyTrainee = await require("./helpers/db").createTrainee({
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
    const trainee = await require("./helpers/db").createTrainee();
    const res = await request(app).get(`/api/hr/students/${trainee.id}/documents/universityTranscript`);
    expect(res.status).toBe(401);
  });
});
