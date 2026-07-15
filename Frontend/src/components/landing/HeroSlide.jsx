import { Link } from 'react-router-dom';
import Button from '../Button';
import './HeroSlide.css';

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h9.5M8.5 3.5L13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function HeroSlide({ headingLevel = 'h2', headline, subhead, body, cta, visual }) {
  const Heading = headingLevel;

  return (
    <div className="hero-slide">
      <div className="hero-slide__visual">{visual}</div>
      <div className="hero-slide__text">
        <Heading className="hero-slide__headline">{headline}</Heading>
        {subhead && <p className="hero-slide__subhead">{subhead}</p>}
        {body && <p className="hero-slide__body">{body}</p>}
        {cta && (
          <Link to={cta.to} className="hero-slide__cta">
            <Button variant="primary" size="sm">
              {cta.label}
              <ArrowRightIcon />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default HeroSlide;
