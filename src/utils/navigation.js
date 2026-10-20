import { LayoutDashboard, CloudRain, Trees, Camera, ClipboardList } from 'lucide-react';

export const navigation = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/flood', label: 'Flood & Weather', icon: CloudRain },
  { path: '/trees', label: 'Tree Risk', icon: Trees },
  { path: '/vision', label: 'Road Vision', icon: Camera },
  { path: '/incidents', label: 'Incidents', icon: ClipboardList },
];
