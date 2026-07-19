// Maps track/application status keys to a tone (one of the existing
// --status-* token families) and a display label. Central place so every
// dashboard renders the same status the same way.

const META = {
  not_requested: { tone: 'neutral', label: 'Not requested' },
  pending: { tone: 'pending', label: 'Pending' },
  under_issuing: { tone: 'progress', label: 'Under Issuing' },
  requested: { tone: 'progress', label: 'Requested' },
  issued: { tone: 'complete', label: 'Issued' },
  ready: { tone: 'complete', label: 'Ready' },
  assigned: { tone: 'complete', label: 'Assigned' },
  accepted: { tone: 'complete', label: 'Accepted' },
  rejected: { tone: 'blocked', label: 'Rejected' },
  withdrawn: { tone: 'blocked', label: 'Withdrawn' },
  signed: { tone: 'complete', label: 'Signed' },
};

export function statusMeta(key, overrides) {
  const base = META[key] || { tone: 'neutral', label: key };
  return { ...base, ...overrides };
}
