// Public application submission — REQ-01/02/03. No auth: applicants don't have an account
// yet (accounts are only created by HR's accept flow, REQ-16). Mounted at /api/applications,
// outside requireAuth.

const express = require("express");

const prisma = require("../lib/prisma");
const asyncHandler = require("../lib/asyncHandler");
const { upload, DOCUMENT_FIELD_KEYS, deleteUploadedFiles } = require("../lib/uploads");

const router = express.Router();

const REQUIRED_TEXT_FIELDS = [
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
  "iban",
  "referralSource",
];

// Matches the frontend's FileField accept attrs (.pdf/.doc/.docx for documents, image/*
// for the photo + signature) — client-side accept is a UX hint only, this is the real check.
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const uploadDocuments = upload.fields(DOCUMENT_FIELD_KEYS.map((name) => ({ name, maxCount: 1 })));

// REQ-03: no fixed vocabulary is defined anywhere in the requirements for what referralSource
// value "indicates an employee" — ASSUMPTION: treated as a case-insensitive substring match
// on "employee" (e.g. a frontend value like "Employee Referral"). If the frontend instead uses
// a fixed dropdown with a different exact value, swap this for an exact match against it.
function indicatesEmployeeReferral(referralSource) {
  return /employee/i.test(referralSource);
}

router.post(
  "/",
  uploadDocuments,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const files = req.files || {};

    const missingText = REQUIRED_TEXT_FIELDS.filter(
      (field) => body[field] === undefined || body[field] === null || body[field] === ""
    );
    const missingFiles = DOCUMENT_FIELD_KEYS.filter((field) => !files[field]?.[0]);
    if (missingText.length > 0 || missingFiles.length > 0) {
      deleteUploadedFiles(files);
      return res.status(400).json({
        message: `Missing required field(s): ${[...missingText, ...missingFiles].join(", ")}`,
      });
    }

    const invalidType = DOCUMENT_FIELD_KEYS.find((field) => !ALLOWED_MIME_TYPES.has(files[field][0].mimetype));
    if (invalidType) {
      deleteUploadedFiles(files);
      return res.status(400).json({
        message: `${invalidType} must be a PDF, Word document, or image file (got ${files[invalidType][0].mimetype})`,
      });
    }

    const isEmployeeReferral = indicatesEmployeeReferral(body.referralSource);
    if (isEmployeeReferral && !body.referringEmployeeId) {
      deleteUploadedFiles(files);
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
      deleteUploadedFiles(files);
      return res.status(400).json({ message: "birthDate, startDate, and endDate must be valid dates" });
    }
    if (Number.isNaN(gpa) || Number.isNaN(durationMonths)) {
      deleteUploadedFiles(files);
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
          signatureUrl: files.signature[0].filename,
          signatureOriginalName: files.signature[0].originalname,
          personalImageUrl: files.personalImage[0].filename,
          personalImageOriginalName: files.personalImage[0].originalname,
          universityTranscriptUrl: files.universityTranscript[0].filename,
          universityTranscriptOriginalName: files.universityTranscript[0].originalname,
          cvUrl: files.cv[0].filename,
          cvOriginalName: files.cv[0].originalname,
          iban: body.iban,
          universityLetterUrl: files.universityLetter[0].filename,
          universityLetterOriginalName: files.universityLetter[0].originalname,
          referralSource: body.referralSource,
          referringEmployeeId: isEmployeeReferral ? body.referringEmployeeId : null,
          // applicationStatus defaults to PENDING, userId stays null until REQ-16 (see schema).
        },
      });

      return res.status(201).json({ trainee });
    } catch (err) {
      deleteUploadedFiles(files);
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
