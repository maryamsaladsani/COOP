import { getPasswordScore, getPasswordStrengthLabel } from '../../utils/validation';

function PasswordStrengthMeter({ value }) {
  const score = getPasswordScore(value);
  if (!value) return null;

  const label = getPasswordStrengthLabel(score);
  const segments = [1, 2, 3, 4];

  return (
    <div className="strength-meter" aria-live="polite">
      <div className="strength-meter__track">
        {segments.map((segment) => (
          <span
            key={segment}
            className={
              segment <= score ? `strength-meter__segment strength-meter__segment--filled-${label}` : 'strength-meter__segment'
            }
          />
        ))}
      </div>
      <span className={`strength-meter__label strength-meter__label--${label}`}>
        {label === 'weak' && 'Weak, add length and a symbol'}
        {label === 'fair' && 'Fair, add a number or symbol'}
        {label === 'strong' && 'Strong password'}
      </span>
    </div>
  );
}

export default PasswordStrengthMeter;
