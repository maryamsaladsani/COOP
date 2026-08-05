import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSvgText, namespaceSvgIds } from '../utils/inlineSvg';
import './Logo.css';

const LOGO_SRC = '/assets/coopLogo.svg';

function Logo({ height = 28, withWordmark = true, className = '', to = '/' }) {
  const [markup, setMarkup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSvgText(LOGO_SRC)
      .then((svgText) => {
        if (!cancelled) setMarkup(namespaceSvgIds(svgText));
      })
      .catch(() => {
        // Inlining is a Safari-sharpness enhancement, not a hard requirement — the <img>
        // fallback below covers fetch failures (offline, blocked, etc).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link to={to} className={`logo ${className}`} aria-label="COOP home">
      {markup ? (
        // aria-hidden: the Link above already provides the accessible name ("COOP home"),
        // so the inlined mark is decorative from an assistive-tech point of view — same
        // effective accessibility as the <img alt="COOP"> it replaces.
        <span className="logo__mark" style={{ height }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />
      ) : (
        <img src={LOGO_SRC} alt={withWordmark ? 'COOP' : ''} className="logo__mark" style={{ height }} />
      )}
    </Link>
  );
}

export default Logo;
