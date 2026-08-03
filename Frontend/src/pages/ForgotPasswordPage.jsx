import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import TextField from '../components/form/TextField';
import Button from '../components/Button';
import FormBanner from '../components/form/FormBanner';
import * as authApi from '../data/mockAuth';
import { isRequired, isValidEmail } from '../utils/validation';
import './ForgotPasswordPage.css';

const STEP_REQUEST = 'request';
const STEP_SENT = 'sent';

function RequestStep({ onSent }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isRequired(email)) {
      setError('Enter your personal email.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setBanner('');
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      onSent(email);
    } catch (err) {
      setBanner(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {banner && (
        <div className="forgot-password__banner">
          <FormBanner tone="error">{banner}</FormBanner>
        </div>
      )}
      <TextField
        label="Personal email"
        name="personalEmail"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        hint="We'll send a password reset link to the personal email on file for your account."
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError('');
        }}
        error={error}
      />
      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}

function SentStep({ email }) {
  return (
    <div className="forgot-password__done">
      <FormBanner tone="success">
        If an account exists for {email}, a password reset link has been sent. It expires in 1 hour.
      </FormBanner>
      <Button variant="primary" fullWidth onClick={() => window.location.reload()}>
        Send another link
      </Button>
    </div>
  );
}

function ForgotPasswordPage() {
  const [step, setStep] = useState(STEP_REQUEST);
  const [email, setEmail] = useState('');

  const subtitleByStep = {
    [STEP_REQUEST]: 'Enter your personal email and we will send you a link to reset your password.',
    [STEP_SENT]: null,
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle={subtitleByStep[step]}
      footer={
        step !== STEP_SENT && (
          <span>
            Remembered it? <Link to="/signin">Sign in</Link>
          </span>
        )
      }
    >
      {step === STEP_REQUEST && (
        <RequestStep
          onSent={(sentEmail) => {
            setEmail(sentEmail);
            setStep(STEP_SENT);
          }}
        />
      )}
      {step === STEP_SENT && <SentStep email={email} />}
    </AuthShell>
  );
}

export default ForgotPasswordPage;
