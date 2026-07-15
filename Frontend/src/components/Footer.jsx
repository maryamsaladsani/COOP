import { Link } from 'react-router-dom';
import Logo from './Logo';
import './Footer.css';

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Sign In', to: '/signin' },
  { label: 'Privacy Notice', to: '/privacy-notice' },
  { label: 'Help & Support', to: '/help' },
];

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="site-footer__brand">
          <Logo height={100} />
        </div>

        <div className="site-footer__nav">
          <h3 className="site-footer__nav-title">Quick Links</h3>
          <ul className="site-footer__nav-list">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="site-footer__bottom-inner">
          <p className="site-footer__copyright">COOP©2026. Confidential and Internal Use Only.</p>
          <p className="site-footer__credit">Developed by Lujain Almuhawish and Maryam Aladsani</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
