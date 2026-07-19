import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import InfoField from '../../components/dashboard/InfoField';
import TrackCard from '../../components/dashboard/TrackCard';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import { getTrackSummaries } from '../../components/dashboard/trackSummaries';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import SelectField from '../../components/form/SelectField';
import FormBanner from '../../components/form/FormBanner';
import { useHRData } from '../../data/DataContext';
import { useNow, formatDate } from '../../utils/time';
import { statusMeta } from '../../utils/statusMeta';
import { BRANCHES, COORDINATORS } from '../../data/mockData';
import '../../components/dashboard/DashboardPage.css';

const ASSIGN_INITIAL = { department: '', coordinatorUsername: '', branch: 'Eastern', businessLine: '', buildingNumber: '', floorNumber: '' };

function HRStudentProfilePage() {
  const { id } = useParams();
  const now = useNow();
  const { students, acceptApplication, rejectApplication, withdrawStudent, requestCard, assignToCoordinator, issueCertificate } =
    useHRData();
  const record = students.find((s) => s.id === id);

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const [withdrawReason, setWithdrawReason] = useState('');
  const [assignValues, setAssignValues] = useState(ASSIGN_INITIAL);
  const [cardValues, setCardValues] = useState({ endDate: '' });

  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState('');

  if (!record) {
    return (
      <DashboardShell>
        <SectionCard title="Student not found">
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
      const result = await fn();
      onDone?.(result);
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = () =>
    runAction(
      () => acceptApplication(record.id),
      ({ username, tempPassword }) => {
        setAcceptOpen(false);
        setNotice({
          tone: 'success',
          text: `Accepted. COOP account created (username: ${username}, temporary password: ${tempPassword}). Acceptance email sent to ${record.personalEmail}; university notified at ${record.universityEmail}.`,
        });
      }
    );

  const handleReject = () =>
    runAction(
      () => rejectApplication(record.id),
      () => {
        setRejectOpen(false);
        setNotice({ tone: 'info', text: `Application rejected. Notification email sent to ${record.personalEmail}.` });
      }
    );

  const handleWithdraw = () =>
    runAction(
      () => withdrawStudent(record.id, withdrawReason),
      () => {
        setWithdrawOpen(false);
        setNotice({ tone: 'info', text: `Training withdrawn. Notification email sent to ${record.personalEmail}.` });
      }
    );

  const handleAssign = () => {
    if (!assignValues.department.trim() || !assignValues.coordinatorUsername) {
      setDialogError('Department and coordinator are required.');
      return;
    }
    const coordinator = COORDINATORS.find((c) => c.username === assignValues.coordinatorUsername);
    runAction(
      () => assignToCoordinator([record.id], { ...assignValues, coordinatorName: coordinator?.name }),
      () => {
        setAssignOpen(false);
        setNotice({ tone: 'success', text: `${record.firstName} assigned to ${coordinator?.name}.` });
      }
    );
  };

  const handleRequestCard = () =>
    runAction(
      () =>
        requestCard(record.id, {
          personalImageFileName: record.personalImageFileName,
          signatureFileName: record.signatureFileName,
          name: `${record.firstName} ${record.lastName}`,
          nationalId: record.nationalId,
          endDate: cardValues.endDate || record.endDate,
          nationality: record.nationality,
          bloodType: record.bloodType,
        }),
      () => {
        setCardOpen(false);
        setNotice({ tone: 'success', text: 'Card request submitted to ISD.' });
      }
    );

  const handleIssueCertificate = async () => {
    setCertLoading(true);
    setCertError('');
    try {
      await issueCertificate(record.id);
      setNotice({ tone: 'success', text: 'Certificate issued.' });
    } catch (err) {
      setCertError(err.message);
    } finally {
      setCertLoading(false);
    }
  };

  const trainingStarted = Boolean(record.tracks?.training?.started);
  const trainingCompleted = Boolean(record.tracks?.training?.completed);
  const certReady = trainingStarted && trainingCompleted;
  const certIssued = record.tracks?.certificate?.status === 'issued';

  return (
    <DashboardShell>
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
          <FormBanner tone="error">
            Training withdrawn on {formatDate(record.decisionAt)}
            {record.withdrawalReason ? ` — ${record.withdrawalReason}` : ''}.
          </FormBanner>
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
                <Button variant="secondary" size="sm" onClick={() => setCardOpen(true)}>
                  Request card
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
                    : 'Waiting on coordinator confirmation that training was started and completed.'}
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
              <InfoField label="Branch" value={record.trainingDetails.branch} />
              <InfoField label="Business line" value={record.trainingDetails.businessLine} />
              <InfoField label="Department" value={record.tracks.departmentAssignment.department} />
              <InfoField label="Division" value={record.tracks.divisionAssignment.division} />
              <InfoField label="Supervisor" value={record.tracks.divisionAssignment.managerName} />
              <InfoField label="Alt. supervisor" value={record.tracks.divisionAssignment.altSupervisorName} />
              <InfoField label="Training coordinator" value={record.tracks.departmentAssignment.coordinatorName} />
              <InfoField label="Building number" value={record.trainingDetails.buildingNumber} />
              <InfoField label="Floor number" value={record.trainingDetails.floorNumber} />
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
            <InfoField
              label="How they heard about us"
              value={{ employee_referral: 'Employee referral', manual_application: 'Manual application', university: 'From university' }[record.referralSource]}
            />
            {record.referralSource === 'employee_referral' && <InfoField label="Referring employee ID" value={record.employeeReferralId} />}
            <InfoField label="IBAN" value={record.iban} />
          </div>
          <div className="doc-list" style={{ marginTop: 'var(--space-5)' }}>
            <span className="doc-chip">📄 {record.transcriptFileName}</span>
            <span className="doc-chip">📄 {record.cvFileName}</span>
            <span className="doc-chip">📄 {record.universityLetterFileName}</span>
            <span className="doc-chip">🖼 {record.personalImageFileName}</span>
            <span className="doc-chip">✍️ {record.signatureFileName}</span>
          </div>
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
        body="This notifies the student by email. You can add an internal note below (optional)."
        confirmLabel="Withdraw"
        danger
        loading={busy}
        error={dialogError}
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawOpen(false)}
      >
        <textarea
          className="textarea-input"
          placeholder="Reason (optional, internal use only)"
          value={withdrawReason}
          onChange={(e) => setWithdrawReason(e.target.value)}
        />
      </ConfirmDialog>

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
        <div className="profile-form">
          <div className="profile-form__row">
            <TextField
              label="Department"
              name="department"
              required
              value={assignValues.department}
              onChange={(e) => setAssignValues((v) => ({ ...v, department: e.target.value }))}
            />
            <SelectField
              label="Training Coordinator"
              name="coordinatorUsername"
              required
              placeholder="Select coordinator"
              options={COORDINATORS.map((c) => ({ value: c.username, label: c.name }))}
              value={assignValues.coordinatorUsername}
              onChange={(e) => setAssignValues((v) => ({ ...v, coordinatorUsername: e.target.value }))}
            />
          </div>
          <div className="profile-form__row">
            <SelectField
              label="Branch"
              name="branch"
              options={BRANCHES.map((b) => ({ value: b, label: b }))}
              value={assignValues.branch}
              onChange={(e) => setAssignValues((v) => ({ ...v, branch: e.target.value }))}
            />
            <TextField
              label="Business line"
              name="businessLine"
              hint="Optional"
              value={assignValues.businessLine}
              onChange={(e) => setAssignValues((v) => ({ ...v, businessLine: e.target.value }))}
            />
          </div>
          <div className="profile-form__row">
            <TextField
              label="Building number"
              name="buildingNumber"
              hint="Optional"
              value={assignValues.buildingNumber}
              onChange={(e) => setAssignValues((v) => ({ ...v, buildingNumber: e.target.value }))}
            />
            <TextField
              label="Floor number"
              name="floorNumber"
              hint="Optional"
              value={assignValues.floorNumber}
              onChange={(e) => setAssignValues((v) => ({ ...v, floorNumber: e.target.value }))}
            />
          </div>
        </div>
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
        <div className="profile-form">
          <div className="info-grid">
            <InfoField label="Name" value={`${record.firstName} ${record.lastName}`} />
            <InfoField label="National ID" value={record.nationalId} />
            <InfoField label="Nationality" value={record.nationality} />
            <InfoField label="Blood type" value={record.bloodType} />
            <InfoField label="Photo on file" value={record.personalImageFileName} />
            <InfoField label="Signature on file" value={record.signatureFileName} />
          </div>
          <TextField
            label="Card end date"
            name="cardEndDate"
            type="date"
            value={cardValues.endDate || record.endDate}
            onChange={(e) => setCardValues({ endDate: e.target.value })}
          />
        </div>
      </ConfirmDialog>
    </DashboardShell>
  );
}

export default HRStudentProfilePage;
