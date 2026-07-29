import './MilestoneRoadmap.css';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5l4.3 4.3L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LEGEND = [
  { state: 'completed', label: 'Completed' },
  { state: 'in_progress', label: 'In Progress' },
  { state: 'not_started', label: 'Not Started' },
];

// tone comes from statusMeta (progress/complete/pending/neutral/blocked) —
// collapsed to the three roadmap states the reference timeline uses.
function stepState(tone) {
  if (tone === 'complete') return 'completed';
  if (tone === 'progress' || tone === 'pending') return 'in_progress';
  return 'not_started';
}

// Generic horizontal milestone timeline: takes the same {icon, name, tone,
// detail, date} shape getTrackSummaries() already returns, so any role that
// has a record + now can feed it without inventing new copy.
function MilestoneRoadmap({ steps }) {
  return (
    <div className="milestone-roadmap">
      <div className="milestone-roadmap__track">
        {steps.map((step, index) => {
          const state = stepState(step.tone);
          const prevState = index > 0 ? stepState(steps[index - 1].tone) : null;
          const connectorComplete = prevState === 'completed' && state === 'completed';
          return (
            <div className="milestone-roadmap__step" key={step.name}>
              <div className="milestone-roadmap__label">
                <div className="milestone-roadmap__title">{step.name}</div>
              <div className="milestone-roadmap__date">{step.date || ' '}</div>
              </div>
              <div className="milestone-roadmap__marker-row">
                {index > 0 && (
                  <span
                    className={`milestone-roadmap__connector milestone-roadmap__connector--${
                      connectorComplete ? 'green' : 'gray'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div className={`milestone-roadmap__marker milestone-roadmap__marker--${state}`}>
                  {state === 'completed' ? <CheckIcon /> : step.icon}
                </div>
              </div>
              {step.detail && <p className="milestone-roadmap__caption">{step.detail}</p>}
            </div>
          );
        })}
      </div>

      <div className="milestone-roadmap__legend">
        {LEGEND.map((item) => (
          <span className="milestone-roadmap__legend-item" key={item.state}>
            <span className={`milestone-roadmap__legend-dot milestone-roadmap__legend-dot--${item.state}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default MilestoneRoadmap;
