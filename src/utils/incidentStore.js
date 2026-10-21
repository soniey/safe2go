// Single source of truth for incident response state on the Incidents page.
// Static records: src/data/incidents.json + incidents created on Road Vision (read-only here).
// Response actions (assign, dispatch, close road…) are saved in localStorage.
import { useSyncExternalStore } from 'react';
import baseIncidents from '../data/incidents.json';
import roads from '../data/roads.json';
import weather from '../data/weather.json';
import details from '../data/incidentDetails.json';
import teams from '../data/teams.json';
import { riskLevels } from './risk';
import { INCIDENT_STORAGE_KEY as ROAD_VISION_KEY, readRoadVisionIncidents } from './roadVisionIncidents';

const STORAGE_KEY = 'safe2go.incidentResponse.v1';

export { teams };

// Ordered response workflow. "Road closed" is tracked separately because it can happen at any point.
export const stages = [
  { id: 'detected', label: 'Detected' },
  { id: 'verified', label: 'Verified' },
  { id: 'assigned', label: 'Team assigned' },
  { id: 'dispatched', label: 'Team dispatched' },
  { id: 'in_progress', label: 'Maintenance in progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'reopened', label: 'Road reopened' },
];

const stageIndex = id => stages.findIndex(stage => stage.id === id);
const priorityByRisk = { CRITICAL: 'P1', HIGH: 'P2', WATCH: 'P3', SAFE: 'P4' };

// Which crew suits which hazard, when incidentDetails.json doesn't name one.
const teamByType = {
  Flood: 'TM-DRN-B', 'Standing Water': 'TM-DRN-B',
  'Tree Fall Risk': 'TM-ARB-1', 'Fallen Tree': 'TM-ARB-1', 'Fallen Branch': 'TM-ARB-1',
  Pothole: 'TM-RDW-A', 'Road Surface Damage': 'TM-RDW-A', 'Road Blockage': 'TM-RDW-A', 'Road Obstruction': 'TM-RDW-A', Obstruction: 'TM-RDW-A',
};

// Minutes added to the demo clock per action, so a demo run reads like a real response:
// RG-001 verified 10:21 → assigned 10:23 → dispatched 10:29 → resolved 10:53 → reopened 10:56.
const clockStep = { verified: 1, assigned: 2, dispatched: 6, road_closed: 1, in_progress: 5, resolved: 19, reopened: 3, notified: 1 };
// Side actions (closing the road, notifying residents) don't push the main workflow times later.
const sideEvents = new Set(['road_closed', 'notified']);

// ---- time helpers (all demo times are Malaysia time on 20 Oct 2026) ----
const mytParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function toMinutes(value) {
  if (value == null) return null;
  if (/^\d{1,2}:\d{2}$/.test(value)) { const [h, m] = value.split(':').map(Number); return h * 60 + m; }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const [h, m] = mytParts.format(date).split(':').map(Number);
  return h * 60 + m;
}

export function formatTime(minutes) {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const DEMO_NOW = toMinutes(weather.updatedAt) ?? toMinutes('10:30');

// ---- seed: build each incident's starting history from the team's data ----
function seedRecord(incident) {
  const seed = details[incident.id]?.seed || {};
  const notes = seed.notes || {};
  const event = (type, at) => (at == null ? null : { type, at, ...(notes[type] && { note: notes[type] }) });
  const detectedAt = toMinutes(incident.detectedAt) ?? DEMO_NOW;
  const verifiedAt = toMinutes(seed.verifiedAt) ?? toMinutes(incident.verification?.verifiedAt);
  const resolved = incident.status?.trim().toLowerCase() === 'resolved';
  const resolvedAt = resolved ? toMinutes(incident.resolvedAt) ?? detectedAt : null;
  const timeline = [event('detected', detectedAt), event('verified', verifiedAt), event('resolved', resolvedAt)].filter(Boolean);
  return {
    stage: resolved ? 'resolved' : verifiedAt != null ? 'verified' : 'detected',
    teamId: null,
    roadClosed: false,
    roadEverClosed: false,
    notifiedAt: null,
    timeline,
  };
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.records && typeof saved.records === 'object' ? saved.records : {};
  } catch {
    return {};
  }
}

function loadRoadVision() {
  try { return readRoadVisionIncidents(); } catch { return []; }
}

let saved = loadSaved();
const listeners = new Set();
let cache = { saved: null, roadVisionRaw: undefined, list: [] };

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: saved })); } catch { /* storage unavailable: keep in memory */ }
}

function emit() { listeners.forEach(listener => listener()); }

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = event => {
    if (event.key === STORAGE_KEY) { saved = loadSaved(); emit(); }
    if (event.key === ROAD_VISION_KEY) emit();
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}

function allSourceIncidents() {
  const fromVision = loadRoadVision().filter(item => !baseIncidents.some(base => base.id === item.id));
  return [...baseIncidents, ...fromVision];
}

function recordFor(incident) { return saved[incident.id] || seedRecord(incident); }

function demoNow(records) {
  const times = records.flatMap(record => record.timeline.map(event => event.at));
  return Math.max(DEMO_NOW, ...times);
}

function buildIncident(incident, record, now) {
  const extra = details[incident.id] || {};
  const road = roads.find(item => item.id === incident.roadId);
  const at = type => record.timeline.find(event => event.type === type)?.at ?? null;
  const detectedAt = at('detected');
  const dispatchedAt = at('dispatched');
  const isOpen = stageIndex(record.stage) < stageIndex('resolved');
  const evidence = extra.evidence || [
    incident.cameraId && { source: incident.cameraId, value: incident.detectionConfidence ? `${incident.type}, ${incident.detectionConfidence}% confidence` : incident.type },
    incident.source && { source: 'Reported by', value: incident.source },
  ].filter(Boolean);
  return {
    ...incident,
    location: road?.name || incident.location || 'Unknown road',
    priority: priorityByRisk[incident.risk] || 'P3',
    whyFlagged: extra.whyFlagged || incident.summary || 'Flagged by the monitoring system.',
    evidence,
    recommendedAction: extra.recommendedAction || '',
    recommendedTeamId: extra.recommendedTeamId || teamByType[incident.type] || null,
    residents: extra.residents || null,
    stage: record.stage,
    stageLabel: stages[stageIndex(record.stage)]?.label || record.stage,
    team: teams.find(team => team.id === record.teamId) || null,
    roadClosed: record.roadClosed,
    roadEverClosed: record.roadEverClosed,
    notifiedAt: record.notifiedAt,
    timeline: record.timeline,
    detectedAt,
    isOpen,
    responseMinutes: dispatchedAt != null && detectedAt != null ? dispatchedAt - detectedAt : null,
    openMinutes: detectedAt != null ? (isOpen ? now : at('resolved') ?? now) - detectedAt : null,
  };
}

const riskRank = risk => riskLevels.indexOf(risk);

function getSnapshot() {
  let roadVisionRaw = null;
  try { roadVisionRaw = localStorage.getItem(ROAD_VISION_KEY); } catch { /* ignore */ }
  if (cache.saved !== saved || cache.roadVisionRaw !== roadVisionRaw) {
    const sources = allSourceIncidents();
    const records = sources.map(recordFor);
    const now = demoNow(records);
    const list = sources
      .map((incident, index) => buildIncident(incident, records[index], now))
      .sort((a, b) => (b.isOpen - a.isOpen) || (riskRank(b.risk) - riskRank(a.risk)) || ((a.detectedAt ?? 0) - (b.detectedAt ?? 0)) || a.id.localeCompare(b.id));
    cache = { saved, roadVisionRaw, list };
  }
  return cache.list;
}

/** React hook: always returns the latest incident list and re-renders on any change. */
export function useIncidents() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getIncidents() { return getSnapshot(); }
export function getIncident(id) { return getSnapshot().find(incident => incident.id === id) || null; }
export function getDemoNow() { return demoNow(getSnapshot().map(incident => ({ timeline: incident.timeline }))); }

function update(id, change) {
  const incident = allSourceIncidents().find(item => item.id === id);
  if (!incident) return;
  const current = recordFor(incident);
  const record = { ...current, timeline: [...current.timeline] };
  if (change(record) === false) return;
  saved = { ...saved, [id]: record };
  save();
  emit();
}

function log(record, type, note) {
  const lastAny = Math.max(...record.timeline.map(event => event.at));
  const lastStep = Math.max(...record.timeline.filter(event => !sideEvents.has(event.type)).map(event => event.at));
  const step = clockStep[type] ?? 1;
  const at = sideEvents.has(type) ? lastAny + step : Math.max(lastStep + step, lastAny + 1);
  const event = { type, at, ...(note && { note }) };
  record.timeline.push(event);
  return event;
}

function advance(id, from, to, note) {
  update(id, record => {
    if (record.stage !== from) return false;
    record.stage = to;
    log(record, to, note);
  });
}

export function acknowledgeIncident(id) { advance(id, 'detected', 'verified', 'Acknowledged by Township Admin'); }

export function assignTeam(id, teamId) {
  const team = teams.find(item => item.id === teamId);
  update(id, record => {
    if (!team || record.stage !== 'verified') return false;
    record.stage = 'assigned';
    record.teamId = teamId;
    log(record, 'assigned', `${team.name} notified`);
  });
}

export function dispatchTeam(id) {
  update(id, record => {
    if (record.stage !== 'assigned') return false;
    const team = teams.find(item => item.id === record.teamId);
    record.stage = 'dispatched';
    log(record, 'dispatched', team ? `${team.name} en route, ETA ${team.etaMin} min` : undefined);
  });
}

export function startMaintenance(id) { advance(id, 'dispatched', 'in_progress', 'Crew on site'); }

export function resolveIncident(id) { advance(id, 'in_progress', 'resolved', 'Hazard cleared and checked'); }

export function closeRoad(id) {
  update(id, record => {
    if (record.roadClosed || stageIndex(record.stage) >= stageIndex('resolved')) return false;
    record.roadClosed = true;
    record.roadEverClosed = true;
    log(record, 'road_closed', 'Barriers placed, detour active');
  });
}

export function reopenRoad(id) {
  update(id, record => {
    if (!record.roadClosed || record.stage !== 'resolved') return false;
    record.roadClosed = false;
    record.stage = 'reopened';
    log(record, 'reopened', 'Barriers removed');
  });
}

export function notifyResidents(id) {
  const residents = details[id]?.residents;
  update(id, record => {
    if (record.notifiedAt != null) return false;
    const event = log(record, 'notified', residents ? `${residents.count.toLocaleString()} residents in ${residents.zone}` : 'Nearby residents');
    record.notifiedAt = event.at;
  });
}

/** Puts every incident back to its starting state (use before each demo run). Road Vision incidents are kept. */
export function resetDemo() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  saved = {};
  emit();
}
