import { AccountIcon, DeskIcon, DivisionIcon, AcceptanceIcon } from '../../components/dashboard/trackIcons';
import { FlagIcon } from '../../components/dashboard/navIcons';
import { formatDate } from '../../utils/time';

// Each entry drives one bulk-action page (/app/coordinator/bulk/:actionType).
// `apply` calls the exact same per-student function the single-student
// profile-page action cards use — bulk is that same operation looped across
// selected IDs, not a reimplementation. `isApplicable`/`skipReason` mirror
// the disabled/label logic already on those single-student buttons, so a
// student who wouldn't be actionable there is flagged, not silently retried.
const BULK_ACTIONS = {
  account: {
    key: 'account',
    icon: <AccountIcon />,
    title: 'Request company user accounts',
    description: 'Requests a Saudi Energy system account for every selected trainee.',
    submitLabel: 'Request accounts',
    fields: 'none',
    isApplicable: (record) => record.tracks.accountCredentials.status === 'not_requested',
    skipReason: (record) => (record.tracks.accountCredentials.status === 'under_issuing' ? 'Already requested.' : 'Already issued.'),
    currentStatus: (record) =>
      ({ not_requested: 'Not requested', under_issuing: 'Under Issuing', issued: 'Issued' }[record.tracks.accountCredentials.status]),
    apply: (coordinatorData, id) => coordinatorData.requestCompanyAccount(id),
  },
  desk: {
    key: 'desk',
    icon: <DeskIcon />,
    title: 'Request desks & devices',
    description: 'Requests a desk and device for every selected trainee. Status is visible to each trainee once requested.',
    submitLabel: 'Request desks & devices',
    fields: 'none',
    isApplicable: (record) => record.tracks.deskDevice.status === 'not_requested',
    skipReason: (record) => (record.tracks.deskDevice.status === 'requested' ? 'Already requested.' : 'Already ready.'),
    currentStatus: (record) => ({ not_requested: 'Not requested', requested: 'Requested', ready: 'Ready' }[record.tracks.deskDevice.status]),
    apply: (coordinatorData, id) => coordinatorData.requestDeskDevice(id),
  },
  division: {
    key: 'division',
    icon: <DivisionIcon />,
    title: 'Assign divisions',
    description: 'Sets the same division, manager, and optional alternate supervisor for every selected trainee.',
    submitLabel: 'Assign division',
    fields: 'division',
    isApplicable: () => true,
    skipReason: () => '',
    currentStatus: (record) => record.tracks.divisionAssignment.division || 'Not assigned',
    apply: (coordinatorData, id, payload) => coordinatorData.assignDivision(id, payload),
  },
  start: {
    key: 'start',
    icon: <FlagIcon />,
    title: 'Confirm training start',
    description: "Marks training as started, making each trainee's contract available to sign.",
    submitLabel: 'Confirm started',
    fields: 'date',
    isApplicable: (record) => !record.tracks.training.started,
    skipReason: (record) => `Already started on ${formatDate(record.tracks.training.startedAt)}.`,
    currentStatus: (record) => (record.tracks.training.started ? `Started ${formatDate(record.tracks.training.startedAt)}` : 'Not started'),
    apply: (coordinatorData, id, payload) => coordinatorData.confirmTrainingStarted(id, payload?.date || undefined),
  },
  completed: {
    key: 'completed',
    icon: <AcceptanceIcon />,
    title: 'Confirm training completion',
    description: 'Marks training as completed for every selected trainee.',
    submitLabel: 'Confirm completed',
    fields: 'date',
    isApplicable: (record) => record.tracks.training.started && !record.tracks.training.completed,
    skipReason: (record) =>
      !record.tracks.training.started ? 'Training not started yet.' : `Already completed on ${formatDate(record.tracks.training.completedAt)}.`,
    currentStatus: (record) =>
      record.tracks.training.completed
        ? `Completed ${formatDate(record.tracks.training.completedAt)}`
        : record.tracks.training.started
        ? 'In training'
        : 'Not started',
    apply: (coordinatorData, id, payload) => coordinatorData.confirmTrainingCompleted(id, payload?.date || undefined),
  },
};

export default BULK_ACTIONS;
