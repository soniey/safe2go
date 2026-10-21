import seedTeams from '../data/teams.json';
import demoContacts from '../data/teamRegistryContacts.json';
import { useSyncExternalStore } from 'react';
import { DATA_CHANGED, notifyDataChanged } from './dataEvents';

export const TEAM_REGISTRY_KEY = 'safe2go.maintenanceTeams.v1';
export const TEAM_SPECIALTIES = ['Flood', 'Tree Fall Risk', 'Road Obstruction', 'Pothole', 'Traffic control'];
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const sameName = (left, right) => clean(left).toLocaleLowerCase() === clean(right).toLocaleLowerCase();

function validRecord(team) {
  return team && typeof team.id === 'string' && typeof team.name === 'string' &&
    TEAM_SPECIALTIES.includes(team.specialty) && Number.isInteger(team.crew) && team.crew > 0 &&
    Number.isInteger(team.etaMin) && team.etaMin >= 0;
}

export function readTeamRegistry(storage) {
  try {
    const raw = (storage ?? window.localStorage).getItem(TEAM_REGISTRY_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved) || !saved.every(validRecord)) throw new Error('Invalid registry data');
    const knownIds = new Set(seedTeams.map(team => team.id));
    const teams = seedTeams.map(team => ({ ...team, ...demoContacts[team.id], source: 'seed' }));
    for (const team of saved) {
      if (knownIds.has(team.id) || teams.some(existing => sameName(existing.name, team.name))) continue;
      knownIds.add(team.id);
      teams.push({ ...team, source: 'registered' });
    }
    return { teams, error: null };
  } catch {
    return { teams: seedTeams.map(team => ({ ...team, ...demoContacts[team.id], source: 'seed' })), error: 'Saved registrations could not be read. Existing demo teams are still available. No stored records have been overwritten.' };
  }
}

export function registerMaintenanceTeam(values, storage) {
  const loaded = readTeamRegistry(storage);
  if (loaded.error) return { error: loaded.error };
  const name = clean(values.name);
  const crew = Number(values.crew);
  const etaMin = Number(values.etaMin);
  if (name.length < 2 || name.length > 80) return { error: 'Enter a team name between 2 and 80 characters.' };
  if (loaded.teams.some(team => sameName(team.name, name))) return { error: 'A team with this name is already registered.' };
  if (!TEAM_SPECIALTIES.includes(values.specialty)) return { error: 'Choose a team specialty.' };
  if (!String(values.crew ?? '').trim() || !Number.isInteger(crew) || crew < 1 || crew > 100) return { error: 'Crew size must be a whole number from 1 to 100.' };
  if (!String(values.etaMin ?? '').trim() || !Number.isInteger(etaMin) || etaMin < 0 || etaMin > 240) return { error: 'Estimated travel time must be a whole number from 0 to 240 minutes.' };
  const phone = clean(values.phone);
  if (phone && !/^01\d{8,9}$/.test(phone)) return { error: 'Enter a 10 or 11 digit mobile number starting with 01, without spaces or dashes, or leave it blank.' };
  const team = {
    id: `TM-${crypto.randomUUID().toUpperCase()}`, name, specialty: values.specialty, crew, etaMin,
    leader: clean(values.leader), phone, serviceArea: clean(values.serviceArea) || 'City of Elmina',
    registeredAt: new Date().toISOString(), simulated: true,
  };
  try {
    const saved = loaded.teams.filter(item => item.source === 'registered').map(({ source, ...record }) => record);
    (storage ?? window.localStorage).setItem(TEAM_REGISTRY_KEY, JSON.stringify([...saved, team]));
    notifyDataChanged();
    return { team, teams: [...loaded.teams, { ...team, source: 'registered' }], error: null };
  } catch {
    return { error: 'Registration could not be saved. Allow browser storage and try again; the form has been kept.' };
  }
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
