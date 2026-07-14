import Logo from './Logo';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Logo height={20} />
        <p className="site-footer__meta">Saudi Energy internal platform. Not for external distribution.</p>
      </div>
    </footer>
  );
}

export default Footer;
