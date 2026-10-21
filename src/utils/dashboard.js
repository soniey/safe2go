import { useMemo } from 'react';
import { riskLevels } from './risk';
import { useSharedData } from './sharedData';

export function buildDashboard({ roads, incidents, floodReadings, trees, cameras }) {
  // Use the same workflow rule for the count, priority table, and map markers.
  function getActiveIncidents(records) {
    return records.filter(incident => (typeof incident.isOpen === 'boolean' ? incident.isOpen : !['resolved', 'road reopened'].includes(incident.status?.trim().toLowerCase())));
  }

  const hazards = getActiveIncidents(incidents).map(incident => ({ ...incident, location: roads.find(road => road.id === incident.roadId)?.name ?? 'Unknown road' }));
  const distribution = riskLevels.map(risk => ({ name: risk, value: roads.filter(road => road.risk === risk).length }));
  const overallRisk = [...riskLevels].reverse().find(risk => roads.some(road => road.risk === risk));
  const stats = {
    activeHazards: hazards.length,
    criticalRoads: roads.filter(road => road.risk === 'CRITICAL').length,
    watchRoads: roads.filter(road => road.risk === 'WATCH').length,
    openIncidents: getActiveIncidents(incidents).length,
  };

  const hazardGroups = [
    { id: 'flood', title: 'Flooding & rising water', scope: 'core', types: ['Flood', 'Standing Water'], to: '/flood', description: 'Monitor water levels and flood risk before and while roads become unsafe.' },
    { id: 'trees', title: 'Weather-related tree risk', scope: 'core', types: ['Tree Fall Risk'], to: '/trees', description: 'Prioritise inspections using tree vulnerability and soil conditions.' },
    { id: 'verification', title: 'Climate-hazard verification', scope: 'verification', types: ['Fallen Tree', 'Fallen Branch', 'Road Obstruction', 'Road Blockage', 'Obstruction'], to: '/vision', description: 'Verify fallen trees, branches and obstructions through Road Vision.' },
    { id: 'roads', title: 'Road damage', scope: 'extended', types: ['Pothole', 'Road Surface Damage'], to: '/vision', description: 'Extended Road Vision detections; separate from the core climate-risk focus.' },
  ];
  function getHazardSummaries(records) {
    const active = getActiveIncidents(records);
    return hazardGroups.map(group => {
      const matches = active.filter(incident => group.types.includes(incident.type) && (group.scope !== 'verification' || incident.weatherRelated === true));
      const highestRisk = [...riskLevels].reverse().find(risk => matches.some(incident => incident.risk === risk)) ?? null;
      return { ...group, count: matches.length, highestRisk };
    });
  }

  const hazardSummaries = getHazardSummaries(hazards);

  // Include resolved records in recent history; they remain excluded from active hazards.
  function getRecentIncidents(records, limit = 5) {
    return records
      .filter(incident => incident.detectedAt && Number.isFinite(Date.parse(incident.detectedAt)))
      .slice()
      .sort((left, right) => Date.parse(right.detectedAt) - Date.parse(left.detectedAt) || left.id.localeCompare(right.id))
      .slice(0, limit);
  }

  const recentIncidents = getRecentIncidents(incidents).map(incident => ({
    ...incident,
    location: roads.find(road => road.id === incident.roadId)?.name ?? 'Unknown road',
  }));

  function detectionTimestamp(incident) {
    const timestamp = Date.parse(incident.detectedAt);
    return Number.isFinite(timestamp) ? timestamp : -Infinity;
  }

  function getPriorityHazards(records) {
    return getActiveIncidents(records).sort((left, right) => {
      const riskDifference = riskLevels.indexOf(right.risk) - riskLevels.indexOf(left.risk);
      if (riskDifference) return riskDifference;
      const leftTime = detectionTimestamp(left);
      const rightTime = detectionTimestamp(right);
      if (leftTime !== rightTime) return rightTime > leftTime ? 1 : -1;
      return left.id.localeCompare(right.id);
    });
  }

  const priorityHazards = getPriorityHazards(hazards);

  const coreHazardSummaries = hazardSummaries.filter(group => group.scope === 'core' || group.scope === 'verification');
  const extendedHazardSummaries = hazardSummaries.filter(group => group.scope === 'extended');

  function isCoreClimateHazard(incident) {
    return hazardGroups.some(group => (group.scope === 'core' || (group.scope === 'verification' && incident.weatherRelated === true)) && group.types.includes(incident.type));
  }

  const corePriorityHazards = priorityHazards.filter(isCoreClimateHazard);
  const extendedPriorityHazards = priorityHazards.filter(incident =>
    hazardGroups.some(group => group.scope === 'extended' && group.types.includes(incident.type))
  );
  const coreRecentIncidents = getRecentIncidents(incidents.filter(isCoreClimateHazard)).map(incident => ({
    ...incident, location: roads.find(road => road.id === incident.roadId)?.name ?? 'Unknown road',
  }));

  // Source joins explain the demo's supplied risk levels; this is not a prediction model.
  const roadRiskEvidence = corePriorityHazards.map(incident => ({
    ...incident,
    floodReading: floodReadings.find(reading => reading.id === incident.floodReadingId && reading.roadId === incident.roadId),
    tree: trees.find(tree => tree.id === incident.treeId && tree.roadId === incident.roadId),
    camera: cameras.find(camera => camera.id === incident.cameraId && camera.roadId === incident.roadId),
  }));
  return { roads, hazards, distribution, overallRisk, stats, hazardSummaries, recentIncidents, priorityHazards, coreHazardSummaries, extendedHazardSummaries, corePriorityHazards, extendedPriorityHazards, coreRecentIncidents, roadRiskEvidence };
}

export function useDashboard() {
 const data = useSharedData();
 return useMemo(() => buildDashboard(data), [data]);
}
