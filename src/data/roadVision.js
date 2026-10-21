import sharedCameras from './cameras.json';
import roads from './roads.json';

const capture = '2026-10-20T09:55:00+08:00';
export const cameras = sharedCameras.map(camera => ({
  ...camera, location: roads.find(road => road.id === camera.roadId)?.name ?? 'Unknown road',
}));

export const detections = [
  { id: 'DET-001', cameraId: 'CAM-02', type: 'Standing Water', confidence: 87, risk: 'CRITICAL', incidentId: 'RG-001', box: { x: 32.6, y: 59.8, width: 42.6, height: 25.2 }, description: 'Simulated standing water covers part of the carriageway. Inspect drainage and restrict access if needed.' },
  { id: 'DET-002', cameraId: 'CAM-03', type: 'Pothole', confidence: 91, risk: 'WATCH', incidentId: 'RG-003', box: { x: 40, y: 63, width: 22, height: 19 }, description: 'Simulated surface damage in the travel lane. Schedule a road surface inspection.' },
  { id: 'DET-003', cameraId: 'CAM-DEMO-04', type: 'Fallen Tree', confidence: 94, risk: 'HIGH', box: { x: 24, y: 46, width: 48, height: 23 }, description: 'A simulated fallen tree obstructs the road. Arrange safe removal by a maintenance crew.' },
  { id: 'DET-004', cameraId: 'CAM-DEMO-04', type: 'Road Blockage', confidence: 89, risk: 'HIGH', box: { x: 61, y: 72, width: 20, height: 19 }, description: 'Simulated debris obstructs the lane. Inspect the site and clear the carriageway.' },
  { id: 'DET-005', cameraId: 'CAM-05', type: 'Road Blockage', confidence: 92, risk: 'HIGH', box: { x: 51, y: 33, width: 38, height: 43 }, description: 'Simulated roadworks, equipment and barriers occupy one lane. Review traffic controls and maintain a safe route around the work zone.' },
  { id: 'DET-006', cameraId: 'CAM-06', type: 'Road Debris', confidence: 93, risk: 'HIGH', box: { x: 50, y: 59, width: 38, height: 35 }, description: 'Simulated cardboard, rubble and discarded containers obstruct a travel lane. Arrange debris clearance and inspect the road before reopening the lane.' },
  { id: 'DET-007', cameraId: 'CAM-07', type: 'Stopped Vehicle', confidence: 90, risk: 'WATCH', box: { x: 54, y: 43, width: 24, height: 23 }, description: 'A simulated stopped vehicle with its bonnet open partially obstructs the lane, with people beside it. Check occupant safety and coordinate roadside assistance and traffic protection.' },
].map(detection => {
  const camera = cameras.find(item => item.id === detection.cameraId);
  return { ...detection, roadId: camera.roadId, location: camera.location, detectedAt: camera.capturedAt ?? capture, simulated: true };
});
