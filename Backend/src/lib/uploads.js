// Storage + shared metadata for REQ-01's five application documents. Single source of
// truth for the field-key <-> DB-column mapping so the upload route (applications.js) and
// the three per-role download routes (hr.js/coordinator.js/trainee.js) can't drift apart —
// and so the download routes only ever accept a field key from this allowlist, never an
// arbitrary user-supplied column/path.

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");

// field key (used in the multipart form + the :field download route param) -> the pair of
// Trainee columns holding the stored filename and the human-readable original filename.
const DOCUMENT_FIELDS = {
  signature: { urlColumn: "signatureUrl", nameColumn: "signatureOriginalName" },
  personalImage: { urlColumn: "personalImageUrl", nameColumn: "personalImageOriginalName" },
  universityTranscript: { urlColumn: "universityTranscriptUrl", nameColumn: "universityTranscriptOriginalName" },
  cv: { urlColumn: "cvUrl", nameColumn: "cvOriginalName" },
  universityLetter: { urlColumn: "universityLetterUrl", nameColumn: "universityLetterOriginalName" },
};

const DOCUMENT_FIELD_KEYS = Object.keys(DOCUMENT_FIELDS);

fs.mkdirSync(env.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadsDir),
  // Server-generated name only — never derived from the client-supplied original
  // filename, so there's no path-traversal or collision surface from user input.
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`),
});

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — generous for a scan/photo, not unbounded

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE_BYTES } });

// applications.js calls this for req.files after a validation failure, so a rejected
// submission doesn't leave orphaned files behind on disk.
function deleteUploadedFiles(files) {
  if (!files) return;
  Object.values(files)
    .flat()
    .forEach((file) => fs.unlink(file.path, () => {}));
}

// Resolves a trainee + field key to the file's absolute path and original filename.
// Returns null if the field key is unknown, or if no real file is on record for it
// (including legacy rows from before file upload existed — see schema.prisma comment).
function resolveDocument(trainee, field) {
  const columns = DOCUMENT_FIELDS[field];
  if (!columns) return null;

  const originalName = trainee[columns.nameColumn];
  const storedFilename = trainee[columns.urlColumn];
  if (!originalName || !storedFilename) return null;

  return { absolutePath: path.join(env.uploadsDir, storedFilename), originalName };
}

module.exports = { upload, DOCUMENT_FIELDS, DOCUMENT_FIELD_KEYS, deleteUploadedFiles, resolveDocument };
