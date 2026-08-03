// DEV-ONLY test data for exercising the Phase 4 Coordinator routes.
//
// HR's assign-to-coordinator flow (REQ-25) doesn't exist yet, so there's no real path to
// get a Trainee assigned to a Coordinator. This script is a stand-in that creates two test
// Coordinators and a handful of Trainees pre-assigned to them at varying milestones. It is
// NOT an implementation of REQ-25 — just enough fixture data for the Coordinator endpoints
// (REQ-10/11/12/13/14/50) to have something real to act on. Safe to stop using once REQ-25
// is built and real assignment data exists.
//
// Run with: node prisma/seed-coordinator-test.js

const bcrypt = require("bcryptjs");
const prisma = require("../src/lib/prisma");

const SALT_ROUNDS = 10;
const TEST_PASSWORD = "coordinator-test-pass1";

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function upsertCoordinator(email, fullName) {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashedPassword, fullName, role: "COORDINATOR" },
  });
}

async function upsertTrainee(coordinatorId, data) {
  const base = {
    phone: "0500000000",
    birthDate: new Date("2001-01-01"),
    universityName: "King Fahd University",
    college: "Engineering",
    major: "Computer Science",
    gpa: 3.5,
    startDate: new Date(),
    endDate: daysFromNow(90),
    durationMonths: 3,
    nationality: "Saudi",
    bloodType: "O+",
    signatureUrl: "https://example.com/signature.png",
    personalImageUrl: "https://example.com/photo.png",
    universityTranscriptUrl: "https://example.com/transcript.pdf",
    cvUrl: "https://example.com/cv.pdf",
    iban: "SA0000000000000000000000",
    universityLetterUrl: "https://example.com/letter.pdf",
    referralSource: "University career fair",
    applicationStatus: "ACCEPTED",
    acceptedAt: new Date(),
  };

  const full = { ...base, ...data, coordinatorId };

  return prisma.trainee.upsert({
    where: { personalEmail: data.personalEmail },
    update: full,
    create: full,
  });
}

async function main() {
  const coordinatorA = await upsertCoordinator("coordinator.a@test.coop", "Coordinator A");
  const coordinatorB = await upsertCoordinator("coordinator.b@test.coop", "Coordinator B");

  console.log(`Coordinator A: ${coordinatorA.email} / password: ${TEST_PASSWORD}`);
  console.log(`Coordinator B: ${coordinatorB.email} / password: ${TEST_PASSWORD}`);

  // Coordinator A: one trainee sitting at each milestone the Coordinator routes act on.
  await upsertTrainee(coordinatorA.id, {
    fullName: "Trainee At Department",
    personalEmail: "trainee.dept@test.coop",
    universityEmail: "trainee.dept@uni.test",
    nationalId: "1000000001",
    milestone: "DEPARTMENT_ASSIGNMENT",
  });

  await upsertTrainee(coordinatorA.id, {
    fullName: "Trainee At Division",
    personalEmail: "trainee.division@test.coop",
    universityEmail: "trainee.division@uni.test",
    nationalId: "1000000002",
    milestone: "DIVISION_ASSIGNMENT",
    division: "Finance",
  });

  await upsertTrainee(coordinatorA.id, {
    fullName: "Trainee At Account Credentials",
    personalEmail: "trainee.account@test.coop",
    universityEmail: "trainee.account@uni.test",
    nationalId: "1000000003",
    milestone: "ACCOUNT_CREDENTIALS",
    division: "IT",
  });

  await upsertTrainee(coordinatorA.id, {
    fullName: "Trainee At Desk Device",
    personalEmail: "trainee.deskdevice@test.coop",
    universityEmail: "trainee.deskdevice@uni.test",
    nationalId: "1000000004",
    milestone: "DESK_DEVICE",
    division: "Operations",
  });

  // Coordinator B: a trainee of their own, so tests can confirm A can't see or act on it
  // (REQ-36 scoping).
  await upsertTrainee(coordinatorB.id, {
    fullName: "Coordinator B's Trainee",
    personalEmail: "trainee.b1@test.coop",
    universityEmail: "trainee.b1@uni.test",
    nationalId: "2000000001",
    milestone: "DIVISION_ASSIGNMENT",
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
