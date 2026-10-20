import roads from '../data/roads.json';
import incidents from '../data/incidents.json';
import { riskLevels } from './risk';

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
  { id: 'flood', title: 'Flood hazards', types: ['Flood'], to: '/flood' },
  { id: 'trees', title: 'Tree hazards', types: ['Tree Fall Risk'], to: '/trees' },
  { id: 'roads', title: 'Road-condition hazards', types: ['Pothole', 'Road Obstruction', 'Obstruction'], to: '/vision' },
];

export function getHazardSummaries(records) {
  const active = getActiveIncidents(records);
  return hazardGroups.map(group => {
    const matches = active.filter(incident => group.types.includes(incident.type));
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
