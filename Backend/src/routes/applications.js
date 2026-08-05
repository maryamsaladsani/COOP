// Public application submission — REQ-01/02/03.
// No auth: applicants do not have an account yet.
// Accounts are only created by HR after acceptance (REQ-16).
// Mounted at /api/applications, outside requireAuth.

const crypto = require("crypto");
const express = require("express");

const prisma = require("../lib/prisma");
const asyncHandler = require("../lib/asyncHandler");
const {
  upload,
  DOCUMENT_FIELD_KEYS,
  uploadDocument,
  deleteStoragePaths,
} = require("../lib/uploads");

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

// Client-side accept attributes are only a UX hint.
// This allowlist is the real server-side validation.
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const uploadDocuments = upload.fields(
  DOCUMENT_FIELD_KEYS.map((name) => ({
    name,
    maxCount: 1,
  }))
);

// REQ-03 assumption:
// Any referralSource containing "employee" means referringEmployeeId is required.
function indicatesEmployeeReferral(referralSource) {
  return /employee/i.test(String(referralSource || ""));
}

router.post(
  "/",
  uploadDocuments,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const files = req.files || {};

    const missingText = REQUIRED_TEXT_FIELDS.filter((field) => {
      const value = body[field];

      return (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      );
    });

    const missingFiles = DOCUMENT_FIELD_KEYS.filter(
      (field) => !files[field]?.[0]
    );

    if (missingText.length > 0 || missingFiles.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${[
          ...missingText,
          ...missingFiles,
        ].join(", ")}`,
      });
    }

    const invalidType = DOCUMENT_FIELD_KEYS.find((field) => {
      const file = files[field]?.[0];

      return !file || !ALLOWED_MIME_TYPES.has(file.mimetype);
    });

    if (invalidType) {
      return res.status(400).json({
        message:
          `${invalidType} must be a PDF, Word document, or image file ` +
          `(got ${files[invalidType]?.[0]?.mimetype || "unknown type"})`,
      });
    }

    const isEmployeeReferral = indicatesEmployeeReferral(
      body.referralSource
    );

    if (
      isEmployeeReferral &&
      !String(body.referringEmployeeId || "").trim()
    ) {
      return res.status(400).json({
        message:
          "referringEmployeeId is required when referralSource indicates an employee",
      });
    }

    const birthDate = new Date(body.birthDate);
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    const gpa = Number(body.gpa);
    const durationMonths = Number(body.durationMonths);

    if (
      [birthDate, startDate, endDate].some((date) =>
        Number.isNaN(date.getTime())
      )
    ) {
      return res.status(400).json({
        message:
          "birthDate, startDate, and endDate must be valid dates",
      });
    }

    if (!Number.isFinite(gpa) || !Number.isFinite(durationMonths)) {
      return res.status(400).json({
        message: "gpa and durationMonths must be numeric",
      });
    }

    if (durationMonths <= 0) {
      return res.status(400).json({
        message: "durationMonths must be greater than zero",
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        message: "endDate cannot be earlier than startDate",
      });
    }

    const traineeId = crypto.randomUUID();
    const uploadedPaths = [];

    try {
      const uploadedDocuments = {};

      for (const field of DOCUMENT_FIELD_KEYS) {
        const uploaded = await uploadDocument({
          traineeId,
          field,
          file: files[field][0],
        });

        uploadedDocuments[field] = uploaded;
        uploadedPaths.push(uploaded.storagePath);
      }

      const trainee = await prisma.trainee.create({
        data: {
          id: traineeId,

          fullName: String(body.fullName).trim(),
          phone: String(body.phone).trim(),
          birthDate,

          personalEmail: String(body.personalEmail)
            .trim()
            .toLowerCase(),

          universityEmail: String(body.universityEmail)
            .trim()
            .toLowerCase(),

          universityName: String(body.universityName).trim(),
          college: String(body.college).trim(),
          major: String(body.major).trim(),

          gpa,
          startDate,
          endDate,
          durationMonths,

          nationality: String(body.nationality).trim(),
          nationalId: String(body.nationalId).trim(),
          bloodType: String(body.bloodType).trim(),

          signatureUrl:
            uploadedDocuments.signature.storagePath,

          signatureOriginalName:
            uploadedDocuments.signature.originalName,

          personalImageUrl:
            uploadedDocuments.personalImage.storagePath,

          personalImageOriginalName:
            uploadedDocuments.personalImage.originalName,

          universityTranscriptUrl:
            uploadedDocuments.universityTranscript.storagePath,

          universityTranscriptOriginalName:
            uploadedDocuments.universityTranscript.originalName,

          cvUrl:
            uploadedDocuments.cv.storagePath,

          cvOriginalName:
            uploadedDocuments.cv.originalName,

          iban: String(body.iban).trim(),

          universityLetterUrl:
            uploadedDocuments.universityLetter.storagePath,

          universityLetterOriginalName:
            uploadedDocuments.universityLetter.originalName,

          referralSource: String(body.referralSource).trim(),

          referringEmployeeId: isEmployeeReferral
            ? String(body.referringEmployeeId).trim()
            : null,

          // applicationStatus defaults to PENDING.
          // userId remains null until HR accepts the application.
        },
      });

      return res.status(201).json({
        message: "Application submitted successfully",
        trainee,
      });
    } catch (err) {
      await deleteStoragePaths(uploadedPaths);

      if (err.code === "P2002") {
        return res.status(409).json({
          message:
            "An application with that email or national ID already exists",
        });
      }

      throw err;
    }
  })
);

module.exports = router;