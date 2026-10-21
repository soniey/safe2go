import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import RiskBadge from './RiskBadge';

export default function RoadRiskEvidence({ incidents, weather }) {
  return (
    <section className="panel mt-6" aria-labelledby="road-intelligence-heading">
      <div className="panel-heading">
        <div><h2 id="road-intelligence-heading">One road-risk picture</h2><p>Shared signals, road-level interpretation, verification needs and next actions.</p></div>
      </div>
      <p className="px-5 pt-4 text-xs text-neutral-500">Weather context: {weather.condition}, {weather.temperatureC}°C. Forecast-driven prediction and a live CCTV pipeline are not connected.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
        {incidents.map(incident => (
          <details key={incident.id} className="group self-start rounded border border-neutral-200"><summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{incident.location}</h3><span className="flex items-center gap-3"><RiskBadge risk={incident.risk} /><ChevronDown size={16} className="shrink-0 text-neutral-500 transition-transform group-open:rotate-180" aria-hidden="true" /></span></div>
            <p className="mt-2 text-xs text-neutral-500">{incident.id} · {incident.type} · {incident.status}</p>
            </summary><div className="border-t border-neutral-200 p-4"><dl className="space-y-3 text-xs">
              <div><dt className="font-semibold">Source context</dt><dd className="mt-1 text-neutral-500">
                {incident.floodReading ? <>
                  Water level <strong className="font-semibold text-neutral-800">{incident.floodReading.waterLevelCm} cm</strong>; supplied flood risk <strong className="font-semibold text-neutral-800">{incident.floodReading.floodRiskPercent}%</strong>.
                </> : incident.tree ? <>
                  Tree <strong className="font-semibold text-neutral-800">{incident.tree.id}</strong>; supplied risk score <strong className="font-semibold text-neutral-800">{incident.tree.riskScore}%</strong>; soil: <strong className="font-semibold text-neutral-800">{incident.tree.soil}</strong>.
                </> : incident.verification?.simulated ? <strong className="font-semibold text-neutral-800">{incident.summary}</strong> : 'Source context is not available.'}
              </dd></div>
              <div><dt className="font-medium">Risk interpretation</dt><dd className="mt-1 text-neutral-500">{incident.floodReading ? 'Rising-water scenario: prioritise a road-condition check and drainage inspection.' : incident.tree ? 'Saturated-soil tree-risk scenario: prioritise a professional stability inspection, not an exact fall-time prediction.' : 'Weather-related branch obstruction: prioritise a physical road-condition check and safe clearance.'}</dd></div>
              <div><dt className="font-medium">Verification needed</dt><dd className="mt-1 text-neutral-500">{incident.verification?.simulated ? `${incident.verification.status} · ${incident.verification.method}.` : incident.camera ? `${incident.camera.id} is linked to this road; no CCTV confirmation is recorded.` : 'No linked camera verification is recorded; arrange a field inspection.'}</dd></div>
              <div><dt className="font-medium">Recommended next action</dt><dd className="mt-1 text-neutral-500">{incident.tree ? 'Review the tree record and prioritise a professional inspection. The full Tree Passport is planned for Tree Risk & Registry.' : 'Verify physical road conditions and prioritise response through the response team.'} These actions have not been dispatched by this prototype.</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-4"><Link className="detail-link" to={incident.tree ? '/trees' : incident.floodReading ? '/flood' : '/vision'}>Source module</Link><Link className="detail-link" to="/vision">Road Vision verification</Link><Link className="detail-link" to="/incidents">Incident &amp; Response Center</Link></div>
          </div></details>
        ))}
      </div>
      {!incidents.length && <p className="p-5 text-xs text-neutral-500">No active core climate hazards are recorded.</p>}
    </section>
  );
}
