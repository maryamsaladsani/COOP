import { useEffect, useState } from 'react';

// Card and account-credential tracks auto-transition from "under issuing" to
// "issued" 2 hours after the request is made (REQ-22, REQ-35). This is modeled
// as a derived value from a stored timestamp rather than a scheduled callback,
// so it's correct even if no tab was open when the window elapsed.
export const AUTO_ISSUE_MS = 2 * 60 * 60 * 1000;

export function resolveIssuableStatus(track, now = Date.now()) {
  if (!track) return 'not_requested';
  if (track.status === 'under_issuing' && track.underIssuingAt) {
    const elapsed = now - new Date(track.underIssuingAt).getTime();
    if (elapsed >= AUTO_ISSUE_MS) return 'issued';
  }
  return track.status;
}

// Ticks every `intervalMs` so any screen reading `resolveIssuableStatus` stays
// live once a 2-hour window elapses, without polling a server.
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
