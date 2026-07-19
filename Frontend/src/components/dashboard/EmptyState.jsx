import './EmptyState.css';

function EmptyState({ title, body, icon }) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state__icon">{icon}</span>}
      <p className="empty-state__title">{title}</p>
      {body && <p className="empty-state__body">{body}</p>}
    </div>
  );
}

export default EmptyState;
