// Shared upload configuration and document metadata for REQ-01.
// Files are held temporarily in memory by Multer, then uploaded to the
// private Supabase Storage bucket by applications.js.

const crypto = require("crypto");
const path = require("path");
const multer = require("multer");

const { supabase } = require("./supabase");

const STORAGE_BUCKET = "application-documents";

// Multipart form field key -> Trainee database columns.
const DOCUMENT_FIELDS = {
  signature: {
    urlColumn: "signatureUrl",
    nameColumn: "signatureOriginalName",
  },
  personalImage: {
    urlColumn: "personalImageUrl",
    nameColumn: "personalImageOriginalName",
  },
  universityTranscript: {
    urlColumn: "universityTranscriptUrl",
    nameColumn: "universityTranscriptOriginalName",
  },
  cv: {
    urlColumn: "cvUrl",
    nameColumn: "cvOriginalName",
  },
  universityLetter: {
    urlColumn: "universityLetterUrl",
    nameColumn: "universityLetterOriginalName",
  },
};

const DOCUMENT_FIELD_KEYS = Object.keys(DOCUMENT_FIELDS);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Files are not written to Backend/uploads.
// Multer exposes each uploaded file through file.buffer.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: DOCUMENT_FIELD_KEYS.length,
  },
});

function sanitizeExtension(originalName) {
  const extension = path.extname(originalName || "").toLowerCase();

  // Keep the extension short and predictable.
  return /^[.][a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

function createStoragePath(traineeId, field, originalName) {
  const extension = sanitizeExtension(originalName);

  return `trainees/${traineeId}/${field}/${crypto.randomUUID()}${extension}`;
}

async function uploadDocument({
  traineeId,
  field,
  file,
}) {
  if (!DOCUMENT_FIELDS[field]) {
    throw new Error(`Unsupported document field: ${field}`);
  }

  if (!file?.buffer) {
    throw new Error(`Missing file buffer for: ${field}`);
  }

  const storagePath = createStoragePath(
    traineeId,
    field,
    file.originalname
  );

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Failed to upload ${field} to Supabase: ${error.message}`
    );
  }

  return {
    storagePath,
    originalName: file.originalname,
  };
}

async function deleteStoragePaths(storagePaths) {
  const paths = storagePaths.filter(Boolean);

  if (paths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(paths);

  if (error) {
    console.error(
      "[storage] Could not remove uploaded files:",
      error
    );
  }
}

async function createDocumentSignedUrl(
  trainee,
  field,
  expiresInSeconds = 300,
  download = false
) {
  const columns = DOCUMENT_FIELDS[field];

  if (!columns) {
    return null;
  }

  const storagePath = trainee[columns.urlColumn];
  const originalName = trainee[columns.nameColumn];

  if (!storagePath || !originalName) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds, {
      download: download ? originalName : false,
    });

  if (error) {
    throw new Error(
      `Failed to create document URL: ${error.message}`
    );
  }

  return {
    url: data.signedUrl,
    originalName,
  };
}

module.exports = {
  upload,
  STORAGE_BUCKET,
  DOCUMENT_FIELDS,
  DOCUMENT_FIELD_KEYS,
  uploadDocument,
  deleteStoragePaths,
  createDocumentSignedUrl,
};