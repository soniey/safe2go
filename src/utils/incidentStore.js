// Single source of truth for incident response across Safe2Go.
// - Static records: src/data/incidents.json + incidents created on Road Vision (read-only here).
// - Teams: the Maintenance Team Registry (seed teams + teams registered in this browser).
// - Response actions are saved in localStorage, so the admin tab and the crew tab stay in sync.
//
// Who does what:
//   Admin (Incident & Response Center): acknowledge → assign a crew → close road / notify → reopen road
//   Crew  (Field Jobs page):           accept or decline → en route → on site → working → complete
import { useSyncExternalStore } from 'react';
import baseIncidents from '../data/incidents.json';
import roads from '../data/roads.json';
import weather from '../data/weather.json';
import details from '../data/incidentDetails.json';
import { getTeams, TEAM_REGISTRY_KEY, readTeamRegistry } from './teamRegistry';
import { riskLevels } from './risk';
import { DATA_CHANGED } from './dataEvents';
import { getTrees } from './treeRisk';
import { INCIDENT_STORAGE_KEY as ROAD_VISION_KEY, readRoadVisionIncidents } from './roadVisionIncidents';

const STORAGE_KEY = 'safe2go.incidentResponse.v2';

export const stages = [
  { id: 'detected', label: 'Detected', short: 'Detected' },
  { id: 'verified', label: 'Verified', short: 'Verified' },
  { id: 'assigned', label: 'Awaiting crew response', short: 'Assigned' },
  { id: 'accepted', label: 'Accepted by crew', short: 'Accepted' },
  { id: 'dispatched', label: 'Crew en route', short: 'En route' },
  { id: 'on_site', label: 'Crew on site', short: 'On site' },
  { id: 'in_progress', label: 'Work in progress', short: 'Working' },
  { id: 'resolved', label: 'Resolved', short: 'Resolved' },
  { id: 'reopened', label: 'Road reopened', short: 'Reopened' },
];

const stageIndex = id => stages.findIndex(stage => stage.id === id);
const CREW_STAGES = ['assigned', 'accepted', 'dispatched', 'on_site', 'in_progress'];
export const isCrewStage = stage => CREW_STAGES.includes(stage);
const priorityByRisk = { CRITICAL: 'P1', HIGH: 'P2', WATCH: 'P3', SAFE: 'P4' };

export const DECLINE_REASONS = [
  'Crew busy on another job',
  'Missing equipment or vehicle',
  'Outside our specialty',
  'Site not reachable',
];

// Minutes added to the demo clock per action, so a full run reads like a real response:
// RG-001 verified 10:21 → assigned 10:23 → accepted 10:24 → en route 10:26 → on site 10:34 → working 10:35 → resolved 10:53.
const clockStep = { verified: 1, assigned: 2, unassigned: 1, declined: 2, accepted: 1, dispatched: 2, in_progress: 1, resolved: 18, reopened: 3, road_closed: 1, notified: 1 };
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

// ---- AI team matching (rule-based for the demo) ----
const specialtiesByType = {
  Flood: ['Flood'], 'Standing Water': ['Flood'],
  'Tree Fall Risk': ['Tree Fall Risk'], 'Fallen Tree': ['Tree Fall Risk', 'Road Obstruction'], 'Fallen Branch': ['Tree Fall Risk', 'Road Obstruction'],
  Pothole: ['Pothole'], 'Road Surface Damage': ['Pothole'],
  'Road Blockage': ['Road Obstruction', 'Tree Fall Risk'], 'Road Obstruction': ['Road Obstruction', 'Tree Fall Risk'], Obstruction: ['Road Obstruction'],
};
export const specialtyLabels = { Flood: 'Flood & drainage', 'Tree Fall Risk': 'Tree & arborist', 'Road Obstruction': 'Obstruction clearance', Pothole: 'Road surface', 'Traffic control': 'Traffic control' };

function rankTeams(incident, record, teamList, busyMap) {
  const wanted = specialtiesByType[incident.type] || [];
  const declinedIds = new Set((record.declines || []).map(item => item.teamId));
  return teamList
    .map(team => {
      const matchIndex = wanted.indexOf(team.specialty);
      const match = matchIndex === 0 ? 'primary' : matchIndex > 0 ? 'secondary' : 'none';
      const busyWith = busyMap.get(team.id);
      const busyElsewhere = busyWith && busyWith !== incident.id ? busyWith : null;
      const declined = declinedIds.has(team.id);
      const eta = Number(team.etaMin) || 0;
      const base = { primary: 92, secondary: 74, none: 45 }[match];
      const matchScore = Math.max(30, Math.min(98, Math.round(base + (busyElsewhere ? -20 : 5) - Math.min(eta, 30) / 3)));
      const reasons = [
        match === 'primary' ? `${specialtyLabels[team.specialty] || team.specialty} specialist`
          : match === 'secondary' ? `Can handle ${incident.type.toLowerCase()}`
          : team.specialty === 'Traffic control' ? 'Can secure the area until specialists arrive' : 'Not a specialist for this hazard',
        busyElsewhere ? `Busy on ${busyElsewhere}` : 'Available now',
        `ETA ${eta} min`,
      ];
      const rankScore = (declined ? -1000 : 0) + { primary: 100, secondary: 60, none: 0 }[match] + (busyElsewhere ? 0 : 40) - eta;
      return { team, match, matchScore, busyWith: busyElsewhere, declined, reasons, rankScore };
    })
    .sort((a, b) => b.rankScore - a.rankScore || a.team.name.localeCompare(b.team.name));
}

// ---- seed: build each incident's starting history from the team's data ----
function seedRecord(incident) {
  const seed = details[incident.id]?.seed || {};
  const notes = seed.notes || {};
  const event = (type, at, by) => (at == null ? null : { type, at, by, ...(notes[type] && { note: notes[type] }) });
  const detectedAt = toMinutes(incident.detectedAt) ?? DEMO_NOW;
  const verifiedAt = toMinutes(seed.verifiedAt) ?? toMinutes(incident.verification?.verifiedAt);
  const resolved = incident.status?.trim().toLowerCase() === 'resolved';
  const resolvedAt = resolved ? toMinutes(incident.resolvedAt) ?? detectedAt : null;
  const timeline = [
    event('detected', detectedAt, 'Safe2Go monitoring'),
    event('verified', verifiedAt, incident.verification ? 'CCTV review' : 'Safe2Go AI'),
    event('resolved', resolvedAt, 'Maintenance crew'),
  ].filter(Boolean);
  return {
    stage: resolved ? 'resolved' : verifiedAt != null ? 'verified' : 'detected',
    teamId: null,
    roadClosed: false,
    roadEverClosed: false,
    notifiedAt: null,
    declines: [],
    completion: null,
    timeline,
  };
}

// ---- storage ----
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.records && typeof saved.records === 'object' ? saved.records : {};
  } catch {
    return {};
  }
}

function readRaw(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

let saved = loadSaved();
const listeners = new Set();
let cache = { saved: null, roadVisionRaw: undefined, teamsRaw: undefined, board: { incidents: [], teams: [] } };

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: saved })); } catch { /* storage unavailable: keep in memory */ }
}

function emit() { listeners.forEach(listener => listener()); }

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = event => {
    if (event.key === STORAGE_KEY || event.key === null) { saved = loadSaved(); emit(); }
    if (event.key === ROAD_VISION_KEY || event.key === TEAM_REGISTRY_KEY || event.key === 'roadguard.tree-records.v1') emit();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(DATA_CHANGED, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(DATA_CHANGED, listener);
  };
}

function allSourceIncidents() {
  let fromVision = [];
  try { fromVision = readRoadVisionIncidents(); } catch { fromVision = []; }
  return [...baseIncidents, ...fromVision.filter(item => !baseIncidents.some(base => base.id === item.id))];
}

function loadTeams() {
  try { return readTeamRegistry().teams; } catch { return []; }
}

const recordFor = incident => saved[incident.id] || seedRecord(incident);

function buildIncident(incident, record, now, teamList, busyMap) {
  const tree = getTrees().find(item => item.id === incident.treeId);
  if (tree) incident = { ...incident, risk: tree.risk, summary: `Tree risk score ${tree.riskScore}% · ${tree.soil} soil` };
  const extra = details[incident.id] || {};
  const road = roads.find(item => item.id === incident.roadId);
  const timeline = record.timeline;
  const last = type => [...timeline].reverse().find(event => event.type === type)?.at ?? null;
  const detectedAt = last('detected');
  const onSiteAt = last('on_site');
  const isOpen = stageIndex(record.stage) < stageIndex('resolved');
  const team = teamList.find(item => item.id === record.teamId) || null;
  const lastDecline = record.declines?.length ? record.declines[record.declines.length - 1] : null;
  const ranking = isOpen ? rankTeams(incident, record, teamList, busyMap) : [];
  const recommended = ranking.find(item => !item.declined) || null;
  const coordinates = incident.coordinates || (road?.illustrativePath?.positions?.[1] && { lat: road.illustrativePath.positions[1][0], lng: road.illustrativePath.positions[1][1] }) || null;
  const evidence = extra.evidence || [
    incident.cameraId && { source: incident.cameraId, value: incident.detectionConfidence ? `${incident.type}, ${incident.detectionConfidence}% confidence` : incident.type },
    incident.source && { source: 'Reported by', value: incident.source },
  ].filter(Boolean);
  const dispatchedAt = last('dispatched');
  return {
    ...incident,
    detectedAtISO: incident.detectedAt,
    status: stages[stageIndex(record.stage)]?.label || incident.status,
    location: road?.name || incident.location || 'Unknown road',
    coordinates,
    priority: priorityByRisk[incident.risk] || 'P3',
    whyFlagged: tree ? incident.summary : extra.whyFlagged || incident.summary || 'Flagged by the monitoring system.',
    evidence: tree ? [{ source: tree.id, value: `Risk ${tree.riskScore}%, ${tree.soil} soil` }] : evidence,
    recommendedAction: extra.recommendedAction || '',
    crewTask: extra.crewTask || extra.recommendedAction || incident.summary || 'Inspect and make the site safe.',
    residents: extra.residents || null,
    stage: record.stage,
    stageLabel: stages[stageIndex(record.stage)]?.label || record.stage,
    team,
    teamRanking: ranking,
    recommendedTeam: recommended,
    recommendedTeamId: recommended?.team.id || null,
    lastDecline,
    completion: record.completion,
    roadClosed: record.roadClosed,
    roadEverClosed: record.roadEverClosed,
    notifiedAt: record.notifiedAt,
    timeline,
    detectedAt,
    assignedAt: last('assigned'),
    lastUpdateAt: timeline.length ? Math.max(...timeline.map(event => event.at)) : null,
    crewEtaAt: record.stage === 'dispatched' && dispatchedAt != null && team ? dispatchedAt + (Number(team.etaMin) || 0) : null,
    isOpen,
    responseMinutes: onSiteAt != null && detectedAt != null ? onSiteAt - detectedAt : null,
    openMinutes: detectedAt != null ? (isOpen ? now : last('resolved') ?? now) - detectedAt : null,
  };
}

const riskRank = risk => riskLevels.indexOf(risk);

function getSnapshot() {
  let roadVisionRaw = null;
  try { roadVisionRaw = localStorage.getItem(ROAD_VISION_KEY); } catch { /* ignore */ }
  const trees = getTrees();
  const teams = getTeams();
  if (cache.saved !== saved || cache.roadVisionRaw !== roadVisionRaw || cache.trees !== trees || cache.teams !== teams) {
    const sources = allSourceIncidents();
    const records = sources.map(recordFor);
    const teamList = loadTeams();
    const busyMap = new Map();
    sources.forEach((incident, index) => {
      const record = records[index];
      if (record.teamId && isCrewStage(record.stage) && !busyMap.has(record.teamId)) busyMap.set(record.teamId, incident.id);
    });
    const now = Math.max(DEMO_NOW, ...records.flatMap(record => record.timeline.map(event => event.at)));
    const incidents = sources
      .map((incident, index) => buildIncident(incident, records[index], now, teamList, busyMap))
      .sort((a, b) => (b.isOpen - a.isOpen) || (riskRank(b.risk) - riskRank(a.risk)) || ((a.detectedAt ?? 0) - (b.detectedAt ?? 0)) || a.id.localeCompare(b.id));
    cache = { saved, roadVisionRaw, trees, teams, board: { incidents, teams: teamList, now } };
  }
  return cache.board;
}

/** React hook: { incidents, teams, now } — re-renders on any change, including from other tabs. */
export function useResponseBoard() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** React hook: the incident list only. */
export function useIncidents() { return useResponseBoard().incidents; }

export function getIncidents() { return getSnapshot().incidents; }
export function getIncident(id) { return getSnapshot().incidents.find(incident => incident.id === id) || null; }
export function getDemoNow() { return getSnapshot().now; }

// ---- actions ----
function update(id, change) {
  saved = loadSaved(); // read-modify-write, so two open tabs never overwrite each other's latest step
  const incident = allSourceIncidents().find(item => item.id === id);
  if (!incident) return false;
  const current = recordFor(incident);
  const record = { ...current, timeline: [...current.timeline], declines: [...(current.declines || [])] };
  if (change(record, incident) === false) return false;
  saved = { ...saved, [id]: record };
  save();
  emit();
  return true;
}

function log(record, type, { by, note, step } = {}) {
  const lastAny = Math.max(...record.timeline.map(event => event.at));
  const lastStep = Math.max(...record.timeline.filter(event => !sideEvents.has(event.type)).map(event => event.at));
  const minutes = step ?? clockStep[type] ?? 1;
  const at = sideEvents.has(type) ? lastAny + minutes : Math.max(lastStep + minutes, lastAny + 1);
  const event = { type, at, ...(by && { by }), ...(note && { note }) };
  record.timeline.push(event);
  return event;
}

const teamById = id => loadTeams().find(team => team.id === id);
const ADMIN = 'Township Admin';

// Admin actions
export function acknowledgeIncident(id) {
  return update(id, record => {
    if (record.stage !== 'detected') return false;
    record.stage = 'verified';
    log(record, 'verified', { by: ADMIN, note: 'Hazard confirmed' });
  });
}

export function assignTeam(id, teamId, { viaAi = false } = {}) {
  const team = getTeams().find(item => item.id === teamId);
  return update(id, record => {
    if (!team || record.stage !== 'verified') return false;
    record.stage = 'assigned';
    record.teamId = teamId;
    log(record, 'assigned', { by: ADMIN, note: `${team.name}${viaAi ? ' (AI recommended)' : ''} · sent to the crew app` });
  });
}

export function withdrawAssignment(id) {
  return update(id, record => {
    if (record.stage !== 'assigned') return false;
    record.stage = 'verified';
    record.teamId = null;
    log(record, 'unassigned', { by: ADMIN, note: 'Assignment withdrawn' });
  });
}

export function dispatchTeam(id) { return startTravel(id, getIncident(id)?.team?.id); }
export function startMaintenance(id) { return startWork(id, getIncident(id)?.team?.id); }

export function resolveIncident(id) { return completeJob(id, getIncident(id)?.team?.id); }

export function closeRoad(id) {
  return update(id, record => {
    if (record.roadClosed || stageIndex(record.stage) >= stageIndex('resolved')) return false;
    record.roadClosed = true;
    record.roadEverClosed = true;
    log(record, 'road_closed', { by: ADMIN, note: 'Barriers placed, detour active' });
  });
}

export function reopenRoad(id) {
  return update(id, record => {
    if (!record.roadClosed || record.stage !== 'resolved') return false;
    record.roadClosed = false;
    record.stage = 'reopened';
    log(record, 'reopened', { by: ADMIN, note: 'Barriers removed, traffic restored' });
  });
}

export function notifyResidents(id) {
  const residents = details[id]?.residents;
  return update(id, record => {
    if (record.notifiedAt != null) return false;
    const event = log(record, 'notified', { by: ADMIN, note: residents ? `${residents.count.toLocaleString()} residents in ${residents.zone}` : 'Nearby residents' });
    record.notifiedAt = event.at;
  });
}

// Crew actions (Field Jobs page). Each checks the job really belongs to that crew.
function crewStep(id, teamId, from, to, note) {
  return update(id, record => {
    if (record.teamId !== teamId || !from.includes(record.stage)) return false;
    const team = teamById(teamId);
    record.stage = to;
    log(record, to, { by: team?.name || 'Maintenance crew', note: typeof note === 'function' ? note(team) : note, step: to === 'on_site' ? Number(team?.etaMin) || 8 : undefined });
  });
}

export const acceptJob = (id, teamId) => crewStep(id, teamId, ['assigned'], 'accepted', 'Job accepted');
export const startTravel = (id, teamId) => crewStep(id, teamId, ['accepted'], 'dispatched', team => `Leaving now, ETA ${Number(team?.etaMin) || 8} min`);
export const arriveOnSite = (id, teamId) => crewStep(id, teamId, ['dispatched'], 'on_site', 'Crew arrived and assessing the site');
export const startWork = (id, teamId) => crewStep(id, teamId, ['on_site'], 'in_progress', 'Repair or clearance started');

/** Crew finishes the job. `photo` is the proof photo (a small JPEG data URL from the crew app). */
export function completeJob(id, teamId, { note = '', checks = [], photo = null } = {}) {
  return update(id, record => {
    if (record.teamId !== teamId || record.stage !== 'in_progress') return false;
    const team = teamById(teamId);
    record.stage = 'resolved';
    const event = log(record, 'resolved', { by: team?.name || 'Maintenance crew', note: note.trim() || 'Hazard cleared and site checked' });
    if (photo) event.photo = true;
    record.completion = { note: note.trim(), checks, photo, at: event.at };
  });
}

/** Crew turns the job down (before travelling). It goes back to the admin to reassign. */
export function declineJob(id, teamId, { reason, note = '' }) {
  return update(id, record => {
    if (record.teamId !== teamId || !['assigned', 'accepted'].includes(record.stage)) return false;
    const team = teamById(teamId);
    const event = log(record, 'declined', { by: team?.name || 'Maintenance crew', note: [reason, note.trim()].filter(Boolean).join(' · ') });
    record.declines.push({ teamId, teamName: team?.name || teamId, reason, note: note.trim(), at: event.at });
    record.stage = 'verified';
    record.teamId = null;
  });
}

/** Puts every incident back to its starting state (use before each demo run). Road Vision incidents and registered teams are kept. */
export function resetDemo() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  saved = {};
  emit();
}
