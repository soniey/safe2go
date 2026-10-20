import sharedIncidents from '../data/incidents.json';
import { detections } from '../data/roadVision';

export const INCIDENT_STORAGE_KEY = 'safe2go.roadVision.incidents.v1';
const risks = ['SAFE', 'WATCH', 'HIGH', 'CRITICAL'];
function validIncident(record) {
  const detection = detections.find(item => item.id === record?.detectionId);
  return detection && typeof record.id === 'string' && /^RG-RV-\d+$/.test(record.id) &&
    record.cameraId === detection.cameraId && record.roadId === detection.roadId &&
    record.type === detection.type && record.location === detection.location &&
    risks.includes(record.risk) && record.risk === detection.risk &&
    record.source === 'Road Vision' && typeof record.status === 'string' && record.status.length > 0 &&
    Number.isFinite(Date.parse(record.detectedAt)) && record.detectionConfidence === detection.confidence;
}

export function readRoadVisionIncidents(storage = window.localStorage) {
  const raw = storage.getItem(INCIDENT_STORAGE_KEY);
  if (raw === null) return [];
  const records = JSON.parse(raw);
  if (!Array.isArray(records) || !records.every(validIncident)) throw new Error('Stored Road Vision incidents are invalid. Saved data was left unchanged.');
  if (new Set(records.map(record => record.id)).size !== records.length || new Set(records.map(record => record.detectionId)).size !== records.length) throw new Error('Stored incidents contain duplicates. Saved data was left unchanged.');
  return records;
}

export function findIncident(detection, stored = []) {
  return [...sharedIncidents, ...stored].find(incident => incident.id === detection.incidentId || incident.detectionId === detection.id ||
    (incident.cameraId === detection.cameraId && incident.roadId === detection.roadId && incident.type === detection.type && incident.detectedAt === detection.detectedAt));
}

export function createRoadVisionIncident(detectionId, storage = window.localStorage) {
  const detection = detections.find(item => item.id === detectionId);
  if (!detection) throw new Error('Select a valid detection first.');
  const records = readRoadVisionIncidents(storage);
  const existing = findIncident(detection, records);
  if (existing) return { incident: existing, created: false };
  const used = new Set([...sharedIncidents, ...records].map(record => record.id));
  let sequence = 1;
  while (used.has(`RG-RV-${String(sequence).padStart(3, '0')}`)) sequence++;
  const incident = {
    id: `RG-RV-${String(sequence).padStart(3, '0')}`, detectionId: detection.id,
    type: detection.type, roadId: detection.roadId, location: detection.location,
    cameraId: detection.cameraId, risk: detection.risk, detectedAt: detection.detectedAt,
    detectionConfidence: detection.confidence, status: 'Detected', source: 'Road Vision',
    summary: detection.description, simulated: true,
  };
  storage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify([...records, incident]));
  return { incident, created: true };
}
