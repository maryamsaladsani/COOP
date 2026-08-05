// Shared View/Download logic for application documents (REQ-01), used by HR/Coordinator/
// Trainee pages alike. Each role hits a different backend route prefix, but the response
// shape and DOM behavior are identical, so that part lives here once instead of being
// duplicated per page — pages only supply the role-scoped path (see DocumentChip.jsx's
// onView/onDownload contract, which deliberately doesn't know about any specific role's URL).
//
// The signed URL always comes fresh from the backend on click — never cached in state,
// storage, or the DB (it's a short-lived Supabase Storage URL; requesting it ahead of time
// would just mean it might already be expired by the time the user clicks).

import { apiRequest } from './apiClient';

// REQ: view opens the signed URL directly in a new tab. window.open must be called
// synchronously from the click handler in most browsers to avoid popup blocking, but this
// project already accepts the async-gap tradeoff elsewhere (a fresh URL is required per
// click, which necessarily means an await before opening) — the button's own loading state
// makes the delay visible instead of a silently-blocked popup.
export async function openDocumentInNewTab(path) {
  const { document: doc } = await apiRequest(path);
  window.open(doc.url, '_blank', 'noopener,noreferrer');
}

// REQ: download triggers via a temporary <a download> pointed at the signed URL, named after
// the real original filename (supports spaces/Arabic/special characters — the `download`
// attribute takes a plain JS string, no manual encoding needed or wanted).
export async function downloadDocument(path) {
  const separator = path.includes('?') ? '&' : '?';
  const { document: doc } = await apiRequest(`${path}${separator}download=true`);

  const link = window.document.createElement('a');
  link.href = doc.url;
  link.download = doc.originalName || 'document';
  link.rel = 'noopener noreferrer';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
}
