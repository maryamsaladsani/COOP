import { useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import EmptyState from '../../components/dashboard/EmptyState';
import Button from '../../components/Button';
import FormBanner from '../../components/form/FormBanner';
import { useTraineeData, downloadTraineeCertificate } from '../../data/DataContext';
import TRAINEE_NAV_ITEMS from './TraineeNavItems';
import './TraineeDashboard.css';


function TraineeCertificatePage() {
  const { record, loading, error } = useTraineeData();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  if (loading) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <EmptyState title="Loading…" />
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

  const certificateReady = record.tracks?.certificate?.status === 'issued';

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadTraineeCertificate();
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <div className="trainee-dash">

          <div className="trainee-dash__intro">
            <h1>Completion Certificate</h1>
          </div>

          <SectionCard>
            {downloadError && <FormBanner tone="error">{downloadError}</FormBanner>}
            {certificateReady ? (
                <>
                  <p>Your completion certificate is ready.</p>

                  <Button
                      type="button"
                      variant="primary"
                      onClick={handleDownload}
                      loading={downloading}
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
