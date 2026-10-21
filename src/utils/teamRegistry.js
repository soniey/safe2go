import seedTeams from '../data/teams.json';
import demoContacts from '../data/teamRegistryContacts.json';
import { useSyncExternalStore } from 'react';
import { DATA_CHANGED, notifyDataChanged } from './dataEvents';

export const TEAM_REGISTRY_KEY = 'safe2go.maintenanceTeams.v1';
export const TEAM_SPECIALTIES = ['Flood', 'Tree Fall Risk', 'Road Obstruction', 'Pothole', 'Traffic control'];
export const MIN_PASSWORD_LENGTH = 6;
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const sameName = (left, right) => clean(left).toLocaleLowerCase() === clean(right).toLocaleLowerCase();

// Saved records are teams registered in this browser plus saved edits to existing demo teams (same id).
// Demo only: crew-app passwords are stored in plain text in this browser, not secured.
function validRecord(team) {
  return team && typeof team.id === 'string' && typeof team.name === 'string' &&
    TEAM_SPECIALTIES.includes(team.specialty) && Number.isInteger(team.crew) && team.crew > 0 &&
    (team.username === undefined || typeof team.username === 'string') &&
    (team.password === undefined || typeof team.password === 'string');
}

const seedRecord = team => ({ ...team, ...demoContacts[team.id], source: 'seed' });

export function readTeamRegistry(storage) {
  try {
    const raw = (storage ?? window.localStorage).getItem(TEAM_REGISTRY_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved) || !saved.every(validRecord)) throw new Error('Invalid registry data');
    const teams = seedTeams.map(seedRecord);
    for (const team of saved) {
      const index = teams.findIndex(existing => existing.id === team.id);
      if (index >= 0) { teams[index] = { ...teams[index], ...team, source: teams[index].source, edited: true }; continue; }
      if (teams.some(existing => sameName(existing.name, team.name))) continue;
      teams.push({ ...team, source: 'registered' });
    }
    return { teams, error: null };
  } catch {
    return { teams: seedTeams.map(seedRecord), error: 'Saved registrations could not be read. Existing demo teams are still available. No stored records have been overwritten.' };
  }
}

function saveTeams(teams, storage) {
  const records = teams.filter(team => team.source === 'registered' || team.edited).map(({ source, edited, ...record }) => record);
  (storage ?? window.localStorage).setItem(TEAM_REGISTRY_KEY, JSON.stringify(records));
  notifyDataChanged();
}

// Shared checks for registering and editing. Login details are optional here (older records and tests have none);
// the registry form asks for them.
function checkFields(values, teams, existing = null) {
  const name = clean(values.name);
  const crew = Number(values.crew);
  if (name.length < 2 || name.length > 80) return { error: 'Enter a team name between 2 and 80 characters.' };
  if (teams.some(team => team.id !== existing?.id && sameName(team.name, name))) return { error: 'A team with this name is already registered.' };
  if (!TEAM_SPECIALTIES.includes(values.specialty)) return { error: 'Choose a team specialty.' };
  if (!String(values.crew ?? '').trim() || !Number.isInteger(crew) || crew < 1 || crew > 100) return { error: 'Crew size must be a whole number from 1 to 100.' };
  const phone = clean(values.phone);
  if (phone && !/^01\d{8,9}$/.test(phone)) return { error: 'Enter a 10 or 11 digit mobile number starting with 01, without spaces or dashes, or leave it blank.' };
  const username = clean(values.username).toLowerCase();
  const password = String(values.password ?? '');
  const keepPassword = !password && !!existing?.password;
  if (username || password) {
    if (!USERNAME_PATTERN.test(username)) return { error: 'Username must be 3 to 30 characters using letters, numbers, dots, dashes or underscores.' };
    if (teams.some(team => team.id !== existing?.id && team.username?.toLowerCase() === username)) return { error: 'That username is already used by another team.' };
    if (!keepPassword && password.length < MIN_PASSWORD_LENGTH) return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  return {
    fields: {
      name, specialty: values.specialty, crew,
      leader: clean(values.leader), phone, serviceArea: clean(values.serviceArea) || 'City of Elmina',
      ...(username && { username, password: keepPassword ? existing.password : password }),
    },
  };
}

export function registerMaintenanceTeam(values, storage) {
  const loaded = readTeamRegistry(storage);
  if (loaded.error) return { error: loaded.error };
  const checked = checkFields(values, loaded.teams);
  if (checked.error) return { error: checked.error };
  const team = { id: `TM-${crypto.randomUUID().toUpperCase()}`, ...checked.fields, registeredAt: new Date().toISOString(), simulated: true };
  try {
    const teams = [...loaded.teams, { ...team, source: 'registered' }];
    saveTeams(teams, storage);
    return { team, teams, error: null };
  } catch {
    return { error: 'Registration could not be saved. Allow browser storage and try again; the form has been kept.' };
  }
}

/** Edit any team's details, including the existing demo teams. A blank password keeps the current one. */
export function updateMaintenanceTeam(id, values, storage) {
  const loaded = readTeamRegistry(storage);
  if (loaded.error) return { error: loaded.error };
  const existing = loaded.teams.find(team => team.id === id);
  if (!existing) return { error: 'This team is no longer in the registry.' };
  const checked = checkFields(values, loaded.teams, existing);
  if (checked.error) return { error: checked.error };
  const { username, password, ...rest } = existing;
  const team = { ...rest, ...checked.fields, updatedAt: new Date().toISOString(), ...(existing.source === 'seed' && { edited: true }) };
  try {
    const teams = loaded.teams.map(item => (item.id === id ? team : item));
    saveTeams(teams, storage);
    return { team, teams, error: null };
  } catch {
    return { error: 'Changes could not be saved. Allow browser storage and try again; your edits have been kept.' };
  }
}

/** Crew-app sign-in for a registered team. Returns the team, or null. */
export function findTeamLogin(username, password, storage) {
  const name = clean(username).toLowerCase();
  if (!name || !password) return null;
  return readTeamRegistry(storage).teams.find(team => team.username?.toLowerCase() === name && team.password === password) || null;
}

let cachedRaw;
let cachedTeams;
export function getTeams() {
  let raw = null;
  try { raw = window.localStorage.getItem(TEAM_REGISTRY_KEY); } catch { /* Use seed teams. */ }
  if (!cachedTeams || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTeams = readTeamRegistry().teams;
  }
  return cachedTeams;
}

function subscribe(listener) {
  const onStorage = event => { if (event.key === TEAM_REGISTRY_KEY || event.key === null) listener(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener(DATA_CHANGED, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(DATA_CHANGED, listener);
  };
}

export function useTeams() { return useSyncExternalStore(subscribe, getTeams, getTeams); }
