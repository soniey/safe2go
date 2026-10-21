import { useMemo } from 'react';
import seedRoads from '../data/roads.json';
import weather from '../data/weather.json';
import floodReadings from '../data/floodReadings.json';
import floodDemo from '../data/floodDemo.json';
import { cameras, detections } from '../data/roadVision';
import { getIncidents, useIncidents } from './incidentStore';
import { getTrees, useTrees } from './treeRisk';
import { riskLevels } from './risk';

export { weather, floodReadings, floodDemo, cameras, detections };
export const floodRiskFromScore = score => score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'WATCH' : 'SAFE';
const highestRisk = risks => riskLevels[Math.max(0, ...risks.map(risk => riskLevels.indexOf(risk)))];

// Incidents retain their workflow clock internally; pages share the original ISO detection date.
export function selectSharedData(responseIncidents, trees) {
  const incidents = responseIncidents.map(incident => ({ ...incident, detectedAt: incident.detectedAtISO }));
  const floodRoads = seedRoads.map(road => {
    const demo = floodDemo.roads.find(item => item.roadId === road.id);
    const reading = floodReadings.find(item => item.roadId === road.id);
    const score = reading?.floodRiskPercent ?? demo?.demoRiskScore ?? 0;
    return { ...road, floodRisk: floodRiskFromScore(score), floodScore: score };
  });
  const roads = floodRoads.map(road => ({
    ...road,
    // A closed incident does not clear a sensor reading or an uninspected tree.
    risk: highestRisk([
      road.floodRisk,
      ...trees.filter(tree => tree.roadId === road.id).map(tree => tree.risk),
      ...incidents.filter(incident => incident.roadId === road.id && incident.isOpen).map(incident => incident.risk),
    ]),
  }));
  return { roads, incidents, trees, cameras, detections, weather, floodReadings, floodDemo };
}

export function getSharedData() { return selectSharedData(getIncidents(), getTrees()); }

export function useSharedData() {
  const incidents = useIncidents();
  const trees = useTrees();
  return useMemo(() => selectSharedData(incidents, trees), [incidents, trees]);
}
