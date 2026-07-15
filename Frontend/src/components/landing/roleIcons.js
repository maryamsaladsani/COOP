const ROLE_ITEMS = [
  {
    title: 'Trainee',
    blurb: 'Tracks their own onboarding status and submits documents.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'HR',
    blurb: 'Issues company accounts, contracts, and ID cards.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 9.5h16M9 6v-.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Training Coordinator',
    blurb: 'Assigns divisions and manages the training schedule.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="4.5" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M9 4v-.5A1 1 0 0110 2.5h4a1 1 0 011 1V4M8.5 12l2.2 2.2L15.5 9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default ROLE_ITEMS;
