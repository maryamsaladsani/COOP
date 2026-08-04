import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import EmptyState from '../../components/dashboard/EmptyState';
import InfoField from '../../components/dashboard/InfoField';
import TrackCard from '../../components/dashboard/TrackCard';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import { getTrackSummaries } from '../../components/dashboard/trackSummaries';
import DocumentChipList from '../../components/dashboard/DocumentChip';
import Button from '../../components/Button';
import SelectField from '../../components/form/SelectField';
import TextField from '../../components/form/TextField';
import FormBanner from '../../components/form/FormBanner';
import { useCoordinatorData } from '../../data/DataContext';
import { useNow, formatDate } from '../../utils/time';
import COORDINATOR_NAV_ITEMS from './coordinatorNavItems';
import '../../components/dashboard/DashboardPage.css';

// Real endpoint (REQ-11) only accepts a division name — no manager/alt-supervisor
// or building/floor concept exists in the schema (those come from the
// Department, already shown read-only below).
const DIVISION_INITIAL = { division: '' };

function CoordinatorStudentProfilePage() {
  const { id } = useParams();
  const now = useNow();
  const { students, loading, error: loadError, requestCompanyAccount, requestDeskDevice, assignDivision, confirmTrainingCompleted } =
    useCoordinatorData();
  const record = students.find((s) => s.id === id) || null;

  const [divisionOpen, setDivisionOpen] = useState(false);
  const [divisionValues, setDivisionValues] = useState(DIVISION_INITIAL);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  if (loading) {
    return (
      <DashboardShell navItems={COORDINATOR_NAV_ITEMS}>
        <EmptyState title="Loading student…" />
      </DashboardShell>
    );
  }

  if (loadError) {
    return (
      <DashboardShell navItems={COORDINATOR_NAV_ITEMS}>
        <SectionCard title="Couldn't load student">
          <FormBanner tone="error">{loadError}</FormBanner>
          <Link to="/app/coordinator">Back to my students</Link>
        </SectionCard>
      </DashboardShell>
    );
  }

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
  // Scoped to this trainee's own department (Fix: no more single global division list).
  // Most departments have none defined yet — falls back to freeform entry for those,
  // matching the backend's own graceful fallback (see coordinator.js's division route).
  const departmentDivisions = tracks.departmentAssignment.divisions || [];

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
    if (!divisionValues.division) {
      setDialogError('Division is required.');
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
          <span className="profile-header__meta-text">{record.trainingDetails?.branch} Branch · {record.major}</span>
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
          {!tracks.contract.signed && (
            <FormBanner tone="info">
              Trainee has not signed their contract yet — actions unlocked once signed.
            </FormBanner>
          )}
          <div className="profile-actions">
            <div className="profile-action">
              <h3>Request company user account</h3>
              <p>Requests a Saudi Energy system account for this trainee.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runQuickAction('account', () => requestCompanyAccount(record.id), 'Account requested.')}
                disabled={!tracks.contract.signed || tracks.accountCredentials.status !== 'not_requested'}
                loading={actionLoading === 'account'}
              >
                {tracks.accountCredentials.status === 'not_requested' ? 'Request account' : 'Already requested'}
              </Button>
            </div>

            <div className="profile-action">
              <h3>Request desk & device</h3>
              <p>Status is visible to the trainee once requested.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runQuickAction('desk', () => requestDeskDevice(record.id), 'Desk and device requested.')}
                disabled={!tracks.contract.signed || tracks.deskDevice.status !== 'not_requested'}
                loading={actionLoading === 'desk'}
              >
                {tracks.deskDevice.status === 'not_requested' ? 'Request desk & device' : 'Already requested'}
              </Button>
            </div>

            <div className="profile-action">
              <h3>Assign division</h3>
              <p>Sets the trainee's division.</p>
              <Button variant="secondary" size="sm" onClick={() => setDivisionOpen(true)} disabled={!tracks.contract.signed}>
                {tracks.divisionAssignment.status === 'assigned' ? 'Update division' : 'Assign division'}
              </Button>
            </div>

            <div className="profile-action">
              <h3>Training completion</h3>
              {tracks.training.completed ? (
                <p>Completed on {formatDate(tracks.training.completedAt)}.</p>
              ) : (
                <>
                  <p>Confirm once this trainee has finished training.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!tracks.contract.signed}
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
            <InfoField label="Branch" value={record.trainingDetails?.branch} />
            <InfoField label="Business line" value={record.trainingDetails?.businessLine} />
            <InfoField label="Department" value={tracks.departmentAssignment.department} />
            <InfoField label="Division" value={tracks.divisionAssignment.division} />
            <InfoField label="Building number" value={record.trainingDetails?.buildingNumber} />
            <InfoField label="Floor number" value={record.trainingDetails?.floorNumber} />
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

        <SectionCard title="Application documents">
          <DocumentChipList
            documents={record.documents}
            buildDownloadPath={(field) => `/api/coordinator/trainees/${record.id}/documents/${field}`}
          />
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
          {departmentDivisions.length > 0 ? (
            <SelectField
              label="Division"
              name="division"
              required
              placeholder="Select division"
              options={departmentDivisions.map((d) => ({ value: d, label: d }))}
              value={divisionValues.division}
              onChange={(e) => setDivisionValues({ division: e.target.value })}
            />
          ) : (
            <TextField
              label="Division"
              name="division"
              required
              hint="No divisions are defined for this department yet — enter one manually."
              value={divisionValues.division}
              onChange={(e) => setDivisionValues({ division: e.target.value })}
            />
          )}
        </div>
      </ConfirmDialog>
    </DashboardShell>
  );
}

export default CoordinatorStudentProfilePage;
