import { useMemo } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import EmptyState from '../../components/dashboard/EmptyState';
import FormBanner from '../../components/form/FormBanner';
import { useCoordinatorData } from '../../data/DataContext';
import { DivisionIcon } from '../../components/dashboard/trackIcons';
import COORDINATOR_NAV_ITEMS from './coordinatorNavItems';
import '../../components/dashboard/DashboardPage.css';
import './CoordinatorDivisions.css';

function CoordinatorDivisionsPage() {
  const { students, loading, error } = useCoordinatorData();

  // Union of divisions across this coordinator's own trainees' departments (Fix: no more
  // single global list) — same scoping as the bulk assign-division picker.
  const divisions = useMemo(() => {
    const names = new Set();
    students.forEach((s) => (s.tracks?.departmentAssignment?.divisions || []).forEach((d) => names.add(d)));
    return [...names].sort();
  }, [students]);

  return (
    <DashboardShell navItems={COORDINATOR_NAV_ITEMS}>
      <div className="dash-page">
        <div className="dash-page__intro">
          <h1>Divisions</h1>
          <p>Where your assigned trainees can be placed. Full division profiles will be added later.</p>
        </div>

        {loading && <EmptyState title="Loading…" />}
        {!loading && error && <FormBanner tone="error">Couldn't load students: {error}</FormBanner>}
        {!loading && !error && divisions.length === 0 && (
          <EmptyState title="No divisions defined yet" body="Your trainees' department(s) don't have any divisions set up yet." />
        )}
        {!loading && !error && divisions.length > 0 && (
        <SectionCard>
          <div className="division-grid">
            {divisions.map((division) => {
              const count = students.filter((s) => s.tracks.divisionAssignment.division === division).length;
              return (
                <div className="division-card" key={division}>
                  <span className="division-card__icon" aria-hidden="true">
                    <DivisionIcon />
                  </span>
                  <h3>{division}</h3>
                  <p>
                    {count} trainee{count === 1 ? '' : 's'} from you assigned here
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
        )}
      </div>
    </DashboardShell>
  );
}

export default CoordinatorDivisionsPage;
