import { createContext, useContext, useMemo, useState } from 'react';
import * as authApi from '../data/mockAuth';
import { apiRequest } from '../data/apiClient';

const AuthContext = createContext(null);

// apiClient.js reads the same key/shape back out to attach the auth header —
// keep the two in sync if this ever changes.
const STORAGE_KEY = 'coop.session';

// Fix 4: TraineeDashboardPage's "sign your contract" notice dismissal, scoped to this
// key so it's cleared here at logout — dismissing it only hides it for the current
// login session, it reappears next time the trainee signs in while still unsigned.
export const CONTRACT_NOTICE_DISMISSED_KEY = 'coop.contractNoticeDismissed';

function readStoredUser() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const login = async (email, password) => {
    const resolved = await authApi.signIn(email, password);
    setUser(resolved);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
    return resolved;
  };

  // REQ-52: stateless JWT, so there's nothing server-side to invalidate — the
  // real logout call is best-effort and never blocks clearing local session.
  const logout = () => {
    apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(CONTRACT_NOTICE_DISMISSED_KEY);
  };

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
