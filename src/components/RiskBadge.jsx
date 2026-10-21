import { CircleCheck, Eye, TriangleAlert, OctagonAlert } from 'lucide-react';
import { riskStyles } from '../utils/risk';

// One risk badge for every page: colour + icon + word, so the level still reads without colour.
const icons = { SAFE: CircleCheck, WATCH: Eye, HIGH: TriangleAlert, CRITICAL: OctagonAlert };

export default function RiskBadge({ risk, large = false }) {
  const style = riskStyles[risk];
  if (!style) return <span className="risk-badge">{risk}</span>;
  const Icon = icons[risk];
  return <span className={`risk-badge ${style.className}${large ? ' risk-badge-lg' : ''}`}><Icon size={large ? 14 : 12} strokeWidth={2.2} aria-hidden="true" />{style.label}</span>;
}
