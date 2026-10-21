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
  assigned: 'Team assigned',
  dispatched: 'Team dispatched',
  road_closed: 'Road closed',
  in_progress: 'Maintenance started',
  resolved: 'Resolved',
  reopened: 'Road reopened',
  notified: 'Residents notified',
};

export const minutesLabel = minutes => (minutes == null ? '—' : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`);
