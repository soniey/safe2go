import { createContext, useContext, useState } from 'react';
import { findTeamLogin, readTeamRegistry } from './teamRegistry';

const SESSION_KEY = 'safe2go.demoSession.v1';
export const DEMO_EMAIL = 'admin@safe2go.demo';
export const DEMO_PASSWORD = 'Safe2GoDemo!';
export const DEMO_ACCOUNTS = [
  { email: DEMO_EMAIL, password: DEMO_PASSWORD, type: 'demo-admin', label: 'Township Admin', initials: 'TA' },
  { email: 'maintenance@safe2go.demo', password: 'MaintenanceDemo!', type: 'demo-maintenance', label: 'Maintenance Team', initials: 'MT' },
];
const SessionContext = createContext(null);

// Maintenance teams from the Team Registry sign in with their own username and only see their own jobs.
const initialsOf = name => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'CR';
const teamSession = team => ({ email: team.username, type: 'demo-maintenance', label: team.name, initials: initialsOf(team.name), teamId: team.id });

function readSession() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(SESSION_KEY));
    if (saved?.teamId) {
      const team = readTeamRegistry().teams.find(item => item.id === saved.teamId && item.username === saved.email);
      return team ? teamSession(team) : null;
    }
    const account = DEMO_ACCOUNTS.find(item => item.email === saved?.email && item.type === saved?.type);
    return account ? { email: account.email, type: account.type, label: account.label, initials: account.initials } : null;
  } catch { return null; }
}

export function DemoSessionProvider({ children }) {
  const [session, setSession] = useState(readSession);
  function signIn(email, password) {
    const account = DEMO_ACCOUNTS.find(item => item.email === email.trim().toLowerCase() && item.password === password);
    const team = account ? null : findTeamLogin(email, password);
    if (!account && !team) return false;
    const next = account ? { email: account.email, type: account.type, label: account.label, initials: account.initials } : teamSession(team);
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
