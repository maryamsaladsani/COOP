import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, apiDownload } from './apiClient';
import { adaptTrainee, adaptTrainees, milestoneReached } from './traineeAdapter';

// Every role below is wired to the real backend (see ../../Backend). Each
// exported hook is self-contained (its own fetch/state) since each role
// hits a differently-shaped, differently-scoped endpoint — there's no
// longer one shared client-side array all roles read from.

const DataContext = createContext(null);

// ApplicationPage's "Duration" field is free text (e.g. "6 months"), but the
// backend's durationMonths is numeric (REQ-01). Extract the leading number
// rather than restructuring that field into a number input.
function extractMonths(duration) {
  const match = String(duration).match(/\d+/);
  return match ? Number(match[0]) : NaN;
}

export function DataProvider({ children }) {
  // ---- Public --------------------------------------------------------

  // REQ-01/02/03: real submission to POST /api/applications (no auth). The
  // backend stores file fields as URL strings and has no upload/storage of
  // its own yet, so the filenames ApplicationPage already collects are sent
  // as placeholder "URLs" — see the frontend-integration summary.
  async function submitApplication(payload) {
    const durationMonths = extractMonths(payload.duration);
    if (Number.isNaN(durationMonths)) {
      throw new Error('Duration must include a number of months (e.g. "6 months").');
    }

    const trainee = await apiRequest('/api/applications', {
      method: 'POST',
      auth: false,
      body: {
        fullName: `${payload.firstName} ${payload.lastName}`.trim(),
        phone: payload.phone,
        birthDate: payload.birthDate,
        personalEmail: payload.personalEmail,
        universityEmail: payload.universityEmail,
        universityName: payload.universityName,
        college: payload.college,
        major: payload.major,
        gpa: Number(payload.gpa),
        startDate: payload.startDate,
        endDate: payload.endDate,
        durationMonths,
        nationality: payload.nationality,
        nationalId: payload.nationalId,
        bloodType: payload.bloodType,
        signatureUrl: payload.signatureFileName,
        personalImageUrl: payload.personalImageFileName,
        universityTranscriptUrl: payload.transcriptFileName,
        cvUrl: payload.cvFileName,
        iban: payload.iban,
        universityLetterUrl: payload.universityLetterFileName,
        referralSource: payload.referralSource,
        referringEmployeeId: payload.employeeReferralId || null,
      },
    });
    return trainee;
  }

  const value = useMemo(() => ({ submitApplication }), []);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useDataStore() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataStore must be used within a DataProvider');
  return ctx;
}

// ---- Role-scoped hooks. Pages should only ever import the hook for their
// own role. -----------------------------------------------------------

export function usePublicApplication() {
  const { submitApplication } = useDataStore();
  return { submitApplication };
}

// HR sees every trainee, unscoped (REQ-23).
// Every mutation refetches afterward (refetch-on-load, per BACKEND_CONTEXT.md)
// rather than optimistically patching local state.
export function useHRData() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, departmentsRes] = await Promise.all([
        apiRequest('/api/hr/students'),
        apiRequest('/api/hr/departments'),
      ]);
      const byId = Object.fromEntries(departmentsRes.departments.map((d) => [d.id, d]));
      setDepartments(departmentsRes.departments);
      setStudents(adaptTrainees(studentsRes.students, byId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function acceptApplication(id) {
    await apiRequest(`/api/hr/students/${id}/accept`, { method: 'PATCH' });
    await refetch();
  }

  async function rejectApplication(id) {
    await apiRequest(`/api/hr/students/${id}/reject`, { method: 'PATCH' });
    await refetch();
  }

  async function withdrawStudent(id) {
    await apiRequest(`/api/hr/students/${id}/withdraw`, { method: 'PATCH' });
    await refetch();
  }

  async function requestCard(id) {
    // Real endpoint takes no body — it uses the trainee's own already-stored
    // image/signature/name/national ID/nationality/blood type (REQ-21).
    await apiRequest(`/api/hr/students/${id}/request-card`, { method: 'PATCH' });
    await refetch();
  }

  async function assignToCoordinator(ids, payload) {
    if (!ids || ids.length === 0) throw new Error('Select at least one student.');
    await apiRequest('/api/hr/students/assign-department', {
      method: 'PATCH',
      body: { studentIds: ids, departmentId: payload.departmentId },
    });
    await refetch();
  }

  async function issueCertificate(id) {
    await apiRequest(`/api/hr/students/${id}/issue-certificate`, { method: 'PATCH' });
    await refetch();
  }

  return {
    students,
    departments,
    loading,
    error,
    refetch,
    acceptApplication,
    rejectApplication,
    withdrawStudent,
    requestCard,
    assignToCoordinator,
    issueCertificate,
  };
}

// Single-student detail view (REQ-24) — separate from useHRData's list because
// GET /students returns a lighter "key details" summary (REQ-23) that doesn't
// carry every field the profile page needs (phone, GPA, documents, etc.);
// the detail endpoint returns the full record instead.
export function useHRStudentDetail(id) {
  const [student, setStudent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [studentRes, departmentsRes] = await Promise.all([
        apiRequest(`/api/hr/students/${id}`),
        apiRequest('/api/hr/departments'),
      ]);
      const byId = Object.fromEntries(departmentsRes.departments.map((d) => [d.id, d]));
      setDepartments(departmentsRes.departments);
      setStudent(adaptTrainee(studentRes.student, byId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function acceptApplication() {
    await apiRequest(`/api/hr/students/${id}/accept`, { method: 'PATCH' });
    await refetch();
  }

  async function rejectApplication() {
    await apiRequest(`/api/hr/students/${id}/reject`, { method: 'PATCH' });
    await refetch();
  }

  async function withdrawStudent() {
    await apiRequest(`/api/hr/students/${id}/withdraw`, { method: 'PATCH' });
    await refetch();
  }

  async function requestCard() {
    await apiRequest(`/api/hr/students/${id}/request-card`, { method: 'PATCH' });
    await refetch();
  }

  async function assignToCoordinator(payload) {
    await apiRequest('/api/hr/students/assign-department', {
      method: 'PATCH',
      body: { studentIds: [id], departmentId: payload.departmentId },
    });
    await refetch();
  }

  async function issueCertificate() {
    await apiRequest(`/api/hr/students/${id}/issue-certificate`, { method: 'PATCH' });
    await refetch();
  }

  return {
    student,
    departments,
    loading,
    error,
    refetch,
    acceptApplication,
    rejectApplication,
    withdrawStudent,
    requestCard,
    assignToCoordinator,
    issueCertificate,
  };
}

// Coordinator is wired to the real backend — scoping (REQ-36) happens
// server-side in coordinator.js via the JWT, not client-side filtering here.
// Self-contained (own fetch/state), like useHRData. GET /trainees already
// returns full records with the department relation nested directly (there's
// no separate departments-list endpoint for this role the way HR has one),
// so no departmentsById lookup is needed before adapting.
//
// markDeskReady/confirmTrainingStarted/confirmTrainingNotStarted from the old
// mock have NO real backend equivalent — the real Coordinator actions are
// request-account, request-desk-device, division, and confirm-training
// (completion only, no separate "started" concept). Those three are dropped
// here; see the profile/bulk-action pages for how their UI was adjusted.
export function useCoordinatorData() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { trainees } = await apiRequest('/api/coordinator/trainees');
      setStudents(adaptTrainees(trainees));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function requestCompanyAccount(id) {
    await apiRequest(`/api/coordinator/trainees/${id}/request-account`, { method: 'PATCH' });
    await refetch();
  }

  async function requestDeskDevice(id) {
    await apiRequest(`/api/coordinator/trainees/${id}/request-desk-device`, { method: 'PATCH' });
    await refetch();
  }

  async function assignDivision(id, payload) {
    // Real endpoint (REQ-11) only accepts `division` — no manager/alt-supervisor
    // concept exists in the schema (division is a plain string field).
    await apiRequest(`/api/coordinator/trainees/${id}/division`, {
      method: 'PATCH',
      body: { division: payload.division },
    });
    await refetch();
  }

  async function confirmTrainingCompleted(id) {
    await apiRequest(`/api/coordinator/trainees/${id}/confirm-training`, { method: 'PATCH' });
    await refetch();
  }

  return {
    students,
    loading,
    error,
    refetch,
    getStudent: (id) => students.find((s) => s.id === id) || null,
    requestCompanyAccount,
    requestDeskDevice,
    assignDivision,
    confirmTrainingCompleted,
  };
}

// Trainee's own dashboard (REQ-04/05) — wired to the real, deliberately
// minimal GET /status (milestone + a precomputed roadmap) and
// GET /training-details. Neither endpoint returns a full raw trainee
// record, so `record` here is synthesized: adaptTrainee() (the same
// adapter HR/Coordinator use) is fed a minimal trainee-shaped object built
// from what these two endpoints actually provide. Fields neither endpoint
// supplies (cardStatus, trainingCompleted, certificateIssued) are
// approximated from milestone position via milestoneReached() — safe
// because REQ-04's own roadmap is itself just a milestone position, so
// nothing here can show a step as done before the real milestone reaches
// it. Narrow known gap: trainingCompleted is approximated as true only
// once milestone reaches CERTIFICATE, so there's a brief real-world window
// (Coordinator confirmed completion, HR hasn't issued the certificate yet)
// where this lags what HR/Coordinator already see.
export function useTraineeData() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [trainingDetails, setTrainingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statusRes, detailsRes] = await Promise.all([
        apiRequest('/api/trainee/status'),
        apiRequest('/api/trainee/training-details'),
      ]);
      setStatus(statusRes);
      setTrainingDetails(detailsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const record = useMemo(() => {
    if (!status) return null;
    const { milestone } = status;
    const department = trainingDetails?.available
      ? {
          name: trainingDetails.department?.name,
          branch: trainingDetails.department?.branch,
          businessLine: trainingDetails.department?.businessLine,
          buildingNumber: trainingDetails.department?.buildingNumber,
          floorNumber: trainingDetails.department?.floorNumber,
          coordinator: trainingDetails.coordinatorName ? { fullName: trainingDetails.coordinatorName } : null,
        }
      : null;

    const synthetic = {
      id: 'me',
      // Neither endpoint returns the trainee's own name — reused from the
      // logged-in session (AuthContext) instead, same as DashboardHeader does.
      fullName: user?.name || '',
      applicationStatus: 'ACCEPTED',
      withdrawn: Boolean(status.withdrawn),
      milestone,
      cardStatus: milestoneReached({ milestone }, 'COMPANY_CARD') ? 'ISSUED' : 'NOT_REQUESTED',
      cardRequestedAt: null,
      cardIssuedAt: null,
      trainingCompleted: milestone === 'CERTIFICATE',
      trainingCompletedAt: null,
      contractSigned: false,
      contractSignedAt: null,
      certificateIssued: milestone === 'CERTIFICATE',
      certificateIssuedAt: null,
      departmentId: department ? 'assigned' : null,
      coordinatorId: department ? 'assigned' : null,
      division: trainingDetails?.available ? trainingDetails.division : null,
      department,
      createdAt: new Date().toISOString(),
      userId: 'me',
    };
    return adaptTrainee(synthetic);
  }, [status, trainingDetails, user]);

  return { record, loading, error, refetch };
}

// Contract (REQ-07/08) is standalone from the milestone roadmap (per
// BACKEND_CONTEXT.md) and fetched separately — the dashboard/details/
// certificate pages never need it, only the Contract page does.
export function useTraineeContract() {
  const [contract, setContract] = useState(null);
  const [contractSigned, setContractSigned] = useState(false);
  const [contractSignedAt, setContractSignedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/api/trainee/contract');
      setContract(res.contract);
      setContractSigned(res.contractSigned);
      setContractSignedAt(res.contractSignedAt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function signContract() {
    await apiRequest('/api/trainee/contract/sign', { method: 'POST' });
    await refetch();
  }

  return { contract, contractSigned, contractSignedAt, loading, error, signContract };
}

// REQ-09: certificate PDF download. Not a hook — an on-demand action used
// directly by TraineeCertificatePage.
export async function downloadTraineeCertificate() {
  const { blob, filename } = await apiDownload('/api/trainee/certificate');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'certificate.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
