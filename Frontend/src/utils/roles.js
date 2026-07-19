export const ROLE_HOME = {
  student: '/app/trainee',
  hr: '/app/hr',
  coordinator: '/app/coordinator',
};

export const ROLE_LABELS = {
  student: 'Trainee',
  hr: 'HR',
  coordinator: 'Training Coordinator',
};

export function getFirstName(fullName) {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0];
}
