import { STAGES } from '../../data/mockData';
import './StageFlowPreview.css';

const ACTIVE_INDEX = 5;

function StageFlowPreview() {
  return (
    <div className="stage-flow" role="img" aria-label={`Onboarding pipeline, currently at stage: ${STAGES[ACTIVE_INDEX]}`}>
      <div className="stage-flow__head">
        <span className="stage-flow__eyebrow">Live onboarding status</span>
        <span className="stage-flow__trainee">Sara Al-Otaibi · Grid Operations</span>
      </div>
      <div className="stage-flow__track-wrap">
        <div className="stage-flow__track">
          {STAGES.map((stage, index) => {
            const state = index < ACTIVE_INDEX ? 'done' : index === ACTIVE_INDEX ? 'current' : 'upcoming';
            const lineBefore = index <= ACTIVE_INDEX ? 'filled' : 'muted';
            const lineAfter = index < ACTIVE_INDEX ? 'filled' : 'muted';
            return (
              <div
                className={`stage-flow__step stage-flow__step--${state} stage-flow__step--before-${lineBefore} stage-flow__step--after-${lineAfter}`}
                key={stage}
              >
                <span className="stage-flow__dot" />
                <span className="stage-flow__label">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StageFlowPreview;
