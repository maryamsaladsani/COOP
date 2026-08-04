// Thin fetch wrapper for the real COOP backend (see ../../Backend). Every data
// source in this app (auth, applications, HR/Coordinator/Trainee dashboards)
// goes through this so the base URL, auth header, and error shape are handled
// in exactly one place.
//
// Matches AuthContext.jsx's session storage key/shape exactly: AuthContext
// stores `{ token, ... }` under STORAGE_KEY, and this file reads `token` back
// out of that same object to attach `Authorization: Bearer <token>`.

const API_URL = process.env.REACT_APP_API_URL;
const STORAGE_KEY = 'coop.session';

if (!API_URL) {
  // Fail loudly in dev rather than silently calling a relative/undefined URL.
  // eslint-disable-next-line no-console
  console.error('[apiClient] REACT_APP_API_URL is not set — see .env.example');
}

function getToken() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.token || null;
  } catch {
    return null;
  }
}

// Generic JSON request. Throws Error(message) using the backend's own
// `{ message }` error body when the response isn't ok, so callers can just
// catch(err) and show err.message the same way the old mock layer worked.
//
// FormData bodies (application document uploads, REQ-01) are passed straight to fetch
// without stringifying and without a Content-Type header — the browser sets
// multipart/form-data with the correct boundary itself; setting it manually breaks parsing.
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  return data;
}

// For binary responses (currently only the certificate PDF, REQ-09). Returns
// a Blob on success; throws the same way apiRequest does on failure (the
// error response there is still JSON).
export async function apiDownload(path) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { headers });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null;
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  const filename = response.headers
    .get('content-disposition')
    ?.match(/filename="?([^"]+)"?/)?.[1];

  return { blob: await response.blob(), filename };
}
