import './IntroVisual.css';

function IntroVisual() {
  return (
    <svg
      className="intro-visual"
      viewBox="0 0 420 380"
      fill="none"
      role="img"
      aria-label="Three connected roles: trainee, HR, and training coordinator"
    >
      <path className="intro-visual__link" d="M150 150 C 200 120, 240 100, 282 112" strokeLinecap="round" />
      <path className="intro-visual__link" d="M150 150 C 175 195, 200 230, 232 262" strokeLinecap="round" />
      <path className="intro-visual__link" d="M282 112 C 265 175, 250 220, 232 262" strokeLinecap="round" />

      <circle className="intro-visual__hub" cx="221" cy="175" r="4" />

      <g className="intro-visual__node">
        <circle cx="150" cy="150" r="56" />
        <path
          d="M150 138a12 12 0 100 24 12 12 0 000-24z M132 190c0-13 8-22 18-22s18 9 18 22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <g className="intro-visual__node intro-visual__node--sm">
        <circle cx="282" cy="112" r="42" />
        <rect x="266" y="102" width="32" height="24" rx="3" />
        <path d="M266 110h32" />
      </g>

      <g className="intro-visual__node intro-visual__node--md">
        <circle cx="232" cy="262" r="48" />
        <rect x="215" y="245" width="28" height="32" rx="3" />
        <path d="M222 251l6 6 12-12" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default IntroVisual;
