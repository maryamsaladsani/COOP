import RoleFlow from './RoleFlow';
import './WhatIsCoop.css';

function WhatIsCoop() {
  return (
    <section className="what-is-coop">
      <div className="what-is-coop__inner">
        <div className="what-is-coop__intro">
          <h2 className="what-is-coop__title">What is COOP?</h2>
          <p className="what-is-coop__body">
            COOP is Saudi Energy's onboarding platform. It replaces the paper trail that used to carry a
            new hire from offer letter to first day, giving trainees, HR, and training coordinators one
            live view of where every onboarding stands.
          </p>
        </div>
        <RoleFlow />
      </div>
    </section>
  );
}

export default WhatIsCoop;
