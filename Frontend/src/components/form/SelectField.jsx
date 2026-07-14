import { useId } from 'react';

function SelectField({ label, hint, error, required = false, id, options, placeholder, ...selectProps }) {
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
      <select
        id={fieldId}
        className="select-input"
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-required={required}
        {...selectProps}
      >
        <option value="" disabled>
          {placeholder || 'Select...'}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

export default SelectField;
