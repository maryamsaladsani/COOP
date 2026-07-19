import { useId } from 'react';

// type: 'document' (PDF/DOC/DOCX) | 'image' (photo formats)
function FileField({ label, hint, error, required = false, id, accept, fileName, onChange, ...inputProps }) {
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
      <div className="file-input-wrap">
        <label htmlFor={fieldId} className="file-input-button">
          Choose file
        </label>
        <span className="file-input-name">{fileName || 'No file selected'}</span>
        <input
          id={fieldId}
          type="file"
          accept={accept}
          className="file-input"
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          aria-required={required}
          {...inputProps}
        />
      </div>
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

export default FileField;
