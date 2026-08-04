// Shared test helpers: DB cleanup + factories, so individual test files don't repeat
// 20-field Trainee objects or JWT-signing boilerplate. Uses the SAME prisma client the app
// uses (src/lib/prisma.js) — by the time this is required, tests/setup/testEnv.js has
// already pointed DATABASE_URL at test.db (see jest.config.js's setupFiles).

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../src/lib/prisma");
const env = require("../../src/config/env");

const TEST_PASSWORD = "test-password-123";

// Deletion order matters: Division -> Department has an ON DELETE RESTRICT FK (deleting a
// Department that still has Divisions fails), so Divisions must go first. Trainee/User have
// no such constraint on each other (their FKs are ON DELETE SET NULL) so order between them
// doesn't matter.
async function resetDb() {
  await prisma.trainee.deleteMany();
  await prisma.division.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser({ role, email, fullName = "Test User", password = TEST_PASSWORD }) {
  const hashedPassword = await bcrypt.hash(password, 4); // low cost factor — tests don't need real security
  return prisma.user.create({ data: { email, password: hashedPassword, fullName, role } });
}

// Matches the payload shape src/middleware/auth.js's requireAuth expects exactly.
function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, { expiresIn: "1h" });
}

function authHeader(user) {
  return `Bearer ${signToken(user)}`;
}

async function createDepartment({ name, coordinatorId = null, divisions = [] } = {}) {
  const department = await prisma.department.create({
    data: { name: name || `Test Department ${Date.now()}-${Math.random()}`, coordinatorId },
  });
  for (const divisionName of divisions) {
    await prisma.division.create({ data: { departmentId: department.id, name: divisionName } });
  }
  return prisma.department.findUnique({ where: { id: department.id }, include: { divisions: true } });
}

let traineeCounter = 0;

// All REQ-01 fields filled with sensible defaults so callers only need to override what
// their test actually cares about (applicationStatus, milestone, contractSigned, etc.).
async function createTrainee(overrides = {}) {
  traineeCounter += 1;
  const n = traineeCounter;
  const base = {
    fullName: `Test Trainee ${n}`,
    phone: "0500000000",
    birthDate: new Date("2000-01-01"),
    personalEmail: `trainee${n}.${Date.now()}@personal.test`,
    universityEmail: `trainee${n}.${Date.now()}@uni.test`,
    universityName: "Test University",
    college: "Engineering",
    major: "Computer Science",
    gpa: 3.5,
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-12-01"),
    durationMonths: 3,
    nationality: "Test",
    nationalId: `${1000000000 + n}-${Date.now()}`,
    bloodType: "O+",
    signatureUrl: "placeholder-signature.png",
    personalImageUrl: "placeholder-photo.png",
    universityTranscriptUrl: "placeholder-transcript.pdf",
    cvUrl: "placeholder-cv.pdf",
    iban: "SA0000000000000000000000",
    universityLetterUrl: "placeholder-letter.pdf",
    referralSource: "Website",
    applicationStatus: "ACCEPTED",
    acceptedAt: new Date(),
  };
  return prisma.trainee.create({ data: { ...base, ...overrides } });
}

module.exports = { prisma, resetDb, createUser, signToken, authHeader, createDepartment, createTrainee, TEST_PASSWORD };
