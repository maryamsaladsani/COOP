import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import InfoField from '../../components/dashboard/InfoField';
import TrackCard from '../../components/dashboard/TrackCard';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import EmptyState from '../../components/dashboard/EmptyState';
import { getTrackSummaries } from '../../components/dashboard/trackSummaries';
import DocumentChipList from '../../components/dashboard/DocumentChip';
import Button from '../../components/Button';
import FormBanner from '../../components/form/FormBanner';
import { useHRStudentDetail } from '../../data/DataContext';
import { isCertificateReady } from '../../data/traineeAdapter';
import { openDocumentInNewTab, downloadDocument } from '../../data/documentActions';
import { useNow, formatDate } from '../../utils/time';
import { statusMeta } from '../../utils/statusMeta';
import HR_NAV_ITEMS from './hrNavItems';
import DepartmentAssignFields from './DepartmentAssignFields';
import '../../components/dashboard/DashboardPage.css';

const ASSIGN_INITIAL = {
  departmentId: '',
  department: '',
  coordinatorUsername: '',
  coordinatorName: '',
  branch: '',
  businessLine: '',
  buildingNumber: '',
  floorNumber: '',
};

function HRStudentProfilePage() {
  const { id } = useParams();
  const now = useNow();
  const {
    student: record,
    departments,
    loading,
    error: loadError,
    acceptApplication,
    rejectApplication,
    withdrawStudent,
    requestCard,
    assignToCoordinator,
    issueCertificate,
  } = useHRStudentDetail(id);

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const [assignValues, setAssignValues] = useState(ASSIGN_INITIAL);

  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState('');

  if (loading) {
    return (
      <DashboardShell navItems={HR_NAV_ITEMS}>
        <EmptyState title="Loading student…" />
      </DashboardShell>
    );
  }

  if (loadError || !record) {
    return (
      <DashboardShell navItems={HR_NAV_ITEMS}>
        <SectionCard title="Student not found">
          {loadError && <FormBanner tone="error">{loadError}</FormBanner>}
          <Link to="/app/hr">Back to students</Link>
        </SectionCard>
      </DashboardShell>
    );
  }

  const statusInfo = statusMeta(record.applicationStatus);
  const isPending = record.applicationStatus === 'pending';
  const isAccepted = record.applicationStatus === 'accepted';

  const runAction = async (fn, onDone) => {
    setBusy(true);
    setDialogError('');
    try {
      await fn();
      onDone?.();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = () =>
    runAction(acceptApplication, () => {
      setAcceptOpen(false);
      // Not shown here: the temporary password. It's only ever emailed to the
      // student (REQ-17) — the backend deliberately never returns it via the
      // API, so there's nothing to display beyond confirming it was sent.
      setNotice({
        tone: 'success',
        text: `Accepted. COOP account created and credentials emailed to ${record.personalEmail}; a separate acceptance notice was sent to ${record.universityEmail}.`,
      });
    });

  const handleReject = () =>
    runAction(rejectApplication, () => {
      setRejectOpen(false);
      setNotice({ tone: 'info', text: `Application rejected. Notification email sent to ${record.personalEmail}.` });
    });

  const handleWithdraw = () =>
    runAction(withdrawStudent, () => {
      setWithdrawOpen(false);
      setNotice({ tone: 'info', text: `Training withdrawn. Notification email sent to ${record.personalEmail}.` });
    });

  const handleAssign = () => {
    if (!assignValues.departmentId) {
      setDialogError('Department is required.');
      return;
    }
    runAction(
      () => assignToCoordinator(assignValues),
      () => {
        setAssignOpen(false);
        setNotice({
          tone: 'success',
          text: `${record.firstName} assigned to ${assignValues.department}${
            assignValues.coordinatorName ? ` (Coordinator: ${assignValues.coordinatorName})` : ''
          }.`,
        });
      }
    );
  };

  const handleRequestCard = () =>
    runAction(requestCard, () => {
      setCardOpen(false);
      setNotice({ tone: 'success', text: 'Card request submitted to ISD.' });
    });

  const handleIssueCertificate = async () => {
    setCertLoading(true);
    setCertError('');
    try {
      await issueCertificate();
      setNotice({ tone: 'success', text: 'Certificate issued.' });
    } catch (err) {
      setCertError(err.message);
    } finally {
      setCertLoading(false);
    }
  };

  // Fix 2's exception: certificate issuance requires all six prior milestones actually
  // complete, not just training — see isCertificateReady's doc comment.
  const certReady = record.tracks ? isCertificateReady(record.tracks) : false;
  const certIssued = record.tracks?.certificate?.status === 'issued';

  return (
    <DashboardShell navItems={HR_NAV_ITEMS}>
      <div className="dash-page">
        <div>
          <Link to="/app/hr" className="profile-header__back">
            ← Back to students
          </Link>
          <div className="profile-header">
            <div>
              <h1 className="profile-header__name">
                {record.firstName} {record.lastName}
              </h1>
              <div className="profile-header__meta">
                <StatusPill tone={statusInfo.tone} label={statusInfo.label} />
                {record.tracks?.training?.notStarted && <StatusPill tone="blocked" label="Marked Not Started" />}
                <span className="profile-header__meta-text">Submitted {formatDate(record.submittedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {notice && <FormBanner tone={notice.tone}>{notice.text}</FormBanner>}

        {isPending && (
          <SectionCard title="Application decision" subtitle="Accepting creates the trainee's account automatically.">
            <div className="profile-decision">
              <Button variant="primary" onClick={() => setAcceptOpen(true)}>
                Accept application
              </Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)}>
                Reject application
              </Button>
            </div>
          </SectionCard>
        )}

        {record.applicationStatus === 'rejected' && (
          <FormBanner tone="error">Rejected on {formatDate(record.decisionAt)}.</FormBanner>
        )}
        {record.applicationStatus === 'withdrawn' && (
          <FormBanner tone="error">Training withdrawn on {formatDate(record.decisionAt)}.</FormBanner>
        )}

        {isAccepted && (
          <SectionCard title="Onboarding tracks">
            <div className="track-rail">
              {getTrackSummaries(record, now).map((t) => (
                <TrackCard key={t.name} icon={t.icon} label={t.name} tone={t.tone} statusLabel={t.statusLabel} detail={t.detail} />
              ))}
            </div>
          </SectionCard>
        )}

        {isAccepted && (
          <SectionCard title="HR actions">
            <div className="profile-actions">
              <div className="profile-action">
                <h3>Request card from ISD</h3>
                <p>Submits image, signature, name, national ID, nationality, and blood type.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCardOpen(true)}
                  disabled={record.cardRequestStatus === 'requested'}
                >
                  {record.cardRequestStatus === 'requested' ? 'Card already requested' : 'Request card'}
                </Button>
              </div>
              <div className="profile-action">
                <h3>Assign to Coordinator</h3>
                <p>Sets department, branch, and Training Coordinator.</p>
                <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}>
                  Assign
                </Button>
              </div>
              <div className="profile-action">
                <h3>Issue completion certificate</h3>
                <p>
                  {certReady
                    ? 'Ready to issue.'
                    : 'Waiting on all onboarding milestones to complete (card, department, division, account, desk & device, training).'}
                </p>
                {certError && <FormBanner tone="error">{certError}</FormBanner>}
                <Button variant="secondary" size="sm" onClick={handleIssueCertificate} disabled={!certReady || certIssued} loading={certLoading}>
                  {certIssued ? 'Certificate issued' : 'Issue certificate'}
                </Button>
              </div>
              <div className="profile-action">
                <h3>Withdraw training</h3>
                <p>Sends a notification email to the student.</p>
                <Button variant="danger" size="sm" onClick={() => setWithdrawOpen(true)}>
                  Withdraw
                </Button>
              </div>
            </div>
          </SectionCard>
        )}

        {isAccepted && (
          <SectionCard title="Training details">
            <div className="info-grid">
              <InfoField label="Branch" value={record.trainingDetails?.branch} />
              <InfoField label="Business line" value={record.trainingDetails?.businessLine} />
              <InfoField label="Department" value={record.tracks.departmentAssignment.department} />
              <InfoField label="Division" value={record.tracks.divisionAssignment.division} />
              <InfoField label="Training coordinator" value={record.tracks.departmentAssignment.coordinatorName} />
              <InfoField label="Building number" value={record.trainingDetails?.buildingNumber} />
              <InfoField label="Floor number" value={record.trainingDetails?.floorNumber} />
            </div>
          </SectionCard>
        )}

        <SectionCard title="Application">
          <div className="info-grid">
            <InfoField label="Phone" value={record.phone} />
            <InfoField label="Birth date" value={formatDate(record.birthDate)} />
            <InfoField label="Personal email" value={record.personalEmail} />
            <InfoField label="University email" value={record.universityEmail} />
            <InfoField label="University" value={record.universityName} />
            <InfoField label="College" value={record.college} />
            <InfoField label="Major" value={record.major} />
            <InfoField label="GPA" value={record.gpa} />
            <InfoField label="Start date" value={formatDate(record.startDate)} />
            <InfoField label="End date" value={formatDate(record.endDate)} />
            <InfoField label="Duration" value={record.duration} />
            <InfoField label="Nationality" value={record.nationality} />
            <InfoField label="National ID" value={record.nationalId} />
            <InfoField label="Blood type" value={record.bloodType} />
            <InfoField label="How they heard about us" value={record.referralSource} />
            {record.employeeReferralId && <InfoField label="Referring employee ID" value={record.employeeReferralId} />}
            <InfoField label="IBAN" value={record.iban} />
          </div>
          <DocumentChipList
            className="profile-doc-list"
            documents={record.documents}
            onView={(field) => openDocumentInNewTab(`/api/hr/students/${record.id}/documents/${field}`)}
            onDownload={(field) => downloadDocument(`/api/hr/students/${record.id}/documents/${field}`)}
          />
        </SectionCard>
      </div>

      <ConfirmDialog
        open={acceptOpen}
        title="Accept this application?"
        body={`This creates a COOP account for ${record.firstName} ${record.lastName} and emails credentials to them, plus a separate acceptance notice to their university.`}
        confirmLabel="Accept"
        loading={busy}
        error={dialogError}
        onConfirm={handleAccept}
        onClose={() => setAcceptOpen(false)}
      />
      <ConfirmDialog
        open={rejectOpen}
        title="Reject this application?"
        body="The student will receive a rejection notification email."
        confirmLabel="Reject"
        danger
        loading={busy}
        error={dialogError}
        onConfirm={handleReject}
        onClose={() => setRejectOpen(false)}
      />
      <ConfirmDialog
        open={withdrawOpen}
        title="Withdraw this trainee's training?"
        body="This notifies the student by email and cannot be undone from this screen."
        confirmLabel="Withdraw"
        danger
        loading={busy}
        error={dialogError}
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawOpen(false)}
      />

      <ConfirmDialog
        open={assignOpen}
        title="Assign to Training Coordinator"
        confirmLabel="Assign"
        size="md"
        loading={busy}
        error={dialogError}
        onConfirm={handleAssign}
        onClose={() => setAssignOpen(false)}
      >
        <DepartmentAssignFields values={assignValues} onChange={setAssignValues} departments={departments} />
      </ConfirmDialog>

      <ConfirmDialog
        open={cardOpen}
        title="Request card from ISD"
        body="Submits the trainee's photo, signature, name, national ID, nationality, and blood type."
        confirmLabel="Submit request"
        size="md"
        loading={busy}
        error={dialogError}
        onConfirm={handleRequestCard}
        onClose={() => setCardOpen(false)}
      >
        <div className="info-grid">
          <InfoField label="Name" value={`${record.firstName} ${record.lastName}`} />
          <InfoField label="National ID" value={record.nationalId} />
          <InfoField label="Nationality" value={record.nationality} />
          <InfoField label="Blood type" value={record.bloodType} />
          <InfoField label="Photo on file" value={record.personalImageFileName} />
          <InfoField label="Signature on file" value={record.signatureFileName} />
        </div>
      </ConfirmDialog>
    </DashboardShell>
  );
}

export default HRStudentProfilePage;
