import { LayoutDashboard, CloudRain, Trees, Camera, ClipboardList } from 'lucide-react';

export const navigation = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/flood', label: 'Flood & Weather', icon: CloudRain },
  { path: '/trees', label: 'Tree Risk & Registry', icon: Trees },
  { path: '/vision', label: 'Road Vision', icon: Camera },
  { path: '/incidents', label: 'Incident & Response Center', icon: ClipboardList },
];
