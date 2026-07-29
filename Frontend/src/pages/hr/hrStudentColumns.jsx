import StatusPill from '../../components/dashboard/StatusPill';
import { statusMeta } from '../../utils/statusMeta';
import { formatDate } from '../../utils/time';

// Distinct from statusMeta's 'requested' (used for in-progress tracks like
// desk device requests) — here "requested" means HR is done and the card
// ask has already gone to ISD, so it reads as a success/complete tone.
const CARD_REQUEST_META = {
  requested: { tone: 'complete', label: 'Requested' },
  not_requested: { tone: 'neutral', label: 'Not requested' },
};

// Shared by the students database list and every bulk-action page so a
// trainee's row looks identical everywhere in the HR area. `showCardStatus`
// adds the Card Status column used by the Request Card bulk-action page.
function getHRStudentColumns({ showCardStatus = false } = {}) {
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
            {row.firstName} {row.lastName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.universityName}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const meta = statusMeta(row.applicationStatus);
        return <StatusPill tone={meta.tone} label={meta.label} />;
      },
    },
  ];

  if (showCardStatus) {
    columns.push({
      key: 'cardStatus',
      header: 'Card Status',
      render: (row) => {
        const meta = CARD_REQUEST_META[row.cardRequestStatus] || CARD_REQUEST_META.not_requested;
        return <StatusPill tone={meta.tone} label={meta.label} />;
      },
    });
  }

  columns.push(
    {
      key: 'coordinator',
      header: 'Coordinator',
      render: (row) => row.tracks?.departmentAssignment?.coordinatorName || '—',
    },
    { key: 'submitted', header: 'Submitted', render: (row) => formatDate(row.submittedAt) }
  );

  return columns;
}

export default getHRStudentColumns;
