import './WhyChecklist.css';

const ITEMS = [
  'Real-time onboarding status for every trainee, visible to all three roles at once.',
  'Contract signing and ID card issuance requested and tracked in one flow.',
  'One shared record, so coordination happens automatically instead of manually.',
];

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.4l2.7 2.7 6-6.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function WhyChecklist() {
  return (
    <ul className="why-checklist">
      {ITEMS.map((item) => (
        <li className="why-checklist__item" key={item}>
          <span className="why-checklist__mark">
            <CheckIcon />
          </span>
          <span className="why-checklist__text">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default WhyChecklist;
