import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import { useCoordinatorData } from '../../data/DataContext';
import { DIVISIONS } from '../../data/mockData';
import { DivisionIcon } from '../../components/dashboard/trackIcons';
import { PeopleIcon, GridIcon } from '../../components/dashboard/navIcons';
import '../../components/dashboard/DashboardPage.css';
import './CoordinatorDivisions.css';

const NAV_ITEMS = [
  { to: '/app/coordinator', label: 'My Students', icon: <PeopleIcon />, end: true },
  { to: '/app/coordinator/divisions', label: 'Divisions', icon: <GridIcon /> },
];

function CoordinatorDivisionsPage() {
  const { students } = useCoordinatorData();

  return (
    <DashboardShell navItems={NAV_ITEMS}>
      <div className="dash-page">
        <div className="dash-page__intro">
          <h1>Divisions</h1>
          <p>Where your assigned trainees can be placed. Full division profiles will be added later.</p>
        </div>

        <SectionCard>
          <div className="division-grid">
            {DIVISIONS.map((division) => {
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
      </div>
    </DashboardShell>
  );
}

export default CoordinatorDivisionsPage;
