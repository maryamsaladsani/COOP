import { CardIcon, DepartmentIcon, CertificateIcon } from '../../components/dashboard/trackIcons';
import { WithdrawIcon } from '../../components/dashboard/navIcons';

// Each entry drives one bulk-action page (/app/hr/bulk/:actionType). `apply`
// calls the exact same per-student function the single-student profile-page
// action already uses — bulk is that same operation looped across selected
// trainees, not a reimplementation. `isApplicable`/`skipReason` describe who
// is eligible: every action requires an accepted (active-trainee) application,
// and certificate additionally requires training to be complete and not
// already issued, mirroring the disabled/label logic already on that
// single-student button.
const HR_BULK_ACTIONS = {
  card: {
    key: 'card',
    icon: <CardIcon />,
    title: 'Request card from ISD',
    description: 'Submits each selected trainee’s photo, signature, name, national ID, nationality, and blood type to ISD.',
    submitLabel: 'Request cards',
    fields: 'none',
    needsConfirm: true,
    danger: false,
    confirmTitle: 'Request cards from ISD?',
    confirmBody: (n) => `Submits photo, signature, name, national ID, nationality, and blood type for ${n} selected trainee${n === 1 ? '' : 's'}.`,
    isApplicable: (record) => record.applicationStatus === 'accepted',
    skipReason: () => 'Application is not an active trainee.',
    apply: (hrData, record) =>
      hrData.requestCard(record.id, {
        personalImageFileName: record.personalImageFileName,
        signatureFileName: record.signatureFileName,
        name: `${record.firstName} ${record.lastName}`,
        nationalId: record.nationalId,
        endDate: record.endDate,
        nationality: record.nationality,
        bloodType: record.bloodType,
      }),
  },
  assign: {
    key: 'assign',
    icon: <DepartmentIcon />,
    title: 'Assign to Coordinator',
    description: 'Sets the same department, branch, and Training Coordinator for every selected trainee.',
    submitLabel: 'Assign',
    fields: 'assign',
    needsConfirm: true,
    danger: false,
    confirmTitle: 'Assign to Training Coordinator?',
    confirmBody: (n) =>
      `Assigning ${n} trainee${n === 1 ? '' : 's'}. This sets their department and coordinator; branch, business line, building, and floor are optional.`,
    isApplicable: (record) => record.applicationStatus === 'accepted',
    skipReason: () => 'Application is not an active trainee.',
    apply: (hrData, record, payload) => hrData.assignToCoordinator([record.id], payload),
  },
  certificate: {
    key: 'certificate',
    icon: <CertificateIcon />,
    title: 'Issue completion certificate',
    description: 'Issues the completion certificate for every selected trainee whose training is complete.',
    submitLabel: 'Issue certificates',
    fields: 'none',
    needsConfirm: false,
    danger: false,
    isApplicable: (record) =>
      record.applicationStatus === 'accepted' &&
      Boolean(record.tracks?.training?.started) &&
      Boolean(record.tracks?.training?.completed) &&
      record.tracks?.certificate?.status !== 'issued',
    skipReason: (record) => {
      if (record.tracks?.certificate?.status === 'issued') return 'Certificate already issued.';
      if (!record.tracks?.training?.started || !record.tracks?.training?.completed) return 'Training not yet completed.';
      return 'Application is not an active trainee.';
    },
    apply: (hrData, record) => hrData.issueCertificate(record.id),
  },
  withdraw: {
    key: 'withdraw',
    icon: <WithdrawIcon />,
    title: 'Withdraw training',
    description: 'Withdraws training and notifies every selected trainee by email.',
    submitLabel: 'Withdraw training',
    fields: 'reason',
    needsConfirm: true,
    danger: true,
    confirmTitle: "Withdraw training for the selected trainees?",
    confirmBody: (n) => `This notifies ${n} trainee${n === 1 ? '' : 's'} by email and cannot be undone from this screen.`,
    isApplicable: (record) => record.applicationStatus === 'accepted',
    skipReason: () => 'Application is not an active trainee.',
    apply: (hrData, record, payload) => hrData.withdrawStudent(record.id, payload?.reason),
  },
};

export default HR_BULK_ACTIONS;
