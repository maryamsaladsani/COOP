import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import DataTable from '../../components/dashboard/DataTable';
import EmptyState from '../../components/dashboard/EmptyState';
import FormBanner from '../../components/form/FormBanner';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import { useHRData } from '../../data/DataContext';
import HR_NAV_ITEMS from './hrNavItems';
import getHRStudentColumns from './hrStudentColumns';
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

function HRDashboardPage() {
  const { students, loading, error } = useHRData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

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

  const columns = getHRStudentColumns();

  return (
    <DashboardShell navItems={HR_NAV_ITEMS}>
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
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/app/hr/bulk/assign', { state: { preselectedIds: selectedIds } })}
              >
                Assign to Coordinator
              </Button>
            </div>
          )}

          {loading && <EmptyState title="Loading students…" />}
          {!loading && error && <FormBanner tone="error">Couldn't load students: {error}</FormBanner>}
          {!loading && !error && (
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
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

export default HRDashboardPage;
