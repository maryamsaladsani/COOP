import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell';
import TextField from '../components/form/TextField';
import PasswordField from '../components/form/PasswordField';
import SelectField from '../components/form/SelectField';
import Button from '../components/Button';
import FormBanner from '../components/form/FormBanner';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../data/mockAuth';
import { DIVISIONS } from '../data/mockData';
import { isRequired, isValidEmail, isPasswordStrongEnough, runValidators } from '../utils/validation';
import './SignUpPage.css';

const ROLE_OPTIONS = [
  { value: 'hr', label: 'HR' },
  { value: 'coordinator', label: 'Training Coordinator' },
];

const DIVISION_OPTIONS = DIVISIONS.map((division) => ({ value: division, label: division }));

const INITIAL_VALUES = {
  role: '',
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  employeeId: '',
  department: '',
  division: '',
  companyRole: '',
};

const RULES = {
  role: (value) => (isRequired(value) ? null : 'Select your role.'),
  username: (value) => (isRequired(value) ? null : 'Choose a username.'),
  name: (value) => (isRequired(value) ? null : 'Enter your full name.'),
  email: (value) => {
    if (!isRequired(value)) return 'Enter your Saudi Energy email.';
    if (!isValidEmail(value)) return 'Enter a valid email address.';
    return null;
  },
  password: (value) =>
    isPasswordStrongEnough(value) ? null : 'Use at least 8 characters, including a number or symbol.',
  confirmPassword: (value, all) => {
    if (!isRequired(value)) return 'Re-enter your password.';
    return value === all.password ? null : 'Passwords do not match.';
  },
  employeeId: (value) => (isRequired(value) ? null : 'Enter your Saudi Energy employee ID.'),
  department: (value) => (isRequired(value) ? null : 'Enter your department.'),
  division: (value) => (isRequired(value) ? null : 'Select your division.'),
  companyRole: (value) => (isRequired(value) ? null : 'Enter your company role.'),
};

function SignUpPage() {
  const { login: setSession } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(INITIAL_VALUES);
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
      await authApi.signUp(values);
      await setSession(values.username, values.password);
      navigate('/app');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create a staff account"
      subtitle="For HR and Training Coordinator staff. Trainees receive their account from HR, they don't sign up here."
      width="lg"
      footer={
        <span>
          Already have an account? <Link to="/signin">Sign in</Link>
        </span>
      }
    >
      {submitError && (
        <div className="sign-up__banner">
          <FormBanner tone="error">{submitError}</FormBanner>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="sign-up__grid">
          <SelectField
            label="Role"
            name="role"
            options={ROLE_OPTIONS}
            placeholder="Select your role"
            required
            value={values.role}
            onChange={handleChange('role')}
            error={errors.role}
          />
          <TextField
            label="Username"
            name="username"
            autoComplete="username"
            required
            value={values.username}
            onChange={handleChange('username')}
            error={errors.username}
          />
          <TextField
            label="Full name"
            name="name"
            autoComplete="name"
            required
            value={values.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
          <TextField
            label="Company email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@saudienergy.com"
            required
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <TextField
            label="Saudi Energy employee ID"
            name="employeeId"
            placeholder="SE-00000"
            required
            value={values.employeeId}
            onChange={handleChange('employeeId')}
            error={errors.employeeId}
          />
          <TextField
            label="Department"
            name="department"
            required
            value={values.department}
            onChange={handleChange('department')}
            error={errors.department}
          />
          <SelectField
            label="Division"
            name="division"
            options={DIVISION_OPTIONS}
            placeholder="Select your division"
            required
            value={values.division}
            onChange={handleChange('division')}
            error={errors.division}
          />
          <TextField
            label="Company role"
            name="companyRole"
            placeholder="e.g. Senior HR Specialist"
            required
            value={values.companyRole}
            onChange={handleChange('companyRole')}
            error={errors.companyRole}
          />
        </div>

        <div className="sign-up__grid">
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            required
            showStrength
            value={values.password}
            onChange={handleChange('password')}
            error={errors.password}
          />
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
          />
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export default SignUpPage;
