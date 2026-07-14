import './WhyCoop.css';

const COMPARISONS = [
  {
    before: 'Status checked over phone calls and email chains between offices.',
    after: 'Real-time onboarding status for every trainee, visible to all three roles at once.',
  },
  {
    before: 'Contracts and ID card requests routed by hand on printed forms.',
    after: 'Contract signing and ID card issuance requested and tracked in one flow.',
  },
  {
    before: 'HR and coordinators cross-checking separate spreadsheets to stay in sync.',
    after: 'One shared record, so coordination happens automatically instead of manually.',
  },
];

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 8.4l2.7 2.7 6-6.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function WhyCoop() {
  return (
    <section className="why-coop">
      <div className="why-coop__inner">
        <div className="why-coop__intro">
          <h2 className="why-coop__title">Why COOP?</h2>
          <p className="why-coop__body">Every step COOP replaces was a manual, paper-based one.</p>
        </div>
        <div className="why-coop__rows">
          {COMPARISONS.map((row) => (
            <div className="why-coop__row" key={row.after}>
              <div className="why-coop__cell why-coop__cell--before">
                <span className="why-coop__tag">Before</span>
                <p>{row.before}</p>
              </div>
              <div className="why-coop__divider" aria-hidden="true" />
              <div className="why-coop__cell why-coop__cell--after">
                <span className="why-coop__tag why-coop__tag--after">
                  <CheckIcon />
                  With COOP
                </span>
                <p>{row.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyCoop;
