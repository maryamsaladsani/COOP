import { useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import SectionCard from '../../components/dashboard/SectionCard';
import StatusPill from '../../components/dashboard/StatusPill';
import Button from '../../components/Button';
import TextField from '../../components/form/TextField';
import FormBanner from '../../components/form/FormBanner';
import { useTraineeData } from '../../data/DataContext';
import { formatDate } from '../../utils/time';
import { HomeIcon, DocumentIcon, SunriseIcon } from '../../components/dashboard/navIcons';
import './TraineeDashboard.css';

const NAV_ITEMS = [
  { to: '/app/trainee', label: 'Dashboard', icon: <HomeIcon />, end: true },
  { to: '/app/trainee/contract', label: 'Contract', icon: <DocumentIcon /> },
  { to: '/app/trainee/first-day', label: 'First day', icon: <SunriseIcon /> },
];

const CONTRACT_PARAGRAPHS = [
  'This Co-Operative Training Agreement ("Agreement") is entered into between Saudi Energy ("the Company") and the trainee named below, in connection with the Company\'s Coordinated Onboarding & Operations Program ("COOP").',
  'The trainee agrees to complete the assigned training program in the department and division communicated through the COOP platform, under the supervision of the assigned Training Coordinator and division supervisor.',
  'The Company will provide the trainee with the facilities, access, and guidance reasonably required to complete the training program, including a company card, a Saudi Energy user account, and a desk and device where applicable.',
  'The trainee agrees to observe the Company\'s code of conduct, confidentiality obligations, health and safety policies, and attendance requirements for the duration of the training period stated on their application.',
  'Either party may raise concerns about the training placement to the Training Coordinator or HR at any time. The Company may withdraw a trainee from the program in accordance with its internal policies, with notice provided to the trainee.',
  'By signing below, the trainee confirms they have read, understood, and agree to the terms of this Agreement for the training period defined in their onboarding record.',
];

function TraineeContractPage() {
  const { record, signContract } = useTraineeData();
  const [agreed, setAgreed] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!record) {
    return (
      <DashboardShell navItems={NAV_ITEMS}>
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
    <DashboardShell navItems={NAV_ITEMS}>
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
          <div className="contract-text">
            {CONTRACT_PARAGRAPHS.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
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
