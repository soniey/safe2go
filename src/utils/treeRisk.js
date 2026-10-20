import seedTrees from '../data/trees.json';

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
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* Use the bundled demo records if storage is unavailable. */ }
  return seedTrees;
}

function writeRecords(records) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* Session still works in memory. */ }
  return records;
}

export const treeApi = {
  async list() {
    return readRecords().map(tree => ({ ...tree, riskScore: scoreTree(tree), risk: treeRiskLevel(scoreTree(tree)) }))
      .sort((a, b) => b.riskScore - a.riskScore);
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
