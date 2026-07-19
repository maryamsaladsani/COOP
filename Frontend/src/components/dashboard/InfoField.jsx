import './InfoField.css';

function InfoField({ label, value, placeholder = 'TBA' }) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div className="info-field">
      <span className="info-field__label">{label}</span>
      <span className={`info-field__value${isEmpty ? ' info-field__value--empty' : ''}`}>{isEmpty ? placeholder : value}</span>
    </div>
  );
}

export default InfoField;
