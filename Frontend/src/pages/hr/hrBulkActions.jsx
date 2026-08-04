import { CardIcon, DepartmentIcon, CertificateIcon } from '../../components/dashboard/trackIcons';
import { WithdrawIcon } from '../../components/dashboard/navIcons';
import { isCertificateReady } from '../../data/traineeAdapter';

// Each entry drives one bulk-action page (/app/hr/bulk/:actionType). `apply`
// calls the exact same per-student function the single-student profile-page
// action already uses — bulk is that same operation looped across selected
// trainees, not a reimplementation. `isApplicable`/`skipReason` describe who
// is eligible: every action requires an accepted (active-trainee) application,
// and certificate additionally requires all six prior milestones complete
// (Fix 2's stated exception — see isCertificateReady) and not already issued,
// mirroring the disabled/label logic already on that single-student button.
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
    // Real endpoint (REQ-21) takes no body — it submits the trainee's own
    // already-stored image/signature/name/national ID/nationality/blood type.
    apply: (hrData, record) => hrData.requestCard(record.id),
  },
  assign: {
    key: 'assign',
    icon: <DepartmentIcon />,
    title: 'Assign to Coordinator',
    description: 'Sets the same department and Training Coordinator for every selected trainee.',
    submitLabel: 'Assign',
    fields: 'assign',
    needsConfirm: true,
    danger: false,
    confirmTitle: 'Assign to Training Coordinator?',
    confirmBody: (n) => `Assigning ${n} trainee${n === 1 ? '' : 's'} to the selected department.`,
    // The real endpoint (REQ-25) is a genuine batch operation — all selected
    // studentIds go in ONE request and are validated/rejected atomically
    // together (if any one trainee isn't accepted, the whole batch 409s,
    // none of them get assigned). isBatchOperation tells HRBulkActionPage to
    // call `apply` once with every applicable record, instead of looping
    // per-trainee like the other actions below (whose real endpoints really
    // are single-trainee operations).
    //
    // Card Request and Department Assignment are independent HR actions —
    // this does NOT require the Company Card milestone; only acceptance.
    isBatchOperation: true,
    isApplicable: (record) => record.applicationStatus === 'accepted',
    skipReason: () => 'Application is not an active trainee.',
    apply: (hrData, records, payload) => hrData.assignToCoordinator(records.map((r) => r.id), payload),
  },
  certificate: {
    key: 'certificate',
    icon: <CertificateIcon />,
    title: 'Issue completion certificate',
    description: 'Issues the completion certificate for every selected trainee whose onboarding is fully complete.',
    submitLabel: 'Issue certificates',
    fields: 'none',
    needsConfirm: false,
    danger: false,
    isApplicable: (record) =>
      record.applicationStatus === 'accepted' &&
      Boolean(record.tracks) &&
      isCertificateReady(record.tracks) &&
      record.tracks?.certificate?.status !== 'issued',
    skipReason: (record) => {
      if (record.tracks?.certificate?.status === 'issued') return 'Certificate already issued.';
      if (record.applicationStatus !== 'accepted') return 'Application is not an active trainee.';
      return 'Not all onboarding milestones are complete yet (card, department, division, account, desk & device, training).';
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
