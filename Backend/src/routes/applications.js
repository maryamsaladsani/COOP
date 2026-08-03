// Public application submission — REQ-01/02/03. No auth: applicants don't have an account
// yet (accounts are only created by HR's accept flow, REQ-16). Mounted at /api/applications,
// outside requireAuth.

const express = require("express");

const prisma = require("../lib/prisma");
const asyncHandler = require("../lib/asyncHandler");

const router = express.Router();

const REQUIRED_FIELDS = [
  "fullName",
  "phone",
  "birthDate",
  "personalEmail",
  "universityEmail",
  "universityName",
  "college",
  "major",
  "gpa",
  "startDate",
  "endDate",
  "durationMonths",
  "nationality",
  "nationalId",
  "bloodType",
  "signatureUrl",
  "personalImageUrl",
  "universityTranscriptUrl",
  "cvUrl",
  "iban",
  "universityLetterUrl",
  "referralSource",
];

// REQ-03: no fixed vocabulary is defined anywhere in the requirements for what referralSource
// value "indicates an employee" — ASSUMPTION: treated as a case-insensitive substring match
// on "employee" (e.g. a frontend value like "Employee Referral"). If the frontend instead uses
// a fixed dropdown with a different exact value, swap this for an exact match against it.
function indicatesEmployeeReferral(referralSource) {
  return /employee/i.test(referralSource);
}

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body || {};

    const missing = REQUIRED_FIELDS.filter(
      (field) => body[field] === undefined || body[field] === null || body[field] === ""
    );
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required field(s): ${missing.join(", ")}` });
    }

    const isEmployeeReferral = indicatesEmployeeReferral(body.referralSource);
    if (isEmployeeReferral && !body.referringEmployeeId) {
      return res
        .status(400)
        .json({ message: "referringEmployeeId is required when referralSource indicates an employee" });
    }

    const birthDate = new Date(body.birthDate);
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const gpa = Number(body.gpa);
    const durationMonths = Number(body.durationMonths);

    if ([birthDate, startDate, endDate].some((d) => Number.isNaN(d.getTime()))) {
      return res.status(400).json({ message: "birthDate, startDate, and endDate must be valid dates" });
    }
    if (Number.isNaN(gpa) || Number.isNaN(durationMonths)) {
      return res.status(400).json({ message: "gpa and durationMonths must be numeric" });
    }

    try {
      const trainee = await prisma.trainee.create({
        data: {
          fullName: body.fullName,
          phone: body.phone,
          birthDate,
          personalEmail: body.personalEmail,
          universityEmail: body.universityEmail,
          universityName: body.universityName,
          college: body.college,
          major: body.major,
          gpa,
          startDate,
          endDate,
          durationMonths,
          nationality: body.nationality,
          nationalId: body.nationalId,
          bloodType: body.bloodType,
          signatureUrl: body.signatureUrl,
          personalImageUrl: body.personalImageUrl,
          universityTranscriptUrl: body.universityTranscriptUrl,
          cvUrl: body.cvUrl,
          iban: body.iban,
          universityLetterUrl: body.universityLetterUrl,
          referralSource: body.referralSource,
          referringEmployeeId: isEmployeeReferral ? body.referringEmployeeId : null,
          // applicationStatus defaults to PENDING, userId stays null until REQ-16 (see schema).
        },
      });

      return res.status(201).json({ trainee });
    } catch (err) {
      if (err.code === "P2002") {
        return res
          .status(409)
          .json({ message: "An application with that email or national ID already exists" });
      }
      throw err;
    }
  })
);

module.exports = router;
