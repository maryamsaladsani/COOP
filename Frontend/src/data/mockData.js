// Mock data for the Training Coordinator dashboard prototype.
// No backend yet — all state is held in React state at the page level.

export const STAGES = [
  'Registration Submitted',
  'Documents Verified',
  'Company Account Requested',
  'Company Account Active',
  'Division Assigned',
  'Desk & Device Requested',
  'Desk & Device Ready',
  'Training Started',
  'Training Completed',
];

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

// coordinator-facing status, distinct from pipeline stage
export const STUDENT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PENDING: 'pending',
  BLOCKED: 'blocked',
};

export const STATUS_META = {
  [STUDENT_STATUS.IN_PROGRESS]: { label: 'In Progress', tone: 'progress' },
  [STUDENT_STATUS.COMPLETED]: { label: 'Completed', tone: 'complete' },
  [STUDENT_STATUS.PENDING]: { label: 'Pending', tone: 'pending' },
  [STUDENT_STATUS.BLOCKED]: { label: 'Blocked', tone: 'blocked' },
};

export const REQUEST_STATUS = {
  NONE: 'none',
  SENT: 'sent',
  ACTIVE: 'active',
};

let idCounter = 1000;
function nextId() {
  idCounter += 1;
  return `TR-${idCounter}`;
}

function makeStudent({
  name,
  email,
  stageIndex,
  status,
  division = null,
  accountStatus = REQUEST_STATUS.NONE,
  deskStatus = REQUEST_STATUS.NONE,
  trainingStatus = 'not_started',
  documents,
}) {
  return {
    id: nextId(),
    name,
    email,
    phone: '+966 5' + Math.floor(10000000 + Math.random() * 89999999),
    stageIndex,
    status,
    division,
    accountStatus,
    deskStatus,
    trainingStatus,
    documents: documents || [
      { label: 'National ID', ok: true },
      { label: 'Offer Letter Signed', ok: true },
      { label: 'NDA', ok: stageIndex > 1 },
    ],
  };
}

export const INITIAL_STUDENTS = [
  makeStudent({
    name: 'Lama Al-Harbi',
    email: 'lama.alharbi@example.com',
    stageIndex: 0,
    status: STUDENT_STATUS.PENDING,
    documents: [
      { label: 'National ID', ok: true },
      { label: 'Offer Letter Signed', ok: false },
      { label: 'NDA', ok: false },
    ],
  }),
  makeStudent({
    name: 'Yousef Al-Qahtani',
    email: 'yousef.alqahtani@example.com',
    stageIndex: 1,
    status: STUDENT_STATUS.IN_PROGRESS,
  }),
  makeStudent({
    name: 'Noura Al-Shammari',
    email: 'noura.alshammari@example.com',
    stageIndex: 2,
    status: STUDENT_STATUS.PENDING,
    accountStatus: REQUEST_STATUS.SENT,
  }),
  makeStudent({
    name: 'Faisal Al-Dosari',
    email: 'faisal.aldosari@example.com',
    stageIndex: 3,
    status: STUDENT_STATUS.IN_PROGRESS,
    accountStatus: REQUEST_STATUS.ACTIVE,
  }),
  makeStudent({
    name: 'Sara Al-Otaibi',
    email: 'sara.alotaibi@example.com',
    stageIndex: 4,
    status: STUDENT_STATUS.IN_PROGRESS,
    division: 'Grid Operations',
    accountStatus: REQUEST_STATUS.ACTIVE,
  }),
  makeStudent({
    name: 'Abdullah Al-Ghamdi',
    email: 'abdullah.alghamdi@example.com',
    stageIndex: 5,
    status: STUDENT_STATUS.PENDING,
    division: 'Renewable Energy',
    accountStatus: REQUEST_STATUS.ACTIVE,
    deskStatus: REQUEST_STATUS.SENT,
  }),
  makeStudent({
    name: 'Rima Al-Zahrani',
    email: 'rima.alzahrani@example.com',
    stageIndex: 6,
    status: STUDENT_STATUS.IN_PROGRESS,
    division: 'IT & Digital Services',
    accountStatus: REQUEST_STATUS.ACTIVE,
    deskStatus: REQUEST_STATUS.ACTIVE,
  }),
  makeStudent({
    name: 'Khalid Al-Mutairi',
    email: 'khalid.almutairi@example.com',
    stageIndex: 7,
    status: STUDENT_STATUS.IN_PROGRESS,
    division: 'Corporate Strategy',
    accountStatus: REQUEST_STATUS.ACTIVE,
    deskStatus: REQUEST_STATUS.ACTIVE,
    trainingStatus: 'in_progress',
  }),
  makeStudent({
    name: 'Haya Al-Qahtani',
    email: 'haya.alqahtani2@example.com',
    stageIndex: 8,
    status: STUDENT_STATUS.COMPLETED,
    division: 'Finance',
    accountStatus: REQUEST_STATUS.ACTIVE,
    deskStatus: REQUEST_STATUS.ACTIVE,
    trainingStatus: 'completed',
  }),
  makeStudent({
    name: 'Mishal Al-Anazi',
    email: 'mishal.alanazi@example.com',
    stageIndex: 2,
    status: STUDENT_STATUS.BLOCKED,
    documents: [
      { label: 'National ID', ok: true },
      { label: 'Offer Letter Signed', ok: true },
      { label: 'NDA', ok: false },
    ],
  }),
  makeStudent({
    name: 'Deema Al-Faraj',
    email: 'deema.alfaraj@example.com',
    stageIndex: 4,
    status: STUDENT_STATUS.PENDING,
    division: 'HSE (Health, Safety & Environment)',
    accountStatus: REQUEST_STATUS.ACTIVE,
  }),
  makeStudent({
    name: 'Omar Al-Subaie',
    email: 'omar.alsubaie@example.com',
    stageIndex: 6,
    status: STUDENT_STATUS.IN_PROGRESS,
    division: 'Refining & Processing',
    accountStatus: REQUEST_STATUS.ACTIVE,
    deskStatus: REQUEST_STATUS.ACTIVE,
  }),
  makeStudent({
    name: 'Jood Al-Rashidi',
    email: 'jood.alrashidi@example.com',
    stageIndex: 1,
    status: STUDENT_STATUS.IN_PROGRESS,
  }),
  makeStudent({
    name: 'Talal Al-Harthi',
    email: 'talal.alharthi@example.com',
    stageIndex: 8,
    status: STUDENT_STATUS.COMPLETED,
    division: 'Human Capital',
    accountStatus: REQUEST_STATUS.ACTIVE,
    deskStatus: REQUEST_STATUS.ACTIVE,
    trainingStatus: 'completed',
  }),
];

export const CURRENT_COORDINATOR = {
  name: 'Maryam Al-Dossary',
  role: 'Training Coordinator',
  initials: 'MD',
};
