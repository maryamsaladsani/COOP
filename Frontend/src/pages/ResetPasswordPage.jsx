import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/form/PasswordField';
import Button from '../components/Button';
import FormBanner from '../components/form/FormBanner';
import * as authApi from '../data/mockAuth';
import { isRequired, isPasswordStrongEnough, runValidators } from '../utils/validation';
import './ForgotPasswordPage.css';

function ResetForm({ token, onReset }) {
  const [values, setValues] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  const rules = {
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
      await authApi.confirmPasswordReset(token, values.newPassword);
      onReset();
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

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthShell title="Reset your password" subtitle={null}>
        <FormBanner tone="error">
          This reset link is missing its token. Request a new one from the forgot password page.
        </FormBanner>
        <p>
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={done ? null : 'Choose a new password for your account.'}
      footer={
        !done && (
          <span>
            Remembered it? <Link to="/signin">Sign in</Link>
          </span>
        )
      }
    >
      {done ? <DoneStep /> : <ResetForm token={token} onReset={() => setDone(true)} />}
    </AuthShell>
  );
}

export default ResetPasswordPage;
