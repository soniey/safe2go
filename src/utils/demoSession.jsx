import { createContext, useContext, useState } from 'react';

const SESSION_KEY = 'safe2go.demoSession.v1';
export const DEMO_EMAIL = 'admin@safe2go.demo';
export const DEMO_PASSWORD = 'Safe2GoDemo!';
export const DEMO_ACCOUNTS = [
  { email: DEMO_EMAIL, password: DEMO_PASSWORD, type: 'demo-admin', label: 'Township Admin', initials: 'TA' },
  { email: 'maintenance@safe2go.demo', password: 'MaintenanceDemo!', type: 'demo-maintenance', label: 'Maintenance Team', initials: 'MT' },
];
const SessionContext = createContext(null);

function readSession() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(SESSION_KEY));
    const account = DEMO_ACCOUNTS.find(item => item.email === saved?.email && item.type === saved?.type);
    return account ? { email: account.email, type: account.type, label: account.label, initials: account.initials } : null;
  } catch { return null; }
}

export function DemoSessionProvider({ children }) {
  const [session, setSession] = useState(readSession);
  function signIn(email, password) {
    const account = DEMO_ACCOUNTS.find(item => item.email === email.trim().toLowerCase() && item.password === password);
    if (!account) return false;
    const next = { email: account.email, type: account.type, label: account.label, initials: account.initials };
    try { window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch { /* Keep the session in memory when browser storage is blocked. */ }
    setSession(next);
    return true;
  }
  function signOut() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch { /* Clear the in-memory session regardless. */ }
    setSession(null);
  }
  return <SessionContext.Provider value={{ session, signIn, signOut }}>{children}</SessionContext.Provider>;
}

export function useDemoSession() { return useContext(SessionContext); }
