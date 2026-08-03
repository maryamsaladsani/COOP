-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "resetToken" TEXT,
    "resetTokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trainee" (
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

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "branch" TEXT NOT NULL,
    "businessLine" TEXT NOT NULL,
    "buildingNumber" TEXT NOT NULL,
    "floorNumber" TEXT NOT NULL,
    CONSTRAINT "Department_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Trainee_userId_key" ON "Trainee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Trainee_personalEmail_key" ON "Trainee"("personalEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Trainee_nationalId_key" ON "Trainee"("nationalId");

-- CreateIndex
CREATE INDEX "Trainee_coordinatorId_idx" ON "Trainee"("coordinatorId");

-- CreateIndex
CREATE INDEX "Trainee_departmentId_idx" ON "Trainee"("departmentId");

-- CreateIndex
CREATE INDEX "Trainee_applicationStatus_idx" ON "Trainee"("applicationStatus");

-- CreateIndex
CREATE INDEX "Trainee_milestone_idx" ON "Trainee"("milestone");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_coordinatorId_idx" ON "Department"("coordinatorId");
