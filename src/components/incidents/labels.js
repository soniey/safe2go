import { Droplets, Trees, CircleDot, TriangleAlert, Ban } from 'lucide-react';

// Same hazard icons as the shared RiskMap, plus the Road Vision detection types.
const hazardIcons = {
  Flood: Droplets, 'Standing Water': Droplets,
  'Tree Fall Risk': Trees, 'Fallen Tree': Trees, 'Fallen Branch': Trees,
  Pothole: CircleDot, 'Road Surface Damage': CircleDot,
  'Road Blockage': Ban, 'Road Obstruction': Ban, Obstruction: Ban,
};
export const hazardIcon = type => hazardIcons[type] || TriangleAlert;

export const eventLabels = {
  detected: 'Detected',
  verified: 'Verified',
  assigned: 'Crew assigned',
  unassigned: 'Assignment withdrawn',
  declined: 'Crew declined the job',
  accepted: 'Crew accepted',
  dispatched: 'Crew en route',
  on_site: 'Crew arrived on site',
  in_progress: 'Work started',
  resolved: 'Work completed',
  road_closed: 'Road closed',
  reopened: 'Road reopened',
  notified: 'Residents notified',
};

export const minutesLabel = minutes => (minutes == null ? '—' : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`);

// Directions link for crews (coordinates are illustrative demo positions).
export const directionsUrl = coordinates => (coordinates ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}` : null);
