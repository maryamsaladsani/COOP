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
// action, confirm-training (completion only). That entry is dropped
// entirely, not just its button; see coordinatorNavItems.jsx too.
//
// Fix 2/3: all four actions are independent of each other and of the
// roadmap's display order — the single shared precondition is
// contractSigned. There is no "must be at step X first" check anymore.
const BULK_ACTIONS = {
  account: {
    key: 'account',
    icon: <AccountIcon />,
    title: 'Request company user accounts',
    description: 'Requests a Saudi Energy system account for every selected trainee.',
    submitLabel: 'Request accounts',
    fields: 'none',
    isApplicable: (record) => record.tracks.contract.signed && record.tracks.accountCredentials.status === 'not_requested',
    skipReason: (record) => (record.tracks.contract.signed ? 'Already requested or issued.' : 'Contract not signed yet.'),
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
    isApplicable: (record) => record.tracks.contract.signed && record.tracks.deskDevice.status === 'not_requested',
    skipReason: (record) => (record.tracks.contract.signed ? 'Already requested or ready.' : 'Contract not signed yet.'),
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
    // Divisions are scoped per department (Fix: no more single global list) — a chosen
    // division only applies to trainees whose own department actually has it. Departments
    // with no divisions defined yet accept anything (freeform), same fallback as the
    // single-student flow and the backend route itself. `formValues` is undefined until
    // the coordinator has picked a division — treated as "not yet determined", not "skip".
    isApplicable: (record, formValues) => {
      if (!record.tracks.contract.signed) return false;
      const divisions = record.tracks.departmentAssignment.divisions || [];
      if (!formValues?.division || divisions.length === 0) return true;
      return divisions.includes(formValues.division);
    },
    skipReason: (record, formValues) => {
      if (!record.tracks.contract.signed) return 'Contract not signed yet.';
      return `"${formValues?.division}" is not a division of this trainee's department.`;
    },
    currentStatus: (record) => record.tracks.divisionAssignment.division || 'Not assigned',
    apply: (coordinatorData, id, payload) => coordinatorData.assignDivision(id, payload),
  },
  completed: {
    key: 'completed',
    icon: <AcceptanceIcon />,
    title: 'Confirm training completion',
    description: 'Marks training as completed for every selected trainee whose contract is signed.',
    submitLabel: 'Confirm completed',
    fields: 'none',
    isApplicable: (record) => record.tracks.contract.signed && !record.tracks.training.completed,
    skipReason: (record) => {
      if (record.tracks.training.completed) return 'Already completed.';
      return 'Contract not signed yet.';
    },
    currentStatus: (record) => (record.tracks.training.completed ? 'Completed' : record.tracks.contract.signed ? 'Ready to confirm' : 'Not ready'),
    apply: (coordinatorData, id) => coordinatorData.confirmTrainingCompleted(id),
  },
};

export default BULK_ACTIONS;
