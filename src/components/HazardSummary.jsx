import { Link } from 'react-router-dom';
import RiskBadge from './RiskBadge';

export default function HazardSummary({ title, count, highestRisk, to }) {
  return (
    <article className="panel p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-3 text-sm text-neutral-500">
        <strong className="text-neutral-800">{count}</strong> active {count === 1 ? 'hazard' : 'hazards'}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
        {highestRisk ? <><span>Highest risk</span><RiskBadge risk={highestRisk} /></> : <span>No active hazards</span>}
      </div>
      <Link className="detail-link mt-4" to={to}>Open module</Link>
    </article>
  );
}
