import './StatusPill.css';

// tone: 'progress' | 'complete' | 'pending' | 'blocked' | 'neutral'
function StatusPill({ tone = 'neutral', label }) {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>;
}

export default StatusPill;
