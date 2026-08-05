import { useState } from 'react';
import Button from '../Button';
import './DocumentChip.css';

// One row for one application document. Deliberately knows nothing about which role's API
// route it's hitting — `onView`/`onDownload` are supplied by the page (HR/Coordinator/
// Trainee), each pointed at that role's own endpoint. See Frontend/src/data/documentActions.js
// for the shared fetch+open / fetch+download logic those callbacks are built from.
function DocumentChip({ label, fileName, available, onView, onDownload }) {
  const [loadingAction, setLoadingAction] = useState(null); // 'view' | 'download' | null
  const [error, setError] = useState('');

  if (!available) {
    return (
      <span className="doc-chip doc-chip--disabled" title="Original file not available">
        {fileName || label}
      </span>
    );
  }

  const busy = loadingAction !== null;

  const run = (action, handler) => async () => {
    if (busy) return; // prevent duplicate clicks while a request for this chip is in flight
    setLoadingAction(action);
    setError('');
    try {
      await handler();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleView = run('view', () => onView());
  const handleDownload = run('download', () => onDownload());

  return (
    <div className="doc-chip doc-chip--interactive">
      <span className="doc-chip__name">{fileName || label}</span>
      <span className="doc-chip__actions">
        <Button variant="text" size="sm" onClick={handleView} disabled={busy} loading={loadingAction === 'view'}>
          View
        </Button>
        <Button variant="text" size="sm" onClick={handleDownload} disabled={busy} loading={loadingAction === 'download'}>
          Download
        </Button>
      </span>
      {error && <p className="field__error doc-chip__error">{error}</p>}
    </div>
  );
}

// Renders all five REQ-01 documents for a trainee record. `onView`/`onDownload` receive the
// document's field key (e.g. "cv") and return a Promise — the page decides what that means
// (which role-scoped URL to hit), this component only orchestrates the click/loading/error
// state around it.
function DocumentChipList({ documents, onView, onDownload, className = '' }) {
  return (
    <div className={`doc-list ${className}`}>
      {documents.map((doc) => (
        <DocumentChip
          key={doc.field}
          label={doc.label}
          fileName={doc.fileName}
          available={doc.available}
          onView={() => onView(doc.field)}
          onDownload={() => onDownload(doc.field)}
        />
      ))}
    </div>
  );
}

export default DocumentChipList;
