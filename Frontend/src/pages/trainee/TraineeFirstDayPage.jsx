import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import { HomeIcon, DocumentIcon, SunriseIcon, PeopleIcon } from '../../components/dashboard/navIcons';
import { DeskIcon, CardIcon, AccountIcon } from '../../components/dashboard/trackIcons';
import './TraineeDashboard.css';

const NAV_ITEMS = [
  { to: '/app/trainee', label: 'Dashboard', icon: <HomeIcon />, end: true },
  { to: '/app/trainee/contract', label: 'Contract', icon: <DocumentIcon /> },
  { to: '/app/trainee/first-day', label: 'First day', icon: <SunriseIcon /> },
];

// Structure only — copy is placeholder until HR/Comms provides the final
// orientation content (REQ-06).
const SECTIONS = [
  { icon: <CardIcon />, title: 'Where to go', body: 'Building and entrance details for your first day will appear here once confirmed.' },
  { icon: <DeskIcon />, title: 'What to bring', body: 'A checklist of documents and items to bring on day one will appear here.' },
  { icon: <AccountIcon />, title: 'Getting set up', body: 'How to activate your company account and card on arrival will appear here.' },
  { icon: <PeopleIcon />, title: 'Who to contact', body: "Your Training Coordinator's contact details will appear here." },
];

function TraineeFirstDayPage() {
  return (
    <DashboardShell navItems={NAV_ITEMS}>
      <div className="trainee-dash">
        <div className="trainee-dash__intro">
          <h1>Your first day in Saudi Energy</h1>
          <p>An overview of what to expect. Full orientation content is on its way.</p>
        </div>

        <SectionCard title="Getting oriented">
          <div className="orientation-page">
            {SECTIONS.map((section) => (
              <div className="orientation-page__item" key={section.title}>
                <span className="orientation-page__icon" aria-hidden="true">
                  {section.icon}
                </span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

export default TraineeFirstDayPage;
