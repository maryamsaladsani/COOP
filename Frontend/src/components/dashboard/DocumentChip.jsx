import { useState } from 'react';
import { apiDownload } from '../../data/apiClient';
import './DocumentChip.css';

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15.5v1a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Triggers a real browser download from an authenticated API response (apiDownload
// fetches with the Bearer token attached — a plain <a href> can't do that here, since
// REQ-01 documents must stay behind role/ownership checks, never a public file URL).
function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'document';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// One clickable chip for one application document. `downloadPath` is the caller's
// role-appropriate authenticated route (HR/Coordinator/Trainee each hit a different
// prefix but the same :field convention — see Backend/src/lib/uploads.js).
function DocumentChip({ label, fileName, available, downloadPath }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!available) {
    return (
      <span className="doc-chip doc-chip--disabled" title="Original file not available">
        {fileName || label}
      </span>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const { blob, filename } = await apiDownload(downloadPath);
      triggerBrowserDownload(blob, filename || fileName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="doc-chip doc-chip--clickable"
      onClick={handleClick}
      disabled={loading}
      title={error || `Download ${fileName || label}`}
    >
      <span className="doc-chip__name">{fileName || label}</span>
      <span className="doc-chip__icon" aria-hidden="true">
        <DownloadIcon />
      </span>
    </button>
  );
}

// Renders all five REQ-01 documents for a trainee record. `buildDownloadPath(field)`
// lets each caller (HR/Coordinator/Trainee page) supply its own role-scoped route.
function DocumentChipList({ documents, buildDownloadPath, className = '' }) {
  return (
    <div className={`doc-list ${className}`}>
      {documents.map((doc) => (
        <DocumentChip
          key={doc.field}
          label={doc.label}
          fileName={doc.fileName}
          available={doc.available}
          downloadPath={doc.available ? buildDownloadPath(doc.field) : null}
        />
      ))}
    </div>
  );
}

export default DocumentChipList;
