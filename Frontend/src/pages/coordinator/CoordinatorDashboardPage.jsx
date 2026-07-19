import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import DataTable from '../../components/dashboard/DataTable';
import TextField from '../../components/form/TextField';
import { useCoordinatorData } from '../../data/DataContext';
import { formatDate } from '../../utils/time';
import { PeopleIcon, GridIcon } from '../../components/dashboard/navIcons';
import '../../components/dashboard/DashboardPage.css';

const NAV_ITEMS = [
  { to: '/app/coordinator', label: 'My Students', icon: <PeopleIcon />, end: true },
  { to: '/app/coordinator/divisions', label: 'Divisions', icon: <GridIcon /> },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending_division', label: 'Pending Division' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_training', label: 'In Training' },
  { key: 'completed', label: 'Completed' },
];

function matchesFilter(record, filter) {
  const training = record.tracks.training;
  if (filter === 'all') return true;
  if (filter === 'pending_division') return record.tracks.divisionAssignment.status !== 'assigned';
  if (filter === 'not_started') return Boolean(training.notStarted);
  if (filter === 'in_training') return training.started && !training.completed;
  if (filter === 'completed') return Boolean(training.completed);
  return true;
}

function trainingStatusMeta(training) {
  if (training.completed) return { tone: 'complete', label: 'Completed' };
  if (training.started) return { tone: 'progress', label: 'In Training' };
  if (training.notStarted) return { tone: 'blocked', label: 'Not Started' };
  return { tone: 'neutral', label: 'Not confirmed' };
}

function CoordinatorDashboardPage() {
  const { students } = useCoordinatorData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const notStartedCount = students.filter((s) => s.tracks.training.notStarted).length;
  const inTrainingCount = students.filter((s) => s.tracks.training.started && !s.tracks.training.completed).length;

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students
      .filter((s) => matchesFilter(s, filter))
      .filter((s) => !term || `${s.firstName} ${s.lastName}`.toLowerCase().includes(term))
      .sort((a, b) => new Date(b.tracks.departmentAssignment.assignedAt).getTime() - new Date(a.tracks.departmentAssignment.assignedAt).getTime());
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
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{row.trainingDetails?.branch} Branch</div>
        </div>
      ),
    },
    {
      key: 'division',
      header: 'Division',
      render: (row) => row.tracks.divisionAssignment.division || '—',
    },
    {
      key: 'training',
      header: 'Training',
      render: (row) => {
        const meta = trainingStatusMeta(row.tracks.training);
        return <StatusPill tone={meta.tone} label={meta.label} />;
      },
    },
    { key: 'assigned', header: 'Assigned to you', render: (row) => formatDate(row.tracks.departmentAssignment.assignedAt) },
  ];

  return (
    <DashboardShell navItems={NAV_ITEMS}>
      <div className="dash-page">
        <div className="dash-page__intro">
          <h1>My students</h1>
          <p>Trainees assigned to you — you never see the full HR-wide database.</p>
        </div>

        <div className="dash-page__stats">
          <div className="dash-stat">
            <div className="dash-stat__value">{students.length}</div>
            <div className="dash-stat__label">Assigned to you</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__value">{inTrainingCount}</div>
            <div className="dash-stat__label">In training</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat__value">{notStartedCount}</div>
            <div className="dash-stat__label">Marked not started</div>
          </div>
        </div>

        <SectionCard title="Assigned students">
          <div className="dash-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="filter-tabs">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`filter-tabs__tab${filter === f.key ? ' filter-tabs__tab--active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
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
            onRowClick={(row) => navigate(`/app/coordinator/students/${row.id}`)}
            emptyTitle="No students match this view"
            emptyBody="Try a different filter, or ask HR to assign students to you."
          />
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

export default CoordinatorDashboardPage;
