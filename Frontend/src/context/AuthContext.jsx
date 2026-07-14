import { createContext, useContext, useMemo, useState } from 'react';
import * as authApi from '../data/mockAuth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'coop.session';

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

  const login = async (username, password) => {
    const resolved = await authApi.signIn(username, password);
    setUser(resolved);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
    return resolved;
  };

  const logout = () => {
    setUser(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
