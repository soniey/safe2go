import { CircleCheck, Eye, TriangleAlert, OctagonAlert } from 'lucide-react';

// Colour + icon + word, so the level reads without colour (projector, colour-blind users).
const levels = {
  SAFE: { icon: CircleCheck, label: 'Safe' },
  WATCH: { icon: Eye, label: 'Watch' },
  HIGH: { icon: TriangleAlert, label: 'High' },
  CRITICAL: { icon: OctagonAlert, label: 'Critical' },
};

export default function RiskTag({ risk, large = false }) {
  const { icon: Icon, label } = levels[risk] || levels.WATCH;
  return (
    <span className={`inc-risk inc-risk-${risk.toLowerCase()}${large ? ' inc-risk-lg' : ''}`}>
      <Icon size={large ? 14 : 12} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}
