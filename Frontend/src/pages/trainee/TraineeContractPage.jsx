import { useState } from 'react';
import trainingContract from '../../data/Mock_Training_Contract_COOP.pdf';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import EmptyState from '../../components/dashboard/EmptyState';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import FormBanner from '../../components/form/FormBanner';
import TRAINEE_NAV_ITEMS from './TraineeNavItems';
import { useTraineeData, useTraineeContract } from '../../data/DataContext';
import { formatDate } from '../../utils/time';
import './TraineeDashboard.css';


function TraineeContractPage() {
  const { record, loading: recordLoading } = useTraineeData();
  const { contractSigned, contractSignedAt, loading: contractLoading, error: contractError, signContract } = useTraineeContract();
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (recordLoading || contractLoading) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <EmptyState title="Loading your contract…" />
      </DashboardShell>
    );
  }

  if (contractError || !record) {
    return (
      <DashboardShell navItems={TRAINEE_NAV_ITEMS}>
        <SectionCard title="Couldn't load your contract">
          {contractError && <FormBanner tone="error">{contractError}</FormBanner>}
        </SectionCard>
      </DashboardShell>
    );
  }

  // REQ-07 depends only on REQ-15/16 (the account existing) — reaching this
  // page at all means that's true, so the contract is always available here
  // (unlike the old mock, which additionally gated on the coordinator
  // confirming training had started — that extra gate wasn't in the spec).
  const isAvailable = true;

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
      await signContract();
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
            contractSigned ? (
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
          {contractSigned ? (
            <FormBanner tone="success">
              Signed by {record.firstName} {record.lastName} on {formatDate(contractSignedAt)}.
            </FormBanner>
          ) : !isAvailable ? (
            <FormBanner tone="info">
              Your contract becomes available to sign once your account is set up.
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
