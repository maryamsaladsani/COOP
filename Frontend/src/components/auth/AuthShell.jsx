import Logo from '../Logo';
import './AuthShell.css';

function AuthShell({ title, subtitle, width = 'sm', children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__topbar">
        <Logo height={24} />
      </div>
      <main className="auth-shell__main">
        <div className={`auth-card auth-card--${width}`}>
          <div className="auth-card__accent" aria-hidden="true" />
          <div className="auth-card__body">
            <h1 className="auth-card__title">{title}</h1>
            {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
            {children}
          </div>
        </div>
        {footer && <div className="auth-shell__footer">{footer}</div>}
      </main>
    </div>
  );
}

export default AuthShell;
