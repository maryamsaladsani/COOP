import { resolveIssuableStatus, formatDate } from '../../utils/time';
import { statusMeta } from '../../utils/statusMeta';
import {
  AcceptanceIcon,
  CardIcon,
  DepartmentIcon,
  DivisionIcon,
  DeskIcon,
  AccountIcon,
  CertificateIcon,
} from './trackIcons';

// Shared by the Trainee's own dashboard and the HR/Coordinator profile views
// so all three roles read the same seven independent tracks (REQ-04) the
// same way.
export function getTrackSummaries(record, now) {
  const { tracks, decisionAt } = record;
  const cardStatus = resolveIssuableStatus(tracks.card, now);
  const accountStatus = resolveIssuableStatus(tracks.accountCredentials, now);

  const issuableLabel = (status) => ({ not_requested: 'Not requested', under_issuing: 'Under Issuing', issued: 'Issued' }[status]);

  const cardMeta = statusMeta(cardStatus, { label: issuableLabel(cardStatus) });
  const accountMeta = statusMeta(accountStatus, { label: issuableLabel(accountStatus) });
  const departmentMeta = statusMeta(tracks.departmentAssignment.status, {
    tone: tracks.departmentAssignment.status === 'assigned' ? 'complete' : 'pending',
    label: tracks.departmentAssignment.status === 'assigned' ? 'Assigned' : 'Pending',
  });
  const divisionMeta = statusMeta(tracks.divisionAssignment.status, {
    tone: tracks.divisionAssignment.status === 'assigned' ? 'complete' : 'pending',
    label: tracks.divisionAssignment.status === 'assigned' ? 'Assigned' : 'Pending',
  });
  const deskMeta = statusMeta(tracks.deskDevice.status, {
    label: { not_requested: 'Not requested', requested: 'Requested', ready: 'Ready' }[tracks.deskDevice.status],
  });
  const certificateMeta = statusMeta(tracks.certificate.status, {
    tone: tracks.certificate.status === 'issued' ? 'complete' : 'pending',
    label: tracks.certificate.status === 'issued' ? 'Issued' : 'Pending',
  });

  return [
    {
      icon: <AcceptanceIcon />,
      name: 'Acceptance',
      tone: 'complete',
      statusLabel: 'Accepted',
      detail: `Accepted on ${formatDate(decisionAt) || '—'}.`,
    },
    {
      icon: <CardIcon />,
      name: 'Company Card',
      tone: cardMeta.tone,
      statusLabel: cardMeta.label,
      detail:
        cardStatus === 'not_requested'
          ? 'Not requested from ISD yet.'
          : cardStatus === 'under_issuing'
          ? 'Submitted to ISD — usually ready within 2 hours.'
          : 'Ready to collect.',
    },
    {
      icon: <DepartmentIcon />,
      name: 'Department Assignment',
      tone: departmentMeta.tone,
      statusLabel: departmentMeta.label,
      detail:
        tracks.departmentAssignment.status === 'assigned'
          ? `${tracks.departmentAssignment.department} · Coordinator: ${tracks.departmentAssignment.coordinatorName}`
          : 'Not assigned yet.',
    },
    {
      icon: <DivisionIcon />,
      name: 'Division Assignment',
      tone: divisionMeta.tone,
      statusLabel: divisionMeta.label,
      detail:
        tracks.divisionAssignment.status === 'assigned'
          ? `${tracks.divisionAssignment.division} · Manager: ${tracks.divisionAssignment.managerName}`
          : 'Not assigned yet.',
    },
    {
      icon: <DeskIcon />,
      name: 'Desk & Device',
      tone: deskMeta.tone,
      statusLabel: deskMeta.label,
      detail:
        tracks.deskDevice.status === 'ready'
          ? 'Desk and device are ready.'
          : tracks.deskDevice.status === 'requested'
          ? 'Requested, not yet ready.'
          : 'Not requested yet.',
    },
    {
      icon: <AccountIcon />,
      name: 'Account Credentials',
      tone: accountMeta.tone,
      statusLabel: accountMeta.label,
      detail:
        accountStatus === 'not_requested'
          ? 'SE account not requested yet.'
          : accountStatus === 'under_issuing'
          ? 'Being provisioned — usually ready within 2 hours.'
          : 'Account is active.',
    },
    {
      icon: <CertificateIcon />,
      name: 'Certificate',
      tone: certificateMeta.tone,
      statusLabel: certificateMeta.label,
      detail:
        tracks.certificate.status === 'issued' ? `Issued on ${formatDate(tracks.certificate.issuedAt)}.` : 'Pending — awaiting HR issuance.',
    },
  ];
}
