import { useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import TrackCard from '../../components/dashboard/TrackCard';
import MilestoneRoadmap from '../../components/dashboard/MilestoneRoadmap';
import InfoField from '../../components/dashboard/InfoField';
import EmptyState from '../../components/dashboard/EmptyState';
import FormBanner from '../../components/form/FormBanner';
import ContractSignatureNotice from '../../components/dashboard/ContractSignatureNotice';
import TRAINEE_NAV_ITEMS from './TraineeNavItems';
import { getTrackSummaries } from '../../components/dashboard/trackSummaries';
import { useTraineeData } from '../../data/DataContext';
import { CONTRACT_NOTICE_DISMISSED_KEY } from '../../context/AuthContext';
import { useNow } from '../../utils/time';
import './TraineeDashboard.css';

function readDismissed() {
  try {
    return window.sessionStorage.getItem(CONTRACT_NOTICE_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function TraineeDashboardPage() {
  const { record, loading, error } = useTraineeData();
  const now = useNow();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (loading) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <EmptyState title="Loading your onboarding status…" />
      </DashboardShell>
    );
  }

  if (error || !record) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <SectionCard title="No record found">
          {error ? <FormBanner tone="error">{error}</FormBanner> : <p>We couldn't find your trainee record. Contact HR if this looks wrong.</p>}
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

        {!tracks.contract.signed && !dismissed && (
          <ContractSignatureNotice
            onDismiss={() => {
              setDismissed(true);
              try {
                window.sessionStorage.setItem(CONTRACT_NOTICE_DISMISSED_KEY, 'true');
              } catch {
                // sessionStorage unavailable (e.g. private mode) — dismissal just won't persist
              }
            }}
          />
        )}

        <SectionCard title="Onboarding roadmap" subtitle="Your milestones from acceptance to certificate.">
          <MilestoneRoadmap steps={tracksData} />
        </SectionCard>

        <div className="track-rail">
          {tracksData.map((t) => (
            <TrackCard key={t.name} icon={t.icon} label={t.name} tone={t.tone} statusLabel={t.statusLabel} detail={t.detail} />
          ))}
        </div>

        <SectionCard title="Training details" subtitle="Fields populate as HR and your coordinator complete each step.">
          <div className="info-grid">
            <InfoField label="Branch" value={trainingDetails?.branch} />
            <InfoField label="Business line" value={trainingDetails?.businessLine} />
            <InfoField label="Department" value={tracks.departmentAssignment.department} />
            <InfoField label="Division" value={tracks.divisionAssignment.division} />
            <InfoField label="Training coordinator" value={tracks.departmentAssignment.coordinatorName} />
            <InfoField label="Building number" value={trainingDetails?.buildingNumber} />
            <InfoField label="Floor number" value={trainingDetails?.floorNumber} />
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

export default TraineeDashboardPage;
