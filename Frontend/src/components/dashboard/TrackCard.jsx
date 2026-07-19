import StatusPill from './StatusPill';
import './TrackCard.css';

// One onboarding track: independent status of its own, per REQ-04 — these
// are laid out as a rail of equals, not steps in one linear progress bar.
function TrackCard({ icon, label, tone, statusLabel, detail }) {
  return (
    <div className="track-card">
      <div className="track-card__top">
        <span className="track-card__icon" aria-hidden="true">
          {icon}
        </span>
        <StatusPill tone={tone} label={statusLabel} />
      </div>
      <h3 className="track-card__label">{label}</h3>
      {detail && <p className="track-card__detail">{detail}</p>}
    </div>
  );
}

export default TrackCard;
