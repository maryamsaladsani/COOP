import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import TrackCard from '../../components/dashboard/TrackCard';
import InfoField from '../../components/dashboard/InfoField';
import TRAINEE_NAV_ITEMS from './traineeNavItems';
import { getTrackSummaries } from '../../components/dashboard/trackSummaries';
import { useTraineeData } from '../../data/DataContext';
import { useNow } from '../../utils/time';
import './TraineeDashboard.css';


function TraineeDashboardPage() {
  const { record } = useTraineeData();
  const now = useNow();

  if (!record) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <SectionCard title="No record found">
          <p>We couldn't find your trainee record. Contact HR if this looks wrong.</p>
        </SectionCard>
      </DashboardShell>
    );
  }

  const { tracks, trainingDetails } = record;
  const tracksData = getTrackSummaries(record, now);

  return (
    <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
      <div className="trainee-dash">
        <div className="trainee-dash__intro">
          <h1>Your onboarding</h1>
          <p>Each track below updates independently as HR and your coordinator complete their steps.</p>
        </div>

        <div className="track-rail">
          {tracksData.map((t) => (
            <TrackCard key={t.name} icon={t.icon} label={t.name} tone={t.tone} statusLabel={t.statusLabel} detail={t.detail} />
          ))}
        </div>

        <SectionCard title="Training details" subtitle="Fields populate as HR and your coordinator complete each step.">
          <div className="info-grid">
            <InfoField label="Branch" value={trainingDetails.branch} />
            <InfoField label="Business line" value={trainingDetails.businessLine} />
            <InfoField label="Department" value={tracks.departmentAssignment.department} />
            <InfoField label="Division" value={tracks.divisionAssignment.division} />
            <InfoField label="Supervisor" value={tracks.divisionAssignment.managerName} />
            <InfoField label="Alternative supervisor" value={tracks.divisionAssignment.altSupervisorName} />
            <InfoField label="Training coordinator" value={tracks.departmentAssignment.coordinatorName} />
            <InfoField label="Building number" value={trainingDetails.buildingNumber} />
            <InfoField label="Floor number" value={trainingDetails.floorNumber} />
          </div>
        </SectionCard>

  

 
      </div>
    </DashboardShell>
  );
}

export default TraineeDashboardPage;
