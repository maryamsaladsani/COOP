import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import DataTable from '../../components/dashboard/DataTable';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import SelectField from '../../components/form/SelectField';
import { useHRData } from '../../data/DataContext';
import { statusMeta } from '../../utils/statusMeta';
import { formatDate } from '../../utils/time';
import { BRANCHES, COORDINATORS } from '../../data/mockData';
import '../../components/dashboard/DashboardPage.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Active' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'withdrawn', label: 'Withdrawn' },
];

function matchesFilter(record, filter) {
  if (filter === 'all') return true;
  if (filter === 'not_started') return Boolean(record.tracks?.training?.notStarted);
  return record.applicationStatus === filter;
}

const ASSIGN_INITIAL = { department: '', coordinatorUsername: '', branch: 'Eastern', businessLine: '', buildingNumber: '', floorNumber: '' };

function HRDashboardPage() {
  const { students, assignToCoordinator } = useHRData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignValues, setAssignValues] = useState(ASSIGN_INITIAL);
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const pendingCount = students.filter((s) => s.applicationStatus === 'pending').length;
  const activeCount = students.filter((s) => s.applicationStatus === 'accepted').length;
  const notStartedCount = students.filter((s) => s.tracks?.training?.notStarted).length;

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students
      .filter((s) => matchesFilter(s, filter))
      .filter((s) => {
        if (!term) return true;
        const haystack = `${s.firstName} ${s.lastName} ${s.nationalId} ${s.universityEmail}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [students, filter, search]);

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
            {row.firstName} {row.lastName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.universityName}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const meta = statusMeta(row.applicationStatus);
        return <StatusPill tone={meta.tone} label={meta.label} />;
      },
    },
    {
      key: 'coordinator',
      header: 'Coordinator',
      render: (row) => row.tracks?.departmentAssignment?.coordinatorName || '—',
    },
    { key: 'submitted', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
  ];

  const handleOpenAssign = () => {
    setAssignValues(ASSIGN_INITIAL);
    setAssignError('');
    setAssignOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!assignValues.department.trim() || !assignValues.coordinatorUsername) {
      setAssignError('Department and coordinator are required.');
      return;
    }
    const coordinator = COORDINATORS.find((c) => c.username === assignValues.coordinatorUsername);
    setAssignLoading(true);
    setAssignError('');
    try {
      await assignToCoordinator(selectedIds, { ...assignValues, coordinatorName: coordinator?.name });
      setAssignOpen(false);
      setSelectedIds([]);
    } catch (err) {
      setAssignError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="dash-page">
        <div className="dash-page__intro">
          <h1>Students</h1>
          <p>Review applications, manage assignments, and track every trainee's onboarding.</p>
        </div>

        <div className="dash-page__stats">
          <div className="dash-stat">
            <div className="dash-stat__value">{pendingCount}</div>
            <div className="dash-stat__label">Pending applications</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__value">{activeCount}</div>
            <div className="dash-stat__label">Active trainees</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__value">{notStartedCount}</div>
            <div className="dash-stat__label">Marked not started</div>
          </div>
        </div>

        <SectionCard title="Students database">
          <div className="dash-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="filter-tabs">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`filter-tabs__tab${filter === f.key ? ' filter-tabs__tab--active' : ''}`}
                  onClick={() => {
                    setFilter(f.key);
                    setSelectedIds([]);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="dash-toolbar__search">
              <TextField
                label="Search"
                placeholder="Name, national ID, email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search students"
              />
            </div>
          </div>

          {filter === 'accepted' && selectedIds.length > 0 && (
            <div className="dash-toolbar__batch" style={{ marginBottom: 'var(--space-4)' }}>
              <span className="dash-toolbar__batch-count">{selectedIds.length} selected</span>
              <Button variant="primary" size="sm" onClick={handleOpenAssign}>
                Assign to Coordinator
              </Button>
            </div>
          )}

          <DataTable
            columns={columns}
            rows={filteredRows}
            selectable={filter === 'accepted'}
            selectedIds={selectedIds}
            onSelectedChange={setSelectedIds}
            onRowClick={(row) => navigate(`/app/hr/students/${row.id}`)}
            emptyTitle="No students match this view"
            emptyBody="Try a different filter or search term."
          />
        </SectionCard>
      </div>

      <ConfirmDialog
        open={assignOpen}
        title="Assign to Training Coordinator"
        body={`Assigning ${selectedIds.length} student${selectedIds.length === 1 ? '' : 's'}. This sets their department and coordinator; branch, business line, building, and floor are optional.`}
        confirmLabel="Assign"
        size="md"
        loading={assignLoading}
        error={assignError}
        onConfirm={handleAssignSubmit}
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
    </DashboardShell>
  );
}

export default HRDashboardPage;
