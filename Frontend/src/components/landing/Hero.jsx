import { Link } from 'react-router-dom';
import Button from '../Button';
import StageFlowPreview from './StageFlowPreview';
import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__copy">
          <h1 className="hero__headline">Onboarding, finally coordinated.</h1>
          <p className="hero__subtext">
            COOP connects trainees, HR, and training coordinators in one place, replacing the paper trail
            with real-time status.
          </p>
          <div className="hero__actions">
            <Link to="/signin">
              <Button variant="primary" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
        <div className="hero__visual">
          <StageFlowPreview />
        </div>
      </div>
    </section>
  );
}

export default Hero;
