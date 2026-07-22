import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import DataTable from '../../components/dashboard/DataTable';
import FormBanner from '../../components/form/FormBanner';
import TextField from '../../components/form/TextField';
import SelectField from '../../components/form/SelectField';
import Button from '../../components/Button';
import { useCoordinatorData } from '../../data/DataContext';
import { DIVISIONS } from '../../data/mockData';
import COORDINATOR_NAV_ITEMS from './coordinatorNavItems';
import BULK_ACTIONS from './bulkActions';
import './CoordinatorBulkAction.css';

const DIVISION_INITIAL = { division: '', managerName: '', altSupervisorName: '' };

// Route-level wrapper: /app/coordinator/bulk/:actionType matches the same
// <Route> element regardless of which action is selected, so React Router
// keeps one component instance mounted across sidebar clicks between
// actions. Keying the actual view on actionType forces a full remount —
// and therefore a full state reset (selection, form fields, results) —
// every time the coordinator switches actions, instead of leaking the
// previous action's selections/results into the next one.
function CoordinatorBulkActionPage() {
  const { actionType } = useParams();
  const action = BULK_ACTIONS[actionType];

  if (!action) {
    return <Navigate to="/app/coordinator" replace />;
  }

  return <CoordinatorBulkActionView key={actionType} action={action} />;
}

function CoordinatorBulkActionView({ action }) {
  const coordinatorData = useCoordinatorData();
  const { students } = coordinatorData;

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [divisionValues, setDivisionValues] = useState(DIVISION_INITIAL);
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(term));
  }, [students, search]);

  const selectedCount = selectedIds.length;

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
            {row.firstName} {row.lastName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.trainingDetails?.branch} Branch</div>
        </div>
      ),
    },
    { key: 'current', header: 'Current status', render: (row) => action.currentStatus(row) },
    {
      key: 'eligibility',
      header: 'Eligibility',
      render: (row) =>
        action.isApplicable(row) ? (
          <StatusPill tone="complete" label="Eligible" />
        ) : (
          <StatusPill tone="neutral" label={`Skip — ${action.skipReason(row)}`} />
        ),
    },
  ];

  const buildPayload = () => {
    if (action.fields === 'division') return divisionValues;
    if (action.fields === 'date') return { date: date || undefined };
    return undefined;
  };

  const validate = () => {
    if (selectedCount === 0) return 'Select at least one student.';
    if (action.fields === 'division' && (!divisionValues.division || !divisionValues.managerName.trim())) {
      return 'Division and manager name are required.';
    }
    return '';
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError('');
    setSubmitting(true);
    setResults([]);
    const payload = buildPayload();

    for (const id of selectedIds) {
      const record = students.find((s) => s.id === id);
      const name = record ? `${record.firstName} ${record.lastName}` : id;

      if (!record) {
        setResults((prev) => [...prev, { id, name, status: 'error', message: 'Student not found.' }]);
        continue;
      }
      if (!action.isApplicable(record)) {
        setResults((prev) => [...prev, { id, name, status: 'skipped', message: action.skipReason(record) }]);
        continue;
      }
      try {
        await action.apply(coordinatorData, id, payload);
        setResults((prev) => [...prev, { id, name, status: 'success', message: 'Done.' }]);
      } catch (err) {
        setResults((prev) => [...prev, { id, name, status: 'error', message: err.message }]);
      }
    }

    setSubmitting(false);
  };

  const resultTone = { success: 'complete', skipped: 'neutral', error: 'blocked' };
  const resultLabel = { success: 'Done', skipped: 'Skipped', error: 'Error' };

  return (
    <DashboardShell navItems={COORDINATOR_NAV_ITEMS}>
      <div className="dash-page">
        <div>
          <Link to="/app/coordinator" className="profile-header__back">
            ← Back to my students
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

        <SectionCard title="Select students" subtitle={`${selectedCount} of ${students.length} assigned students selected`}>
          <div className="dash-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="dash-toolbar__search">
              <TextField
                label="Search"
                placeholder="Search by name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search assigned students"
              />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={filteredRows}
            pageSize={50}
            selectable
            selectedIds={selectedIds}
            onSelectedChange={setSelectedIds}
            isRowSelectable={(row) => action.isApplicable(row)}
            emptyTitle="No students match this search"
            emptyBody="Try a different search term."
          />
        </SectionCard>

        {action.fields === 'division' && (
          <SectionCard title="Division details" subtitle="Applied to every selected student.">
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
            </div>
          </SectionCard>
        )}

        {action.fields === 'date' && (
          <SectionCard title="Date" subtitle="Optional — defaults to today for every selected student.">
            <TextField label="Date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </SectionCard>
        )}

        <SectionCard>
          {formError && <FormBanner tone="error">{formError}</FormBanner>}
          <div className="bulk-action__submit">
            <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={selectedCount === 0}>
              {action.submitLabel} ({selectedCount})
            </Button>
          </div>

          {results && results.length > 0 && (
            <div className="bulk-results">
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
    </DashboardShell>
  );
}

export default CoordinatorBulkActionPage;
