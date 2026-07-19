import { Link } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import TrackCard from '../../components/dashboard/TrackCard';
import InfoField from '../../components/dashboard/InfoField';
import { getTrackSummaries } from '../../components/dashboard/trackSummaries';
import Button from '../../components/Button';
import { useTraineeData } from '../../data/DataContext';
import { useNow, formatDate } from '../../utils/time';
import { HomeIcon, DocumentIcon, SunriseIcon } from '../../components/dashboard/navIcons';
import './TraineeDashboard.css';

const NAV_ITEMS = [
  { to: '/app/trainee', label: 'Dashboard', icon: <HomeIcon />, end: true },
  { to: '/app/trainee/contract', label: 'Contract', icon: <DocumentIcon /> },
  { to: '/app/trainee/first-day', label: 'First day', icon: <SunriseIcon /> },
];

function handleCertificateDownload(record) {
  const content = `Certificate of Completion\n\nThis certifies that ${record.firstName} ${record.lastName} has completed the Saudi Energy Coordinated Onboarding & Operations Program.\n\nDivision: ${record.tracks.divisionAssignment.division}\nIssued: ${formatDate(record.tracks.certificate.issuedAt)}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${record.firstName}-${record.lastName}-certificate.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function TraineeDashboardPage() {
  const { record } = useTraineeData();
  const now = useNow();

  if (!record) {
    return (
      <DashboardShell navItems={NAV_ITEMS}>
        <SectionCard title="No record found">
          <p>We couldn't find your trainee record. Contact HR if this looks wrong.</p>
        </SectionCard>
      </DashboardShell>
    );
  }

  const { tracks, trainingDetails } = record;
  const tracksData = getTrackSummaries(record, now);
  const certificateIssued = tracks.certificate.status === 'issued';

  return (
    <DashboardShell navItems={NAV_ITEMS}>
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

        <SectionCard
          title="Your contract"
          subtitle={
            tracks.contract.signed
              ? `Signed on ${formatDate(tracks.contract.signedAt)}.`
              : tracks.contract.availableAt
              ? 'Ready for your review and signature.'
              : 'Becomes available once your coordinator confirms you started training.'
          }
          actions={
            <Link to="/app/trainee/contract">
              <Button variant="secondary" size="sm">
                {tracks.contract.signed ? 'View signed contract' : 'View contract'}
              </Button>
            </Link>
          }
        />

        <SectionCard title="Your first day in Saudi Energy" subtitle="Orientation content to help you prepare.">
          <Link to="/app/trainee/first-day">
            <Button variant="secondary" size="sm">
              Read orientation guide
            </Button>
          </Link>
        </SectionCard>

        <SectionCard title="Completion certificate">
          {certificateIssued ? (
            <div className="cert-download">
              <p>Your certificate is ready.</p>
              <Button variant="primary" size="sm" onClick={() => handleCertificateDownload(record)}>
                Download final certificate
              </Button>
            </div>
          ) : (
            <div className="cert-download cert-download--disabled">
              <p>Your certificate isn't ready yet.</p>
              <span className="cert-download__reason">
                HR issues this once your coordinator confirms you've started and completed training.
              </span>
              <Button variant="secondary" size="sm" disabled>
                Download final certificate
              </Button>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

export default TraineeDashboardPage;
