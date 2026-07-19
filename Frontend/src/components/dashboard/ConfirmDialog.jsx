import { useEffect, useRef } from 'react';
import Button from '../Button';
import FormBanner from '../form/FormBanner';
import './ConfirmDialog.css';

// Native <dialog> for every confirm-before-you-act moment (accept, reject,
// withdraw, batch-assign) — keyboard/focus-trap/Escape come from the platform
// for free instead of being hand-rolled.
function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  error = '',
  size = 'sm',
  onConfirm,
  onClose,
  children,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose?.();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`confirm-dialog confirm-dialog--${size}`}
      onClose={onClose}
      onClick={handleBackdropClick}
      onCancel={onClose}
    >
      <div className="confirm-dialog__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm-dialog__title">{title}</h2>
        {body && <p className="confirm-dialog__body">{body}</p>}
        {children}
        {error && (
          <div className="confirm-dialog__error">
            <FormBanner tone="error">{error}</FormBanner>
          </div>
        )}
        <div className="confirm-dialog__actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
