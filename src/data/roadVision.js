import sharedCameras from './cameras.json';
import roads from './roads.json';

const capture = '2026-10-20T09:55:00+08:00';
const settings = {
  'CAM-02': { status: 'Online', image: '/images/cctv/cam-02-flood.jpg', imageAspect: 2560 / 1389, imageAlt: 'Standing water covering the foreground of a residential road', embeddedAnnotations: true },
  'CAM-03': { status: 'Online', image: '/images/cctv/cam-03-pothole.jpg', imageAspect: 1600 / 893, imageAlt: 'Cracked pothole in the foreground of a residential road', embeddedAnnotations: true },
};
export const cameras = [
  ...sharedCameras.map(camera => ({ ...camera, ...settings[camera.id], status: settings[camera.id]?.status ?? 'Offline' })),
  { id: 'CAM-DEMO-04', roadId: 'RD-004', status: 'Online', image: '/images/cctv/cam-04-fallen-tree.jpg', imageAspect: 1600 / 893, imageAlt: 'Fallen tree across the road with separate branches in the foreground', embeddedAnnotations: true, simulated: true },
  { id: 'CAM-DEMO-05', roadId: 'RD-005', status: 'Offline', simulated: true },
  { id: 'CAM-DEMO-06', roadId: 'RD-006', status: 'Maintenance', simulated: true },
  { id: 'CAM-DEMO-07', roadId: 'RD-002', status: 'Online', image: '/images/cctv/cam-01-normal.jpg', imageAspect: 1600 / 893, imageAlt: 'Clear residential road with no visible hazards', simulated: true },
].map(camera => ({ ...camera, simulated: true, location: roads.find(road => road.id === camera.roadId)?.name ?? 'Unknown road', capturedAt: capture }));

export const detections = [
  { id: 'DET-001', cameraId: 'CAM-02', type: 'Standing Water', confidence: 87, risk: 'CRITICAL', incidentId: 'RG-001', box: { x: 32.6, y: 59.8, width: 42.6, height: 25.2 }, description: 'Simulated standing water covers part of the carriageway. Inspect drainage and restrict access if needed.' },
  { id: 'DET-002', cameraId: 'CAM-03', type: 'Pothole', confidence: 91, risk: 'WATCH', incidentId: 'RG-003', box: { x: 40, y: 63, width: 22, height: 19 }, description: 'Simulated surface damage in the travel lane. Schedule a road surface inspection.' },
  { id: 'DET-003', cameraId: 'CAM-DEMO-04', type: 'Fallen Tree', confidence: 94, risk: 'HIGH', box: { x: 24, y: 46, width: 48, height: 23 }, description: 'A simulated fallen tree obstructs the road. Arrange safe removal by a maintenance crew.' },
  { id: 'DET-004', cameraId: 'CAM-DEMO-04', type: 'Road Blockage', confidence: 89, risk: 'HIGH', box: { x: 61, y: 72, width: 20, height: 19 }, description: 'Simulated debris obstructs the lane. Inspect the site and clear the carriageway.' },
].map(detection => {
  const camera = cameras.find(item => item.id === detection.cameraId);
  return { ...detection, roadId: camera.roadId, location: camera.location, detectedAt: capture, simulated: true };
});
