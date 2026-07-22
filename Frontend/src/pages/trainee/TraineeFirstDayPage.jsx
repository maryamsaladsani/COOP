import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import TRAINEE_NAV_ITEMS from './traineeNavItems';
import { PeopleIcon } from '../../components/dashboard/navIcons';
import { DeskIcon, CardIcon } from '../../components/dashboard/trackIcons';
import './TraineeDashboard.css';



// Structure only — copy is placeholder until HR/Comms provides the final
// orientation content (REQ-06).
const SECTIONS = [
  { icon: <CardIcon />, title: 'Where to go', body: 'On your first day, report to the HR Department in Phase 2 on Ground Floor at the Saudi Energy Headquarters. Please check in with the HR representative who sent your acceptance email. HR will welcome you, complete the initial onboarding process, and guide you to your assigned department and Training Coordinator.' },
  { icon: <DeskIcon />, title: 'What to bring', body: 'There is no need to bring any documents, as your onboarding has already been completed through the COOP platform. Simply bring your personal belongings and your motivation and arrive on time for your first day as a trinee in Saudi Energy company.' },
  { icon: <PeopleIcon />, title: 'Who to contact',
    // body: 'HR Department Email: hr.coop@saudienergy.com,  Training Coordinator Email: coordinator@saudienergy.com,  Training Supervisor Email: supervisor@saudienergy.com'
    contacts: [
      { label: 'HR Department', email: 'hr.coop@se.com.sa' },
      { label: 'Training Coordinator', email: 'coordinator@se.com.sa' },
      { label: 'Training Supervisor', email: 'supervisor@se.com.sa' },
    ],
  },
];

function TraineeFirstDayPage() {
  return (
    <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
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
                  {/*<p>{section.body}</p>*/}
                  <p>
                    {section.contacts ? (
                      section.contacts.map((c) => (
                          <div key={c.label}>{c.label} Email: {c.email}</div>
                      ))
                  ) : (
                      <p>{section.body}</p>
                  )}
                  </p>
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
