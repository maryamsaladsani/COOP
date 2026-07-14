import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import TextField from '../components/form/TextField';
import PasswordField from '../components/form/PasswordField';
import Button from '../components/Button';
import FormBanner from '../components/form/FormBanner';
import { useAuth } from '../context/AuthContext';
import { isRequired, runValidators } from '../utils/validation';
import './SignInPage.css';

const RULES = {
  username: (value) => (isRequired(value) ? null : 'Enter your username.'),
  password: (value) => (isRequired(value) ? null : 'Enter your password.'),
};

function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fieldErrors = runValidators(values, RULES);
    setErrors(fieldErrors);
    setSubmitError('');
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    try {
      await login(values.username, values.password);
      navigate('/app');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="One account for trainees, HR, and training coordinators."
      footer={
        <span>
          Signing up as HR or a Training Coordinator? <Link to="/signup">Create a staff account</Link>
        </span>
      }
    >
      {submitError && (
        <div className="sign-in__banner">
          <FormBanner tone="error">{submitError}</FormBanner>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          required
          value={values.username}
          onChange={handleChange('username')}
          error={errors.username}
        />
        <div className="sign-in__password-row">
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={handleChange('password')}
            error={errors.password}
          />
          <Link to="/forgot-password" className="sign-in__forgot">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default SignInPage;
