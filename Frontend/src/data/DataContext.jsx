import { createContext, useContext, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as authApi from './mockAuth';
import { SEED_RECORDS, makeBaseTracks, makeBaseTrainingDetails } from './seedRecords';

// Mock backend for everything that happens after sign-in: applications,
// trainee tracks, and the HR/Coordinator actions that mutate them. Mirrors
// mockAuth.js's shape (async, artificially delayed) so it reads like a real
// API the frontend is calling, not a local reducer.

const NETWORK_DELAY_MS = 500;
const DataContext = createContext(null);

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

let idCounter = 1010;
function nextId() {
  idCounter += 1;
  return `APP-${idCounter}`;
}

const COMBINING_MARKS_RE = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS_RE, '')
    .replace(/[^a-z0-9]+/g, '');
}

function generateTempPassword() {
  return `Coop-${Math.random().toString(36).slice(2, 8)}`;
}

export function DataProvider({ children }) {
  const [records, setRecords] = useState(SEED_RECORDS);

  // ---- Public --------------------------------------------------------

  async function submitApplication(payload) {
    await delay();
    const record = {
      id: nextId(),
      ...payload,
      submittedAt: new Date().toISOString(),
      applicationStatus: 'pending',
      decisionAt: null,
      username: null,
      trainingDetails: null,
      tracks: null,
    };
    setRecords((prev) => [record, ...prev]);
    return record;
  }

  // ---- HR --------------------------------------------------------------
  // HR has unscoped access by design (their role covers the whole database).

  async function acceptApplication(id) {
    const record = records.find((r) => r.id === id);
    if (!record) throw new Error('Application not found.');
    if (record.applicationStatus !== 'pending') throw new Error('This application was already decided.');

    const base = slugify(`${record.firstName}.${record.lastName}`) || slugify(record.firstName);
    let username = base;
    let suffix = 1;
    while (authApi.usernameExists(username)) {
      username = `${base}${suffix}`;
      suffix += 1;
    }
    const tempPassword = generateTempPassword();
    authApi.registerTrainee({ username, password: tempPassword, name: `${record.firstName} ${record.lastName}` });

    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              applicationStatus: 'accepted',
              decisionAt: new Date().toISOString(),
              username,
              trainingDetails: makeBaseTrainingDetails(),
              tracks: makeBaseTracks(),
            }
          : r
      )
    );
    return { username, tempPassword };
  }

  async function rejectApplication(id) {
    const record = records.find((r) => r.id === id);
    if (!record) throw new Error('Application not found.');
    if (record.applicationStatus !== 'pending') throw new Error('This application was already decided.');
    await delay();
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, applicationStatus: 'rejected', decisionAt: new Date().toISOString() } : r))
    );
  }

  async function withdrawStudent(id, reason) {
    const record = records.find((r) => r.id === id);
    if (!record) throw new Error('Student not found.');
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, applicationStatus: 'withdrawn', decisionAt: new Date().toISOString(), withdrawalReason: reason || null }
          : r
      )
    );
  }

  async function requestCard(id, cardData) {
    const record = records.find((r) => r.id === id);
    if (!record) throw new Error('Student not found.');
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              cardRequest: cardData,
              tracks: { ...r.tracks, card: { status: 'under_issuing', underIssuingAt: new Date().toISOString() } },
            }
          : r
      )
    );
  }

  async function assignToCoordinator(ids, payload) {
    if (!ids || ids.length === 0) throw new Error('Select at least one student.');
    await delay();
    const assignedAt = new Date().toISOString();
    setRecords((prev) =>
      prev.map((r) => {
        if (!ids.includes(r.id) || r.applicationStatus !== 'accepted') return r;
        return {
          ...r,
          trainingDetails: {
            ...r.trainingDetails,
            branch: payload.branch || r.trainingDetails?.branch || 'Eastern',
            businessLine: payload.businessLine || r.trainingDetails?.businessLine || null,
            buildingNumber: payload.buildingNumber || r.trainingDetails?.buildingNumber || null,
            floorNumber: payload.floorNumber || r.trainingDetails?.floorNumber || null,
          },
          tracks: {
            ...r.tracks,
            departmentAssignment: {
              status: 'assigned',
              department: payload.department,
              coordinatorUsername: payload.coordinatorUsername,
              coordinatorName: payload.coordinatorName,
              assignedAt,
            },
          },
        };
      })
    );
  }

  async function issueCertificate(id) {
    const record = records.find((r) => r.id === id);
    if (!record) throw new Error('Student not found.');
    if (!record.tracks?.training?.started || !record.tracks?.training?.completed) {
      throw new Error('Training start and completion must be confirmed by the coordinator first.');
    }
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, tracks: { ...r.tracks, certificate: { status: 'issued', issuedAt: new Date().toISOString() } } }
          : r
      )
    );
  }

  // ---- Training Coordinator ---------------------------------------------
  // Every function below re-checks ownership against the trainee's assigned
  // coordinator before mutating, so scoping is enforced here — not only by
  // which records the UI happens to display.

  function assertOwnedByCoordinator(id, coordinatorUsername) {
    const record = records.find((r) => r.id === id);
    if (!record) throw new Error('Student not found.');
    if (record.tracks?.departmentAssignment?.coordinatorUsername !== coordinatorUsername) {
      throw new Error('This trainee is not assigned to you.');
    }
    return record;
  }

  async function requestCompanyAccount(id, coordinatorUsername) {
    assertOwnedByCoordinator(id, coordinatorUsername);
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, tracks: { ...r.tracks, accountCredentials: { status: 'under_issuing', underIssuingAt: new Date().toISOString() } } }
          : r
      )
    );
  }

  async function requestDeskDevice(id, coordinatorUsername) {
    assertOwnedByCoordinator(id, coordinatorUsername);
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, tracks: { ...r.tracks, deskDevice: { status: 'requested', requestedAt: new Date().toISOString(), readyAt: null } } }
          : r
      )
    );
  }

  async function markDeskReady(id, coordinatorUsername) {
    assertOwnedByCoordinator(id, coordinatorUsername);
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, tracks: { ...r.tracks, deskDevice: { ...r.tracks.deskDevice, status: 'ready', readyAt: new Date().toISOString() } } }
          : r
      )
    );
  }

  async function assignDivision(id, payload, coordinatorUsername) {
    assertOwnedByCoordinator(id, coordinatorUsername);
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              trainingDetails: {
                ...r.trainingDetails,
                buildingNumber: payload.buildingNumber || r.trainingDetails?.buildingNumber || null,
                floorNumber: payload.floorNumber || r.trainingDetails?.floorNumber || null,
              },
              tracks: {
                ...r.tracks,
                divisionAssignment: {
                  status: 'assigned',
                  division: payload.division,
                  managerName: payload.managerName,
                  altSupervisorName: payload.altSupervisorName || null,
                  assignedAt: new Date().toISOString(),
                },
              },
            }
          : r
      )
    );
  }

  async function confirmTrainingStarted(id, coordinatorUsername, date) {
    assertOwnedByCoordinator(id, coordinatorUsername);
    await delay();
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const startedAt = date ? new Date(date).toISOString() : new Date().toISOString();
        return {
          ...r,
          tracks: {
            ...r.tracks,
            training: { ...r.tracks.training, started: true, startedAt, notStarted: false, notStartedAt: null },
            contract: { ...r.tracks.contract, availableAt: r.tracks.contract.availableAt || startedAt },
          },
        };
      })
    );
  }

  async function confirmTrainingNotStarted(id, coordinatorUsername) {
    assertOwnedByCoordinator(id, coordinatorUsername);
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, tracks: { ...r.tracks, training: { ...r.tracks.training, notStarted: true, notStartedAt: new Date().toISOString() } } }
          : r
      )
    );
  }

  async function confirmTrainingCompleted(id, coordinatorUsername, date) {
    const record = assertOwnedByCoordinator(id, coordinatorUsername);
    if (!record.tracks?.training?.started) throw new Error('Confirm the trainee started before confirming completion.');
    await delay();
    const completedAt = date ? new Date(date).toISOString() : new Date().toISOString();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, tracks: { ...r.tracks, training: { ...r.tracks.training, completed: true, completedAt } } } : r
      )
    );
  }

  // ---- Trainee -----------------------------------------------------------

  async function signContract(id, { signedName }) {
    const record = records.find((r) => r.id === id);
    if (!record) throw new Error('Trainee record not found.');
    const availableAt = record.tracks?.contract?.availableAt;
    if (!availableAt || new Date(availableAt).getTime() > Date.now()) {
      throw new Error('Your contract is not available to sign yet.');
    }
    await delay();
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, tracks: { ...r.tracks, contract: { ...r.tracks.contract, signed: true, signedAt: new Date().toISOString(), signedName } } }
          : r
      )
    );
  }

  const value = useMemo(
    () => ({
      records,
      submitApplication,
      acceptApplication,
      rejectApplication,
      withdrawStudent,
      requestCard,
      assignToCoordinator,
      issueCertificate,
      requestCompanyAccount,
      requestDeskDevice,
      markDeskReady,
      assignDivision,
      confirmTrainingStarted,
      confirmTrainingNotStarted,
      confirmTrainingCompleted,
      signContract,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useDataStore() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataStore must be used within a DataProvider');
  return ctx;
}

// ---- Role-scoped hooks. Pages should only ever import the hook for their
// own role — Coordinator pages have no code path that reaches `records`
// unfiltered. -----------------------------------------------------------

export function usePublicApplication() {
  const { submitApplication } = useDataStore();
  return { submitApplication };
}

export function useHRData() {
  const store = useDataStore();
  return {
    students: store.records,
    acceptApplication: store.acceptApplication,
    rejectApplication: store.rejectApplication,
    withdrawStudent: store.withdrawStudent,
    requestCard: store.requestCard,
    assignToCoordinator: store.assignToCoordinator,
    issueCertificate: store.issueCertificate,
  };
}

export function useCoordinatorData() {
  const store = useDataStore();
  const { user } = useAuth();
  const username = user?.username;
  const students = useMemo(
    () => store.records.filter((r) => r.tracks?.departmentAssignment?.coordinatorUsername === username),
    [store.records, username]
  );

  return {
    students,
    getStudent: (id) => students.find((s) => s.id === id) || null,
    requestCompanyAccount: (id) => store.requestCompanyAccount(id, username),
    requestDeskDevice: (id) => store.requestDeskDevice(id, username),
    markDeskReady: (id) => store.markDeskReady(id, username),
    assignDivision: (id, payload) => store.assignDivision(id, payload, username),
    confirmTrainingStarted: (id, date) => store.confirmTrainingStarted(id, username, date),
    confirmTrainingNotStarted: (id) => store.confirmTrainingNotStarted(id, username),
    confirmTrainingCompleted: (id, date) => store.confirmTrainingCompleted(id, username, date),
  };
}

export function useTraineeData() {
  const store = useDataStore();
  const { user } = useAuth();
  const record = useMemo(() => store.records.find((r) => r.username === user?.username) || null, [store.records, user]);

  return {
    record,
    signContract: (payload) => store.signContract(record?.id, payload),
  };
}
