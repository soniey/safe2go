import roads from '../data/roads.json';
import incidents from '../data/incidents.json';
import { riskLevels } from './risk';

export { roads };
export const hazards = incidents.map(incident => ({ ...incident, location: roads.find(road => road.id === incident.roadId).name }));
export const distribution = riskLevels.map(risk => ({ name: risk, value: roads.filter(road => road.risk === risk).length }));
export const overallRisk = [...riskLevels].reverse().find(risk => roads.some(road => road.risk === risk));
export const stats = {
  activeHazards: hazards.length,
  criticalRoads: roads.filter(road => road.risk === 'CRITICAL').length,
  watchRoads: roads.filter(road => road.risk === 'WATCH').length,
  openIncidents: incidents.filter(incident => incident.status !== 'Resolved').length,
};
