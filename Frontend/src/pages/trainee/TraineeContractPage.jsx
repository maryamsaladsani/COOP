import { useState } from 'react';
import trainingContract from '../../data/Mock_Training_Contract_COOP.pdf';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import FormBanner from '../../components/form/FormBanner';
import TRAINEE_NAV_ITEMS from './traineeNavItems';
import { useTraineeData } from '../../data/DataContext';
import { formatDate } from '../../utils/time';
import './TraineeDashboard.css';


function TraineeContractPage() {
  const { record, signContract } = useTraineeData();
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!record) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <SectionCard title="No record found">
          <p>We couldn't find your trainee record.</p>
        </SectionCard>
      </DashboardShell>
    );
  }

  const { contract } = record.tracks;
  const isAvailable = Boolean(contract.availableAt) && new Date(contract.availableAt).getTime() <= Date.now();

  const handleSign = async () => {
    setError('');
    if (!agreed) {
      setError('Confirm that you have read and agree to the contract before signing.');
      return;
    }
    if (signedName.trim().toLowerCase() !== `${record.firstName} ${record.lastName}`.toLowerCase()) {
      setError('Type your full legal name exactly as it appears on your application to sign.');
      return;
    }
    setLoading(true);
    try {
      await signContract({ signedName: signedName.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
      <div className="trainee-dash">
        <div className="trainee-dash__intro">
          <h1>Your training contract</h1>
          <p>Review the full agreement below. Signing is a separate, explicit step once you've read it.</p>
        </div>

        <SectionCard
          title="Agreement"
          actions={
            contract.signed ? (
              <StatusPill tone="complete" label="Signed" />
            ) : isAvailable ? (
              <StatusPill tone="progress" label="Ready to sign" />
            ) : (
              <StatusPill tone="neutral" label="Not yet available" />
            )
          }
        >
        <div className="contract-pdf">
          <iframe
            src={trainingContract}
            title="Training Contract"
            className="contract-pdf__viewer"
          />

        <div className="contract-pdf__actions">
          <a
            href={trainingContract}
            target="_blank"
            rel="noreferrer"
            className="contract-pdf__link"
          >
            Open PDF
          </a>

          <a
            href={trainingContract}
            download="Mock_Training_Contract_COOP.pdf"
            className="contract-pdf__link"
          >
            Download PDF
          </a>
        </div>
      </div>
        </SectionCard>

        <SectionCard title="Sign contract digitally">
          {contract.signed ? (
            <FormBanner tone="success">
              Signed by {contract.signedName} on {formatDate(contract.signedAt)}.
            </FormBanner>
          ) : !isAvailable ? (
            <FormBanner tone="info">
              Your contract becomes available to sign once your Training Coordinator confirms you've started training.
            </FormBanner>
          ) : (
            <div className="contract-sign">
              <label className="contract-sign__agree">
                <input type="checkbox" className="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I have read and agree to the terms of this training agreement.
              </label>
              <TextField
                label="Type your full name to sign"
                name="signedName"
                placeholder={`${record.firstName} ${record.lastName}`}
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
              />
              {error && <FormBanner tone="error">{error}</FormBanner>}
              <Button variant="primary" onClick={handleSign} loading={loading}>
                Sign contract digitally
              </Button>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

export default TraineeContractPage;
