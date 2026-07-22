import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import Button from '../../components/Button';
import { useTraineeData } from '../../data/DataContext';
import { formatDate } from '../../utils/time';
import TRAINEE_NAV_ITEMS from './traineeNavItems';
import './TraineeDashboard.css';


function handleCertificateDownload(record) {
  const content = `Certificate of Completion

This certifies that ${record.firstName} ${record.lastName} has completed the Saudi Energy Coordinated Onboarding & Operations Program.

Division: ${record.tracks.divisionAssignment.division}
Issued: ${formatDate(record.tracks.certificate.issuedAt)}`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${record.firstName}-${record.lastName}-certificate.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function TraineeCertificatePage() {
  const { record } = useTraineeData();

  if (!record) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <SectionCard title="No record found">
          <p>
            We couldn't find your trainee record. Contact HR if this looks
            wrong.
          </p>
        </SectionCard>
      </DashboardShell>
    );
  }

  const certificateReady =
    record.tracks?.certificate?.status === 'issued';

  return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <div className="trainee-dash">

          <div className="trainee-dash__intro">
            <h1>Completion Certificate</h1>
          </div>

          <SectionCard>
            {certificateReady ? (
                <>
                  <p>Your completion certificate is ready.</p>

                  <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleCertificateDownload(record)}
                  >
                    Download final certificate
                  </Button>
                </>
            ) : (
                <>
                  <h3>Your certificate isn't ready yet.</h3>

                  <p>
                    HR issues this once your coordinator confirms you have started
                    and completed training.
                  </p>

                  <Button type="button" disabled>
                    Download final certificate
                  </Button>
                </>
            )}
          </SectionCard>
          </div>
      </DashboardShell>
);
}

export default TraineeCertificatePage;