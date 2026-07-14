import { useId } from 'react';

function TextField({ label, hint, error, required = false, id, ...inputProps }) {
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
      <input
        id={fieldId}
        className="text-input"
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-required={required}
        {...inputProps}
      />
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

export default TextField;
