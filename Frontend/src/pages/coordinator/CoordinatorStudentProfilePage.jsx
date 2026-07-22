import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import InfoField from '../../components/dashboard/InfoField';
import TrackCard from '../../components/dashboard/TrackCard';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import { getTrackSummaries } from '../../components/dashboard/trackSummaries';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import SelectField from '../../components/form/SelectField';
import FormBanner from '../../components/form/FormBanner';
import { useCoordinatorData } from '../../data/DataContext';
import { useNow, formatDate } from '../../utils/time';
import { DIVISIONS } from '../../data/mockData';
import COORDINATOR_NAV_ITEMS from './coordinatorNavItems';
import '../../components/dashboard/DashboardPage.css';

const DIVISION_INITIAL = { division: '', managerName: '', altSupervisorName: '', buildingNumber: '', floorNumber: '' };

function CoordinatorStudentProfilePage() {
  const { id } = useParams();
  const now = useNow();
  const { getStudent, requestCompanyAccount, requestDeskDevice, markDeskReady, assignDivision, confirmTrainingStarted, confirmTrainingNotStarted, confirmTrainingCompleted } =
    useCoordinatorData();
  const record = getStudent(id);

  const [divisionOpen, setDivisionOpen] = useState(false);
  const [divisionValues, setDivisionValues] = useState(DIVISION_INITIAL);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  if (!record) {
    return (
      <DashboardShell navItems={COORDINATOR_NAV_ITEMS}>
        <SectionCard title="Student not found">
          <p>This trainee isn't assigned to you, or doesn't exist.</p>
          <Link to="/app/coordinator">Back to my students</Link>
        </SectionCard>
      </DashboardShell>
    );
  }

  const { tracks } = record;

  const runQuickAction = async (key, fn, successText) => {
    setActionLoading(key);
    setActionError('');
    try {
      await fn();
      setNotice({ tone: 'success', text: successText });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleAssignDivision = async () => {
    if (!divisionValues.division || !divisionValues.managerName.trim()) {
      setDialogError('Division and manager name are required.');
      return;
    }
    setBusy(true);
    setDialogError('');
    try {
      await assignDivision(record.id, divisionValues);
      setDivisionOpen(false);
      setNotice({ tone: 'success', text: `Assigned to ${divisionValues.division}.` });
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell navItems={COORDINATOR_NAV_ITEMS}>
      <div className="dash-page">
        <div>
          <Link to="/app/coordinator" className="profile-header__back">
            ← Back to my students
          </Link>
          <h1 className="profile-header__name">
            {record.firstName} {record.lastName}
          </h1>
          <span className="profile-header__meta-text">{record.trainingDetails.branch} Branch · {record.major}</span>
        </div>

        {notice && <FormBanner tone={notice.tone}>{notice.text}</FormBanner>}
        {actionError && <FormBanner tone="error">{actionError}</FormBanner>}

        <SectionCard title="Onboarding tracks">
          <div className="track-rail">
            {getTrackSummaries(record, now).map((t) => (
              <TrackCard key={t.name} icon={t.icon} label={t.name} tone={t.tone} statusLabel={t.statusLabel} detail={t.detail} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Coordinator actions">
          <div className="profile-actions">
            <div className="profile-action">
              <h3>Request company user account</h3>
              <p>Requests a Saudi Energy system account for this trainee.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runQuickAction('account', () => requestCompanyAccount(record.id), 'Account requested.')}
                disabled={tracks.accountCredentials.status !== 'not_requested'}
                loading={actionLoading === 'account'}
              >
                {tracks.accountCredentials.status === 'not_requested' ? 'Request account' : 'Already requested'}
              </Button>
            </div>

            <div className="profile-action">
              <h3>Request desk & device</h3>
              <p>Status is visible to the trainee once requested.</p>
              {tracks.deskDevice.status === 'ready' ? (
                <Button variant="secondary" size="sm" disabled>
                  Ready
                </Button>
              ) : tracks.deskDevice.status === 'requested' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => runQuickAction('deskReady', () => markDeskReady(record.id), 'Desk and device marked ready.')}
                  loading={actionLoading === 'deskReady'}
                >
                  Mark ready
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => runQuickAction('desk', () => requestDeskDevice(record.id), 'Desk and device requested.')}
                  loading={actionLoading === 'desk'}
                >
                  Request desk & device
                </Button>
              )}
            </div>

            <div className="profile-action">
              <h3>Assign division</h3>
              <p>Sets division, manager, and optional alternate supervisor.</p>
              <Button variant="secondary" size="sm" onClick={() => setDivisionOpen(true)}>
                {tracks.divisionAssignment.status === 'assigned' ? 'Update division' : 'Assign division'}
              </Button>
            </div>

            <div className="profile-action">
              <h3>Training start</h3>
              {tracks.training.started ? (
                <p>Started on {formatDate(tracks.training.startedAt)}.</p>
              ) : (
                <>
                  <p>Confirming "started" makes the contract available for the trainee to sign.</p>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => runQuickAction('started', () => confirmTrainingStarted(record.id), 'Training start confirmed.')}
                      loading={actionLoading === 'started'}
                    >
                      Confirm started
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => runQuickAction('notStarted', () => confirmTrainingNotStarted(record.id), 'Marked not started — added to HR\'s list.')}
                      loading={actionLoading === 'notStarted'}
                    >
                      Not started
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="profile-action">
              <h3>Training completion</h3>
              {tracks.training.completed ? (
                <p>Completed on {formatDate(tracks.training.completedAt)}.</p>
              ) : (
                <>
                  <p>{tracks.training.started ? 'Confirm once this trainee has finished.' : 'Confirm training started first.'}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!tracks.training.started}
                    onClick={() => runQuickAction('completed', () => confirmTrainingCompleted(record.id), 'Training completion confirmed.')}
                    loading={actionLoading === 'completed'}
                  >
                    Confirm completed
                  </Button>
                </>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Training details">
          <div className="info-grid">
            <InfoField label="Branch" value={record.trainingDetails.branch} />
            <InfoField label="Business line" value={record.trainingDetails.businessLine} />
            <InfoField label="Department" value={tracks.departmentAssignment.department} />
            <InfoField label="Division" value={tracks.divisionAssignment.division} />
            <InfoField label="Supervisor" value={tracks.divisionAssignment.managerName} />
            <InfoField label="Alt. supervisor" value={tracks.divisionAssignment.altSupervisorName} />
            <InfoField label="Building number" value={record.trainingDetails.buildingNumber} />
            <InfoField label="Floor number" value={record.trainingDetails.floorNumber} />
          </div>
        </SectionCard>

        <SectionCard title="Trainee info">
          <div className="info-grid">
            <InfoField label="Personal email" value={record.personalEmail} />
            <InfoField label="Phone" value={record.phone} />
            <InfoField label="University" value={record.universityName} />
            <InfoField label="Major" value={record.major} />
            <InfoField label="GPA" value={record.gpa} />
            <InfoField label="Training period" value={`${formatDate(record.startDate)} – ${formatDate(record.endDate)}`} />
          </div>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={divisionOpen}
        title="Assign division"
        size="md"
        confirmLabel="Assign"
        loading={busy}
        error={dialogError}
        onConfirm={handleAssignDivision}
        onClose={() => setDivisionOpen(false)}
      >
        <div className="profile-form">
          <SelectField
            label="Division"
            name="division"
            required
            placeholder="Select division"
            options={DIVISIONS.map((d) => ({ value: d, label: d }))}
            value={divisionValues.division}
            onChange={(e) => setDivisionValues((v) => ({ ...v, division: e.target.value }))}
          />
          <TextField
            label="Manager name"
            name="managerName"
            required
            value={divisionValues.managerName}
            onChange={(e) => setDivisionValues((v) => ({ ...v, managerName: e.target.value }))}
          />
          <TextField
            label="Alternative supervisor"
            name="altSupervisorName"
            hint="Optional"
            value={divisionValues.altSupervisorName}
            onChange={(e) => setDivisionValues((v) => ({ ...v, altSupervisorName: e.target.value }))}
          />
          <div className="profile-form__row">
            <TextField
              label="Building number"
              name="buildingNumber"
              hint="Optional"
              value={divisionValues.buildingNumber}
              onChange={(e) => setDivisionValues((v) => ({ ...v, buildingNumber: e.target.value }))}
            />
            <TextField
              label="Floor number"
              name="floorNumber"
              hint="Optional"
              value={divisionValues.floorNumber}
              onChange={(e) => setDivisionValues((v) => ({ ...v, floorNumber: e.target.value }))}
            />
          </div>
        </div>
      </ConfirmDialog>
    </DashboardShell>
  );
}

export default CoordinatorStudentProfilePage;
