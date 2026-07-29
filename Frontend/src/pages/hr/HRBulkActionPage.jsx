import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import DataTable from '../../components/dashboard/DataTable';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import FormBanner from '../../components/form/FormBanner';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import SelectField from '../../components/form/SelectField';
import { useHRData } from '../../data/DataContext';
import { BRANCHES, COORDINATORS } from '../../data/mockData';
import { DEPARTMENTS } from '../../data/departments';
import HR_NAV_ITEMS from './hrNavItems';
import HR_BULK_ACTIONS from './hrBulkActions';
import getHRStudentColumns from './hrStudentColumns';
import './HRBulkAction.css';

const ASSIGN_INITIAL = {
  departmentId: '',
  department: '',
  coordinatorUsername: '',
  branch: 'Eastern',
  businessLine: '',
  buildingNumber: '',
  floorNumber: '',
};

// Route-level wrapper: /app/hr/bulk/:actionType matches the same <Route>
// element regardless of which action is selected, so keying the view on
// actionType forces a full remount (and state reset) when HR switches
// actions from the sidebar, instead of leaking one action's selection/
// results into the next.
function HRBulkActionPage() {
  const { actionType } = useParams();
  const action = HR_BULK_ACTIONS[actionType];

  if (!action) {
    return <Navigate to="/app/hr" replace />;
  }

  return <HRBulkActionView key={actionType} action={action} />;
}

function HRBulkActionView({ action }) {
  const hrData = useHRData();
  const { students } = hrData;

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignValues, setAssignValues] = useState(ASSIGN_INITIAL);
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [blocked, setBlocked] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const isCardAction = action.key === 'card';
  const columns = getHRStudentColumns({ showCardStatus: isCardAction });

  // Only students eligible for this action ever become candidates — pending,
  // rejected, and withdrawn applications never appear here; they have to go
  // through the Accept/Reject flow on the detail page first. For the card
  // action, trainees whose card was already requested sort to the bottom
  // (stable sort keeps each group's original submitted-date order intact)
  // so HR always sees the still-actionable rows first.
  const eligibleRows = useMemo(() => {
    const base = students.filter(action.isApplicable);
    if (!isCardAction) return base;
    return [...base].sort((a, b) => Number(a.cardRequestStatus === 'requested') - Number(b.cardRequestStatus === 'requested'));
  }, [students, action, isCardAction]);

  // For the card action, rows already requested aren't selectable, so the
  // "eligible" count in the header should only reflect the ones HR can still act on.
  const selectableEligibleRows = useMemo(
    () => (isCardAction ? eligibleRows.filter((r) => r.cardRequestStatus !== 'requested') : eligibleRows),
    [eligibleRows, isCardAction]
  );

  const isRowSelectable = (row) => !isCardAction || row.cardRequestStatus !== 'requested';

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return eligibleRows;
    return eligibleRows.filter((s) => `${s.firstName} ${s.lastName} ${s.nationalId} ${s.universityEmail}`.toLowerCase().includes(term));
  }, [eligibleRows, search]);

  const selectedCount = selectedIds.length;

  const buildPayload = () => {
    if (action.fields === 'assign') {
      const coordinatorName = COORDINATORS.find((c) => c.username === assignValues.coordinatorUsername)?.name;
      return { ...assignValues, coordinatorName };
    }
    if (action.fields === 'reason') return { reason: reason || undefined };
    return undefined;
  };

  const validateFields = () => {
    if (action.fields === 'assign' && (!assignValues.departmentId || !assignValues.coordinatorUsername)) {
      return 'Department and coordinator are required.';
    }
    return '';
  };

  const handleDepartmentSelect = (departmentId) => {
    const dept = DEPARTMENTS.find((d) => d.id === departmentId);
    if (!dept) return;
    setAssignValues((v) => ({
      ...v,
      departmentId,
      department: dept.name,
      coordinatorUsername: dept.trainingCoordinator,
      branch: dept.branch,
      businessLine: dept.businessLine,
      buildingNumber: dept.buildingNumber,
      floorNumber: dept.floorNumber,
    }));
  };

  // Re-checks every selected id against the live student list right before
  // running, independent of whatever the table already filtered — so a
  // student who became ineligible after being selected is caught here.
  const revalidateSelection = () => {
    const invalid = [];
    selectedIds.forEach((id) => {
      const record = students.find((s) => s.id === id);
      if (!record || !action.isApplicable(record)) {
        invalid.push({
          id,
          name: record ? `${record.firstName} ${record.lastName}` : id,
          reason: record ? action.skipReason(record) : 'Student not found.',
        });
      }
    });
    return invalid;
  };

  const runAction = async () => {
    setSubmitting(true);
    const payload = buildPayload();
    const outcomes = [];

    for (const id of selectedIds) {
      const record = students.find((s) => s.id === id);
      const name = record ? `${record.firstName} ${record.lastName}` : id;
      if (!record || !action.isApplicable(record)) {
        outcomes.push({ id, name, status: 'error', message: record ? action.skipReason(record) : 'Student not found.' });
        continue;
      }
      try {
        await action.apply(hrData, record, payload);
        outcomes.push({ id, name, status: 'success', message: 'Done.' });
      } catch (err) {
        outcomes.push({ id, name, status: 'error', message: err.message });
      }
    }

    setResults(outcomes);
    setSubmitting(false);
    setSelectedIds([]);
    setConfirmOpen(false);
  };

  const handlePrimaryClick = () => {
    if (selectedCount === 0) return;
    const fieldError = validateFields();
    if (fieldError) {
      setFormError(fieldError);
      return;
    }
    setFormError('');
    setResults(null);

    const invalid = revalidateSelection();
    if (invalid.length > 0) {
      setBlocked(invalid);
      return;
    }
    setBlocked(null);

    if (action.needsConfirm) {
      setConfirmOpen(true);
    } else {
      runAction();
    }
  };

  const removeBlockedFromSelection = () => {
    if (!blocked) return;
    const invalidIds = new Set(blocked.map((b) => b.id));
    setSelectedIds((prev) => prev.filter((id) => !invalidIds.has(id)));
    setBlocked(null);
  };

  const resultTone = { success: 'complete', error: 'blocked' };
  const resultLabel = { success: 'Done', error: 'Failed' };
  const succeededCount = results ? results.filter((r) => r.status === 'success').length : 0;
  const failedCount = results ? results.filter((r) => r.status === 'error').length : 0;

  return (
    <DashboardShell navItems={HR_NAV_ITEMS}>
      <div className="dash-page">
        <div>
          <Link to="/app/hr" className="profile-header__back">
            ← Back to students
          </Link>
          <div className="bulk-action__header">
            <span className="bulk-action__icon" aria-hidden="true">
              {action.icon}
            </span>
            <div className="dash-page__intro">
              <h1>{action.title}</h1>
              <p>{action.description}</p>
            </div>
          </div>
        </div>

        <SectionCard title="Select trainees" subtitle={`${selectedCount} of ${selectableEligibleRows.length} eligible trainees selected`}>
          <div className="dash-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="dash-toolbar__search">
              <TextField
                label="Search"
                placeholder="Name, national ID, email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search eligible trainees"
              />
            </div>
          </div>

          {blocked && blocked.length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <FormBanner tone="error">
                {`${blocked.length} selected trainee${blocked.length === 1 ? ' is' : 's are'} no longer eligible: `}
                {blocked.map((b) => `${b.name} (${b.reason})`).join(', ')}.{' '}
                <Button variant="text" size="sm" onClick={removeBlockedFromSelection}>
                  Remove them from selection
                </Button>
              </FormBanner>
            </div>
          )}

          <DataTable
            columns={columns}
            rows={filteredRows}
            pageSize={100}
            selectable
            selectedIds={selectedIds}
            onSelectedChange={setSelectedIds}
            isRowSelectable={isRowSelectable}
            emptyTitle="No eligible trainees"
            emptyBody="No trainees currently qualify for this action."
          />
        </SectionCard>

        {action.fields === 'assign' && (
          <SectionCard title="Assignment details" subtitle="Applied to every selected trainee.">
            <div className="profile-form">
              <SelectField
                label="Department"
                name="departmentId"
                required
                placeholder="Select department"
                options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.name }))}
                value={assignValues.departmentId}
                onChange={(e) => handleDepartmentSelect(e.target.value)}
                hint="Selecting a department auto-fills the fields below — you can still edit them."
              />
              <div className="profile-form__row">
                <SelectField
                  label="Training Coordinator"
                  name="coordinatorUsername"
                  required
                  placeholder="Select coordinator"
                  options={COORDINATORS.map((c) => ({ value: c.username, label: c.name }))}
                  value={assignValues.coordinatorUsername}
                  onChange={(e) => setAssignValues((v) => ({ ...v, coordinatorUsername: e.target.value }))}
                />
                <SelectField
                  label="Branch"
                  name="branch"
                  options={BRANCHES.map((b) => ({ value: b, label: b }))}
                  value={assignValues.branch}
                  onChange={(e) => setAssignValues((v) => ({ ...v, branch: e.target.value }))}
                />
              </div>
              <div className="profile-form__row">
                <TextField
                  label="Business line"
                  name="businessLine"
                  hint="Optional"
                  value={assignValues.businessLine}
                  onChange={(e) => setAssignValues((v) => ({ ...v, businessLine: e.target.value }))}
                />
                <TextField
                  label="Building number"
                  name="buildingNumber"
                  hint="Optional"
                  value={assignValues.buildingNumber}
                  onChange={(e) => setAssignValues((v) => ({ ...v, buildingNumber: e.target.value }))}
                />
              </div>
              <div className="profile-form__row">
                <TextField
                  label="Floor number"
                  name="floorNumber"
                  hint="Optional"
                  value={assignValues.floorNumber}
                  onChange={(e) => setAssignValues((v) => ({ ...v, floorNumber: e.target.value }))}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {action.fields === 'reason' && (
          <SectionCard title="Reason" subtitle="Optional internal note, applied to every selected trainee.">
            <textarea
              className="textarea-input"
              placeholder="Reason (optional, internal use only)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </SectionCard>
        )}

        <SectionCard>
          {formError && <FormBanner tone="error">{formError}</FormBanner>}
          <div className="bulk-action__submit">
            <Button
              variant={action.danger ? 'danger' : 'primary'}
              onClick={handlePrimaryClick}
              loading={submitting && !action.needsConfirm}
              disabled={selectedCount === 0}
            >
              {action.submitLabel} ({selectedCount})
            </Button>
          </div>

          {results && (
            <div className="bulk-results">
              <div className="bulk-results__summary">
                {succeededCount} succeeded, {failedCount} failed.
              </div>
              {results.map((r) => (
                <div className="bulk-results__row" key={r.id}>
                  <span className="bulk-results__name">{r.name}</span>
                  <span className="bulk-results__message">{r.message}</span>
                  <StatusPill tone={resultTone[r.status]} label={resultLabel[r.status]} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {action.needsConfirm && (
        <ConfirmDialog
          open={confirmOpen}
          title={action.confirmTitle}
          body={action.confirmBody?.(selectedCount)}
          confirmLabel={action.submitLabel}
          danger={action.danger}
          size={action.fields === 'assign' ? 'md' : 'sm'}
          loading={submitting}
          onConfirm={runAction}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </DashboardShell>
  );
}

export default HRBulkActionPage;
