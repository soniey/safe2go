import roads from '../data/roads.json';
import incidents from '../data/incidents.json';
import { riskLevels } from './risk';
import floodReadings from '../data/floodReadings.json';
import trees from '../data/trees.json';
import cameras from '../data/cameras.json';

export { roads };

// Use the same workflow rule for the count, priority table, and map markers.
export function getActiveIncidents(records) {
  return records.filter(incident => incident.status?.trim().toLowerCase() !== 'resolved');
}

export const hazards = getActiveIncidents(incidents).map(incident => ({ ...incident, location: roads.find(road => road.id === incident.roadId)?.name ?? 'Unknown road' }));
export const distribution = riskLevels.map(risk => ({ name: risk, value: roads.filter(road => road.risk === risk).length }));
export const overallRisk = [...riskLevels].reverse().find(risk => roads.some(road => road.risk === risk));
export const stats = {
  activeHazards: hazards.length,
  criticalRoads: roads.filter(road => road.risk === 'CRITICAL').length,
  watchRoads: roads.filter(road => road.risk === 'WATCH').length,
  openIncidents: getActiveIncidents(incidents).length,
};

const hazardGroups = [
  { id: 'flood', title: 'Flooding & rising water', scope: 'core', types: ['Flood'], to: '/flood', description: 'Monitor water levels and flood risk before and while roads become unsafe.' },
  { id: 'trees', title: 'Weather-related tree risk', scope: 'core', types: ['Tree Fall Risk'], to: '/trees', description: 'Prioritise inspections using tree vulnerability and soil conditions.' },
  { id: 'verification', title: 'Climate-hazard verification', scope: 'verification', types: ['Fallen Tree', 'Fallen Branch', 'Road Obstruction', 'Obstruction'], to: '/vision', description: 'Verify fallen trees, branches and obstructions through Road Vision.' },
  { id: 'roads', title: 'Road damage', scope: 'extended', types: ['Pothole', 'Road Surface Damage'], to: '/vision', description: 'Extended Road Vision detections; separate from the core climate-risk focus.' },
];
export function getHazardSummaries(records) {
  const active = getActiveIncidents(records);
  return hazardGroups.map(group => {
    const matches = active.filter(incident => group.types.includes(incident.type) && (group.scope !== 'verification' || incident.weatherRelated === true));
    const highestRisk = [...riskLevels].reverse().find(risk => matches.some(incident => incident.risk === risk)) ?? null;
    return { ...group, count: matches.length, highestRisk };
  });
}

export const hazardSummaries = getHazardSummaries(hazards);

// Include resolved records in recent history; they remain excluded from active hazards.
export function getRecentIncidents(records, limit = 5) {
  return records
    .filter(incident => incident.detectedAt && Number.isFinite(Date.parse(incident.detectedAt)))
    .slice()
    .sort((left, right) => Date.parse(right.detectedAt) - Date.parse(left.detectedAt) || left.id.localeCompare(right.id))
    .slice(0, limit);
}

export const recentIncidents = getRecentIncidents(incidents).map(incident => ({
  ...incident,
  location: roads.find(road => road.id === incident.roadId)?.name ?? 'Unknown road',
}));

function detectionTimestamp(incident) {
  const timestamp = Date.parse(incident.detectedAt);
  return Number.isFinite(timestamp) ? timestamp : -Infinity;
}

export function getPriorityHazards(records) {
  return getActiveIncidents(records).sort((left, right) => {
    const riskDifference = riskLevels.indexOf(right.risk) - riskLevels.indexOf(left.risk);
    if (riskDifference) return riskDifference;
    const leftTime = detectionTimestamp(left);
    const rightTime = detectionTimestamp(right);
    if (leftTime !== rightTime) return rightTime > leftTime ? 1 : -1;
    return left.id.localeCompare(right.id);
  });
}

export const priorityHazards = getPriorityHazards(hazards);

export const coreHazardSummaries = hazardSummaries.filter(group => group.scope === 'core' || group.scope === 'verification');
export const extendedHazardSummaries = hazardSummaries.filter(group => group.scope === 'extended');

export function isCoreClimateHazard(incident) {
  return hazardGroups.some(group => (group.scope === 'core' || (group.scope === 'verification' && incident.weatherRelated === true)) && group.types.includes(incident.type));
}

export const corePriorityHazards = priorityHazards.filter(isCoreClimateHazard);
export const extendedPriorityHazards = priorityHazards.filter(incident =>
  hazardGroups.some(group => group.scope === 'extended' && group.types.includes(incident.type))
);
export const coreRecentIncidents = getRecentIncidents(incidents.filter(isCoreClimateHazard)).map(incident => ({
  ...incident, location: roads.find(road => road.id === incident.roadId)?.name ?? 'Unknown road',
}));

// Source joins explain the demo's supplied risk levels; this is not a prediction model.
export const roadRiskEvidence = corePriorityHazards.map(incident => ({
  ...incident,
  floodReading: floodReadings.find(reading => reading.id === incident.floodReadingId && reading.roadId === incident.roadId),
  tree: trees.find(tree => tree.id === incident.treeId && tree.roadId === incident.roadId),
  camera: cameras.find(camera => camera.id === incident.cameraId && camera.roadId === incident.roadId),
}));