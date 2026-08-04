import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import './ContractSignatureNotice.css';

// Fix 4: shown on the Trainee dashboard whenever contractSigned === false — the
// Coordinator can't act on this trainee until they sign (see Fix 3). Dismissible
// for the current session only; TraineeDashboardPage re-shows it on next login
// (dismissal is cleared at logout, see AuthContext's CONTRACT_NOTICE_DISMISSED_KEY)
// and stops rendering entirely, with no manual refresh, once contractSigned flips
// to true on the next data fetch.
function ContractSignatureNotice({ onDismiss }) {
  const navigate = useNavigate();

  return (
    <div className="contract-notice" role="status">
      <div className="contract-notice__body">
        <h3 className="contract-notice__title">Action required: Sign your contract</h3>
        <p className="contract-notice__text">
          Your coordinator can't proceed with onboarding actions until you sign your contract.
        </p>
      </div>
      <div className="contract-notice__actions">
        <Button variant="primary" size="sm" onClick={() => navigate('/app/trainee/contract')}>
          Go to Contract
        </Button>
        <button type="button" className="contract-notice__dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}

export default ContractSignatureNotice;
