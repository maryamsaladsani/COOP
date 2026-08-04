// Auth data source. signIn/signUp/requestPasswordReset/confirmPasswordReset
// all call the real backend (see ../../Backend/src/routes/auth.js) instead of
// an in-memory user list.
//
// requestPasswordReset/confirmPasswordReset: the real backend's flow (POST
// /api/auth/password-reset-request + /password-reset-confirm) emails an
// opaque token as a link (ResetPasswordPage reads it from the URL), not a
// 6-digit code — see ForgotPasswordPage/ResetPasswordPage for the matching UI.
//
// usernameExists/registerTrainee are ALSO still local/mock — they only exist
// to support the old client-side "accept application" flow in DataContext.jsx,
// which Stage 2 replaces with a real call to the HR accept endpoint (the real
// backend creates the trainee's account server-side, so nothing client-side
// needs to register a user at all once that lands).

import { apiRequest } from './apiClient';

const NETWORK_DELAY_MS = 650;

// Backend role (uppercase, matches the Role enum) -> frontend role key
// (lowercase, matches ROLE_HOME/ROLE_LABELS in utils/roles.js). Note TRAINEE
// maps to 'student', not 'trainee' — the two codebases named this differently.
const BACKEND_TO_FRONTEND_ROLE = {
  HR: 'hr',
  COORDINATOR: 'coordinator',
  TRAINEE: 'student',
};

const FRONTEND_TO_BACKEND_ROLE = {
  hr: 'HR',
  coordinator: 'COORDINATOR',
  student: 'TRAINEE',
};

function normalizeUser(backendUser, token) {
  return {
    id: backendUser.id,
    email: backendUser.email,
    role: BACKEND_TO_FRONTEND_ROLE[backendUser.role] || backendUser.role,
    name: backendUser.fullName,
    token,
  };
}

// --- Legacy local mock, still used by usernameExists/registerTrainee below --
const users = [
  { username: 'lama.trainee', password: 'Onboard#1', role: 'student', name: 'Lama Al-Harbi' },
  { username: 'noura.hr', password: 'Hr-Access9', role: 'hr', name: 'Noura Al-Shammari' },
  { username: 'faisal.coord', password: 'Coord-Flow7', role: 'coordinator', name: 'Faisal Al-Dosari' },
  { username: 'huda.coord', password: 'Coord-Flow7', role: 'coordinator', name: 'Huda Al-Rashid' },
];

function fail(message) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), NETWORK_DELAY_MS));
}

// --- Real ---------------------------------------------------------------

// email/password login (REQ-29/30/31), unified across all three roles.
export async function signIn(email, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  return normalizeUser(data.user, data.token);
}

// HR/Coordinator self-service signup (REQ-28). `payload` is SignUpPage's raw form values —
// email/password/role/name/departmentId map to real backend fields (departmentId only for
// Coordinator, which links Department.coordinatorId server-side in the same transaction as
// account creation). username/employeeId/companyRole still have no backend storage — see the
// frontend-integration summary.
export async function signUp(payload) {
  const fullName = `${payload.firstName} ${payload.lastName}`.trim();
  const role = FRONTEND_TO_BACKEND_ROLE[payload.role] || payload.role;

  const data = await apiRequest('/api/auth/signup', {
    method: 'POST',
    auth: false,
    body: {
      email: payload.email,
      password: payload.password,
      fullName,
      role,
      ...(role === 'COORDINATOR' ? { departmentId: payload.departmentId } : {}),
    },
  });
  // Signup doesn't return a token — the caller (SignUpPage) logs in separately.
  return normalizeUser(data.user, null);
}

// REQ-32/42: request a reset link (emailed via Resend, see Backend/src/routes/auth.js).
// Always resolves — the backend responds identically whether or not the email is
// registered, so this can't be used to enumerate accounts.
export async function requestPasswordReset(personalEmail) {
  if (!personalEmail) return fail('Enter the personal email on file for your account.');
  return apiRequest('/api/auth/password-reset-request', {
    method: 'POST',
    auth: false,
    body: { email: personalEmail },
  });
}

// REQ-32/42: consume the token from the emailed reset link and set a new password.
export async function confirmPasswordReset(token, newPassword) {
  return apiRequest('/api/auth/password-reset-confirm', {
    method: 'POST',
    auth: false,
    body: { token, newPassword },
  });
}

export function usernameExists(username) {
  return users.some((user) => user.username.toLowerCase() === String(username).trim().toLowerCase());
}

// Used only by HR's "accept application" action until Stage 2 rewires it to
// the real backend, which creates the account server-side instead.
export function registerTrainee({ username, password, name }) {
  users.push({ username, password, role: 'student', name });
}
