-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trainee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "personalEmail" TEXT NOT NULL,
    "universityEmail" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "gpa" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "nationality" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "bloodType" TEXT NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "personalImageUrl" TEXT NOT NULL,
    "universityTranscriptUrl" TEXT NOT NULL,
    "cvUrl" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "universityLetterUrl" TEXT NOT NULL,
    "referralSource" TEXT NOT NULL,
    "referringEmployeeId" TEXT,
    "applicationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptedAt" DATETIME,
    "rejectedAt" DATETIME,
    "milestone" TEXT NOT NULL DEFAULT 'ACCEPTANCE',
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "contractSignedAt" DATETIME,
    "coordinatorId" TEXT,
    "division" TEXT,
    "departmentId" TEXT,
    "cardStatus" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    "cardRequestedAt" DATETIME,
    "cardIssuedAt" DATETIME,
    "accountRequested" BOOLEAN NOT NULL DEFAULT false,
    "accountRequestedAt" DATETIME,
    "deskDeviceRequested" BOOLEAN NOT NULL DEFAULT false,
    "deskDeviceRequestedAt" DATETIME,
    "trainingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "trainingCompletedAt" DATETIME,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "certificateIssuedAt" DATETIME,
    "withdrawn" BOOLEAN NOT NULL DEFAULT false,
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trainee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Trainee_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Trainee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trainee" ("acceptedAt", "applicationStatus", "birthDate", "bloodType", "cardIssuedAt", "cardRequestedAt", "cardStatus", "certificateIssued", "certificateIssuedAt", "college", "contractSigned", "contractSignedAt", "coordinatorId", "createdAt", "cvUrl", "departmentId", "division", "durationMonths", "endDate", "fullName", "gpa", "iban", "id", "major", "milestone", "nationalId", "nationality", "personalEmail", "personalImageUrl", "phone", "referralSource", "referringEmployeeId", "rejectedAt", "signatureUrl", "startDate", "trainingCompleted", "trainingCompletedAt", "universityEmail", "universityLetterUrl", "universityName", "universityTranscriptUrl", "updatedAt", "userId", "withdrawn", "withdrawnAt") SELECT "acceptedAt", "applicationStatus", "birthDate", "bloodType", "cardIssuedAt", "cardRequestedAt", "cardStatus", "certificateIssued", "certificateIssuedAt", "college", "contractSigned", "contractSignedAt", "coordinatorId", "createdAt", "cvUrl", "departmentId", "division", "durationMonths", "endDate", "fullName", "gpa", "iban", "id", "major", "milestone", "nationalId", "nationality", "personalEmail", "personalImageUrl", "phone", "referralSource", "referringEmployeeId", "rejectedAt", "signatureUrl", "startDate", "trainingCompleted", "trainingCompletedAt", "universityEmail", "universityLetterUrl", "universityName", "universityTranscriptUrl", "updatedAt", "userId", "withdrawn", "withdrawnAt" FROM "Trainee";
DROP TABLE "Trainee";
ALTER TABLE "new_Trainee" RENAME TO "Trainee";
CREATE UNIQUE INDEX "Trainee_userId_key" ON "Trainee"("userId");
CREATE UNIQUE INDEX "Trainee_personalEmail_key" ON "Trainee"("personalEmail");
CREATE UNIQUE INDEX "Trainee_nationalId_key" ON "Trainee"("nationalId");
CREATE INDEX "Trainee_coordinatorId_idx" ON "Trainee"("coordinatorId");
CREATE INDEX "Trainee_departmentId_idx" ON "Trainee"("departmentId");
CREATE INDEX "Trainee_applicationStatus_idx" ON "Trainee"("applicationStatus");
CREATE INDEX "Trainee_milestone_idx" ON "Trainee"("milestone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
