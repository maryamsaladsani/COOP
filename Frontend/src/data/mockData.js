// Static lookup lists shared by the HR and Training Coordinator dashboards.
// No backend yet, so these stand in for reference tables the real API would serve.

export const BRANCHES = ['Central', 'Southern', 'Eastern', 'Western'];

export const DEFAULT_BRANCH = 'Eastern';

export const DIVISIONS = [
  'Grid Operations',
  'Renewable Energy',
  'Refining & Processing',
  'HSE (Health, Safety & Environment)',
  'IT & Digital Services',
  'Corporate Strategy',
  'Finance',
  'Human Capital',
];

// Coordinators HR can assign a batch of students to. Real data will come from
// the staff directory once the sign-up flow feeds a real backend.
export const COORDINATORS = [
  { username: 'faisal.coord', name: 'Faisal Al-Dosari' },
  { username: 'huda.coord', name: 'Huda Al-Rashid' },
];

export const REFERRAL_SOURCES = [
  { value: 'employee_referral', label: 'Employee referral' },
  { value: 'manual_application', label: 'Manual application' },
  { value: 'university', label: 'From university' },
];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
