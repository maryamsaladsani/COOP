// Fake backend for the auth flows. No real network layer exists yet, so every
// call is an in-memory, artificially-delayed stand-in for what the API will do.
// The frontend never chooses a role: the mock, like the real backend will,
// decides it and hands it back after credentials are verified.

const NETWORK_DELAY_MS = 650;

const users = [
  { username: 'lama.trainee', password: 'Onboard#1', role: 'student', name: 'Lama Al-Harbi' },
  { username: 'noura.hr', password: 'Hr-Access9', role: 'hr', name: 'Noura Al-Shammari' },
  { username: 'faisal.coord', password: 'Coord-Flow7', role: 'coordinator', name: 'Faisal Al-Dosari' },
];

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

function fail(message) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), NETWORK_DELAY_MS));
}

export function signIn(username, password) {
  const match = users.find((user) => user.username.toLowerCase() === username.trim().toLowerCase());
  if (!match || match.password !== password) {
    return fail('That username or password is not right. Try again.');
  }
  return delay({ username: match.username, role: match.role, name: match.name });
}

export function requestPasswordReset(personalEmail) {
  if (!personalEmail) return fail('Enter the personal email on file for your account.');
  return delay({ sentTo: personalEmail });
}

export function confirmPasswordReset(code) {
  if (String(code).trim().length !== 6) {
    return fail('That code is not valid. Check your email and try again.');
  }
  return delay({ reset: true });
}

export function signUp(payload) {
  const exists = users.some((user) => user.username.toLowerCase() === payload.username.trim().toLowerCase());
  if (exists) {
    return fail('That username is already taken.');
  }
  users.push({
    username: payload.username,
    password: payload.password,
    role: payload.role,
    name: payload.name,
  });
  return delay({ username: payload.username, role: payload.role, name: payload.name });
}
