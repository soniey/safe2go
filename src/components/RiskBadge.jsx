import { riskStyles } from '../utils/risk';
export default function RiskBadge({ risk }) {
  return <span className={`risk-badge ${riskStyles[risk].className}`}><span className="risk-dot" />{risk}</span>;
}
