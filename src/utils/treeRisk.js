import seedTrees from '../data/trees.json';
import roads from '../data/roads.json';
import { useSyncExternalStore } from 'react';
import { DATA_CHANGED, notifyDataChanged } from './dataEvents';

const STORAGE_KEY = 'roadguard.tree-records.v1';

export function scoreTree(tree) {
  const age = Math.min(20, Math.max(0, Math.round((Number(tree.age) || 0) / 3)));
  const health = { Good: 5, Fair: 20, Poor: 35 }[tree.health] ?? 10;
  const soil = { Dry: 4, Normal: 7, Moist: 13, Saturated: 22 }[tree.soil] ?? 7;
  const tilt = Math.min(25, Math.round((Number(tree.tilt) || 0) * 1.2));
  return Math.min(100, age + health + soil + tilt);
}

export function treeRiskLevel(score) {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 35) return 'WATCH';
  return 'SAFE';
}

// Small local API adapter: the UI uses async CRUD calls just like a remote API.
// localStorage keeps inspection updates available when the demo is reopened.
function readRecords() {
  if (memoryOnly) return memoryRecords;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const records = JSON.parse(saved);
      if (Array.isArray(records) && records.every(tree => tree && typeof tree.id === 'string')) {
        const savedIds = new Set(records.map(tree => tree.id));
        return [...records, ...seedTrees.filter(tree => !savedIds.has(tree.id))];
      }
    }
  } catch { /* Use the bundled demo records if storage is unavailable. */ }
  return memoryRecords;
}

let memoryRecords = seedTrees;
let memoryOnly = false;
let cachedRaw;
let cachedMemory;
let cachedTrees = [];

export function getTrees() {
  let raw = null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { /* Use session records. */ }
  if (raw !== cachedRaw || memoryRecords !== cachedMemory) {
    cachedRaw = raw;
    cachedMemory = memoryRecords;
    cachedTrees = readRecords().map(tree => {
      const seed = seedTrees.find(item => item.id === tree.id);
      const roadId = seed?.roadId ?? tree.roadId;
      const road = roads.find(item => item.id === roadId);
      const riskScore = scoreTree(tree);
      return { ...tree, roadId, location: road ? `${road.name}${seed?.locationSuffix ? ` · ${seed.locationSuffix}` : ''}` : tree.location,
        riskScore, risk: treeRiskLevel(riskScore) };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }
  return cachedTrees;
}

function subscribe(listener) {
  const onStorage = event => {
    if (event.key === STORAGE_KEY || event.key === null) {
      memoryOnly = false;
      if (event.key === null || event.newValue === null) memoryRecords = seedTrees;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(DATA_CHANGED, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(DATA_CHANGED, listener);
  };
}

export function useTrees() { return useSyncExternalStore(subscribe, getTrees, getTrees); }

function writeRecords(records) {
  memoryRecords = records;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    memoryOnly = false;
  } catch { memoryOnly = true; }
  notifyDataChanged();
  return records;
}

export const treeApi = {
  async list() {
    return getTrees();
  },
  async addInspection(id, inspection) {
    const records = readRecords().map(tree => tree.id === id ? {
      ...tree,
      lastInspection: inspection.date,
      history: [inspection, ...(tree.history || [])],
      ...(inspection.health ? { health: inspection.health } : {}),
      ...(inspection.soil ? { soil: inspection.soil } : {}),
      ...(inspection.tilt !== '' && inspection.tilt != null ? { tilt: Number(inspection.tilt) } : {}),
    } : tree);
    return writeRecords(records);
  },
};
