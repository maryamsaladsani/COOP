import { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, loading = false, className = '', children, ...rest },
  ref
) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
    loading ? 'btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={classes} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__label">{children}</span>
    </button>
  );
});

export default Button;
