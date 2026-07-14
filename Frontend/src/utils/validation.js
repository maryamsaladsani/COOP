const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRequired(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value).trim());
}

/**
 * 0 = empty, 1 = weak, 2 = fair, 3 = strong, 4 = very strong.
 * Score is used both for the visual meter (4 segments) and the min-strength gate.
 */
export function getPasswordScore(value) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

export function getPasswordStrengthLabel(score) {
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  return 'strong';
}

export function isPasswordStrongEnough(value) {
  return value.length >= 8 && getPasswordScore(value) >= 2;
}

export function runValidators(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, validate]) => {
    const message = validate(values[field], values);
    if (message) errors[field] = message;
  });
  return errors;
}
