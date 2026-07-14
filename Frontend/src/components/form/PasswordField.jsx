import { useId, useState } from 'react';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const EyeIcon = ({ crossed }) => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M2 10s2.8-5.5 8-5.5S18 10 18 10s-2.8 5.5-8 5.5S2 10 2 10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    {crossed && <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
  </svg>
);

function PasswordField({ label, hint, error, required = false, id, showStrength = false, value, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={fieldId}>
        {label}
        {required && (
          <span className="field__label-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="password-input-wrap">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className="text-input"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-required={required}
          {...inputProps}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>
      {showStrength && <PasswordStrengthMeter value={value} />}
      {hint && !error && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default PasswordField;
