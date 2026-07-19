import { Link } from 'react-router-dom';
import './Logo.css';

function Logo({ height = 28, withWordmark = true, className = '', to = '/' }) {
  return (
    <Link to={to} className={`logo ${className}`} aria-label="COOP home">
      <img
        src="/assets/coopLogo.svg"
        alt={withWordmark ? 'COOP' : ''}
        className="logo__mark"
        style={{ height }}
      />
    </Link>
  );
}

export default Logo;
