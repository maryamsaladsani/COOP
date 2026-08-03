import { AccountIcon, DeskIcon, DivisionIcon, AcceptanceIcon } from '../../components/dashboard/trackIcons';

// Each entry drives one bulk-action page (/app/coordinator/bulk/:actionType).
// `apply` calls the exact same per-student function the single-student
// profile-page action cards use — bulk is that same operation looped across
// selected IDs, not a reimplementation. `isApplicable`/`skipReason` mirror
// the disabled/label logic already on those single-student buttons, so a
// student who wouldn't be actionable there is flagged, not silently retried.
//
// The old mock also had a "start" action (confirm training started) with no
// real backend equivalent — the real Coordinator has exactly one training
// action, confirm-training (completion only, valid once DESK_DEVICE is
// reached — see useCoordinatorData). That entry is dropped entirely, not
// just its button; see coordinatorNavItems.jsx too.
const BULK_ACTIONS = {
  account: {
    key: 'account',
    icon: <AccountIcon />,
    title: 'Request company user accounts',
    description: 'Requests a Saudi Energy system account for every selected trainee.',
    submitLabel: 'Request accounts',
    fields: 'none',
    isApplicable: (record) => record.tracks.accountCredentials.status === 'not_requested',
    skipReason: () => 'Already requested or issued.',
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
    skipReason: () => 'Already requested or ready.',
    currentStatus: (record) => ({ not_requested: 'Not requested', requested: 'Requested', ready: 'Ready' }[record.tracks.deskDevice.status]),
    apply: (coordinatorData, id) => coordinatorData.requestDeskDevice(id),
  },
  division: {
    key: 'division',
    icon: <DivisionIcon />,
    title: 'Assign divisions',
    description: 'Sets the same division for every selected trainee.',
    submitLabel: 'Assign division',
    fields: 'division',
    isApplicable: () => true,
    skipReason: () => '',
    currentStatus: (record) => record.tracks.divisionAssignment.division || 'Not assigned',
    apply: (coordinatorData, id, payload) => coordinatorData.assignDivision(id, payload),
  },
  completed: {
    key: 'completed',
    icon: <AcceptanceIcon />,
    title: 'Confirm training completion',
    description: 'Marks training as completed for every selected trainee who has reached the Desk & Device stage.',
    submitLabel: 'Confirm completed',
    fields: 'none',
    isApplicable: (record) => record.tracks.training.started && !record.tracks.training.completed,
    skipReason: (record) => (record.tracks.training.completed ? 'Already completed.' : 'Not yet at the Desk & Device stage.'),
    currentStatus: (record) => (record.tracks.training.completed ? 'Completed' : record.tracks.training.started ? 'Ready to confirm' : 'Not ready'),
    apply: (coordinatorData, id) => coordinatorData.confirmTrainingCompleted(id),
  },
};

export default BULK_ACTIONS;
