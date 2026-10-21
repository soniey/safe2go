import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Isolated browser storage: never reads or changes the user's saved demo.
const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};
globalThis.localStorage = storage;
globalThis.window = Object.assign(new EventTarget(), { localStorage: storage });
let server;
async function load() {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  return {
    shared: await server.ssrLoadModule('/src/utils/sharedData.js'),
    response: await server.ssrLoadModule('/src/utils/incidentStore.js'),
    vision: await server.ssrLoadModule('/src/utils/roadVisionIncidents.js'),
    trees: await server.ssrLoadModule('/src/utils/treeRisk.js'),
    dashboard: await server.ssrLoadModule('/src/utils/dashboard.js'),
    registry: await server.ssrLoadModule('/src/utils/teamRegistry.js'),
  };
}
try {
  let modules = await load();
  let { shared, response, vision, trees, dashboard, registry } = modules;
  const snapshot = () => shared.getSharedData();
  const overview = () => dashboard.buildDashboard(snapshot());
  const initial = snapshot();
  const initialOpen = initial.incidents.filter(item => item.isOpen).length;
  assert.equal(overview().stats.openIncidents, initialOpen);
  assert.equal(new Set(initial.cameras.map(camera => camera.id)).size, initial.cameras.length);
  for (const incident of initial.incidents) {
    assert.ok(initial.roads.some(road => road.id === incident.roadId));
    assert.ok(Number.isFinite(Date.parse(incident.detectedAt)));
    if (incident.cameraId) assert.ok(initial.cameras.some(camera => camera.id === incident.cameraId && camera.roadId === incident.roadId));
    if (incident.treeId) assert.ok(initial.trees.some(tree => tree.id === incident.treeId && tree.roadId === incident.roadId));
  }
  assert.equal(vision.createRoadVisionIncident('DET-001', storage).incident.id, 'RG-001');
  assert.equal(vision.createRoadVisionIncident('DET-002', storage).incident.id, 'RG-003');
  assert.equal(overview().stats.openIncidents, initialOpen);
  let notifications = 0;
  window.addEventListener('roadguard:data-changed', () => notifications++);
  const created = vision.createRoadVisionIncident('DET-003', storage);
  assert.ok(created.created);
  assert.equal(notifications, 1, 'Creation notifies subscribers in the same tab');
  assert.equal(overview().stats.openIncidents, initialOpen + 1);
  assert.ok(overview().hazards.some(item => item.id === created.incident.id));
  assert.equal(vision.createRoadVisionIncident('DET-003', storage).created, false);
  assert.equal(overview().stats.openIncidents, initialOpen + 1);
  assert.equal(snapshot().roads.find(road => road.id === 'RD-004').risk, 'HIGH');

  const registration = registry.registerMaintenanceTeam({ name: 'Integration Test Crew', specialty: 'Road Obstruction', crew: '3', etaMin: '10' });
  assert.equal(registration.error, null);
  assert.ok(registry.getTeams().some(team => team.id === registration.team.id));
  response.acknowledgeIncident(created.incident.id);
  response.assignTeam(created.incident.id, registration.team.id);
  assert.equal(snapshot().incidents.find(item => item.id === created.incident.id).team.id, registration.team.id);
  response.dispatchTeam(created.incident.id);
  response.closeRoad(created.incident.id);
  response.startMaintenance(created.incident.id);
  response.resolveIncident(created.incident.id);
  assert.equal(overview().stats.openIncidents, initialOpen);
  assert.ok(!overview().hazards.some(item => item.id === created.incident.id));
  assert.equal(snapshot().incidents.find(item => item.id === created.incident.id).status, 'Resolved');
  assert.equal(snapshot().roads.find(road => road.id === 'RD-004').risk, 'WATCH');
  response.reopenRoad(created.incident.id);
  assert.equal(snapshot().incidents.find(item => item.id === created.incident.id).isOpen, false);

  const treeBefore = snapshot().trees.find(tree => tree.id === 'TR-204');
  assert.equal(treeBefore.roadId, 'RD-002');
  assert.equal(snapshot().incidents.find(item => item.id === 'RG-002').risk, treeBefore.risk);
  await trees.treeApi.addInspection('TR-204', { date: '2026-10-21', inspector: 'Test inspector', notes: 'Improved conditions', health: 'Good', soil: 'Normal', tilt: 0 });
  const treeAfter = snapshot().trees.find(tree => tree.id === 'TR-204');
  assert.equal(treeAfter.risk, 'SAFE');
  assert.equal(snapshot().incidents.find(item => item.id === 'RG-002').risk, treeAfter.risk);
  assert.equal(overview().roadRiskEvidence.find(item => item.id === 'RG-002').tree.riskScore, treeAfter.riskScore);
  assert.equal(snapshot().roads.find(road => road.id === 'RD-002').risk, 'HIGH', 'Other tree risk still applies');
  assert.equal(snapshot().roads.find(road => road.id === 'RD-001').floodScore, 87);
  assert.equal(snapshot().roads.find(road => road.id === 'RD-001').floodRisk, 'CRITICAL');
  assert.equal(overview().distribution.reduce((sum, item) => sum + item.value, 0), snapshot().roads.length);

  await server.close();
  modules = await load();
  const reloaded = modules.shared.getSharedData();
  assert.equal(reloaded.incidents.find(item => item.id === created.incident.id).status, 'Road reopened');
  assert.equal(reloaded.incidents.find(item => item.id === created.incident.id).isOpen, false);
  assert.equal(reloaded.trees.find(item => item.id === 'TR-204').risk, 'SAFE');
  assert.ok(modules.registry.getTeams().some(team => team.id === registration.team.id));
  assert.equal(modules.dashboard.buildDashboard(reloaded).stats.openIncidents, initialOpen);
  console.log('Shared data checks passed: references, same-tab creation, deduplication, response workflow, map/count consistency, registered-team assignment, tree updates, flood risk, and reload persistence.');
} finally {
  await server?.close();
  delete globalThis.localStorage;
  delete globalThis.window;
}
