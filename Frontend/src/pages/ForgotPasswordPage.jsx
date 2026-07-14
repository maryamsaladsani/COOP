import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import TextField from '../components/form/TextField';
import PasswordField from '../components/form/PasswordField';
import Button from '../components/Button';
import FormBanner from '../components/form/FormBanner';
import * as authApi from '../data/mockAuth';
import { isRequired, isValidEmail, isPasswordStrongEnough, runValidators } from '../utils/validation';
import './ForgotPasswordPage.css';

const STEP_REQUEST = 'request';
const STEP_VERIFY = 'verify';
const STEP_DONE = 'done';

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
        hint="We'll send a verification code to the personal email on file for your account."
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError('');
        }}
        error={error}
      />
      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Send verification code
      </Button>
    </form>
  );
}

function VerifyStep({ email, onReset }) {
  const [values, setValues] = useState({ code: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  const rules = {
    code: (value) => (/^\d{6}$/.test(value) ? null : 'Enter the 6-digit code from your email.'),
    newPassword: (value) =>
      isPasswordStrongEnough(value) ? null : 'Use at least 8 characters, including a number or symbol.',
    confirmPassword: (value, all) => {
      if (!isRequired(value)) return 'Re-enter your new password.';
      return value === all.newPassword ? null : 'Passwords do not match.';
    },
  };

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fieldErrors = runValidators(values, rules);
    setErrors(fieldErrors);
    setBanner('');
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await authApi.confirmPasswordReset(values.code);
      onReset();
    } catch (err) {
      setBanner(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="forgot-password__banner">
        <FormBanner tone="success">Code sent to {email}. It expires in 10 minutes.</FormBanner>
      </div>
      {banner && (
        <div className="forgot-password__banner">
          <FormBanner tone="error">{banner}</FormBanner>
        </div>
      )}
      <TextField
        label="Verification code"
        name="code"
        inputMode="numeric"
        placeholder="123456"
        required
        value={values.code}
        onChange={handleChange('code')}
        error={errors.code}
      />
      <PasswordField
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        required
        showStrength
        value={values.newPassword}
        onChange={handleChange('newPassword')}
        error={errors.newPassword}
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={values.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={errors.confirmPassword}
      />
      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Reset password
      </Button>
    </form>
  );
}

function DoneStep() {
  const navigate = useNavigate();
  return (
    <div className="forgot-password__done">
      <FormBanner tone="success">Your password has been reset.</FormBanner>
      <Button variant="primary" fullWidth onClick={() => navigate('/signin')}>
        Back to sign in
      </Button>
    </div>
  );
}

function ForgotPasswordPage() {
  const [step, setStep] = useState(STEP_REQUEST);
  const [email, setEmail] = useState('');

  const subtitleByStep = {
    [STEP_REQUEST]: 'Enter your personal email and we will send you a code to reset your password.',
    [STEP_VERIFY]: 'Enter the code we sent, then choose a new password.',
    [STEP_DONE]: null,
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle={subtitleByStep[step]}
      footer={
        step !== STEP_DONE && (
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
            setStep(STEP_VERIFY);
          }}
        />
      )}
      {step === STEP_VERIFY && <VerifyStep email={email} onReset={() => setStep(STEP_DONE)} />}
      {step === STEP_DONE && <DoneStep />}
    </AuthShell>
  );
}

export default ForgotPasswordPage;
