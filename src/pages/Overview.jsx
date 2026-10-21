import './overview.css';
import { lazy, Suspense, useState } from 'react';
import { Activity, AlertTriangle, ClipboardList, ShieldAlert, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RiskMap from '../components/RiskMap';
import IncidentCard from '../components/IncidentCard';
import HazardSummary from '../components/HazardSummary';
import RecentIncidents from '../components/RecentIncidents';
import RoadRiskEvidence from '../components/RoadRiskEvidence';
import { useDashboard } from '../utils/dashboard';
import { weather } from '../utils/sharedData';

const RiskStatus = lazy(() => import('../components/RiskStatus'));
const cards = [
  { label: 'Active Hazards', metric: 'activeHazards', tone: 'hazards', description: 'Includes core climate hazards and extended detections', icon: AlertTriangle, note: 'All capabilities' },
  { label: 'Critical Roads', metric: 'criticalRoads', tone: 'critical', description: 'Immediate management attention required', icon: ShieldAlert, note: 'Priority response' },
  { label: 'Roads Under Watch', metric: 'watchRoads', tone: 'watch', description: 'Elevated road-level monitoring', icon: Activity, note: 'Across township' },
  { label: 'Open Incidents', metric: 'openIncidents', tone: 'incidents', description: 'Awaiting action or resolution across capabilities', icon: ClipboardList, note: 'All capabilities' },
];

export default function Overview() {
  const { stats, coreHazardSummaries, extendedHazardSummaries, corePriorityHazards, extendedPriorityHazards, coreRecentIncidents, roadRiskEvidence } = useDashboard();
  const [roadFocus, setRoadFocus] = useState({ risk: 'ALL', request: 0 });
  function focusRoadRisk(risk) {
    setRoadFocus(previous => ({ risk, request: previous.request + 1 }));
  }
  return (
    <>
      <PageHeader title="Township Overview" description="Monitor township road risks, prioritise incidents and coordinate a faster response.">
        <div className="heading-meta">
          <span className="simulation-badge">DEMO MODE — SIMULATED DATA</span>
        </div>
      </PageHeader>
      <div className="overview-context">
        <span>{corePriorityHazards.length} active core climate hazards · {extendedPriorityHazards.length} extended detections</span>
        <span className="overview-weather flex items-center gap-2"><CloudRain size={18} />{weather.temperatureC}°C · {weather.condition}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(card => <div key={card.metric} className={`overview-metric overview-metric-${card.tone}`}><StatCard {...card} value={stats[card.metric]} /></div>)}</div>
      <section aria-labelledby="hazard-summaries-heading" className="mt-6">
        <h2 id="hazard-summaries-heading" className="mb-3">Hazard overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{[...coreHazardSummaries, ...extendedHazardSummaries].map(summary => <HazardSummary key={summary.id} {...summary} />)}</div>
      </section>
      <RoadRiskEvidence incidents={roadRiskEvidence} weather={weather} />
      <div className="dashboard-grid"><RiskMap roadFocus={roadFocus} onRoadRiskChange={focusRoadRisk} /><Suspense fallback={<section className="panel p-5 text-sm text-neutral-500" role="status">Loading risk distribution…</section>}><RiskStatus selectedRisk={roadFocus.risk} onSelectRisk={focusRoadRisk} /></Suspense></div>
      <section className="panel overflow-hidden" aria-labelledby="priority-hazards-heading">
        <div className="panel-heading"><div><h2 id="priority-hazards-heading">Climate hazard priorities</h2><p>{corePriorityHazards.length} active core hazards · highest risk first</p></div><Link className="detail-link" to="/incidents">Response center</Link></div>
        <div className="overflow-x-auto"><table className="overview-priority-table">
          <caption className="sr-only">Simulated core climate hazards, highest risk first and newest detections first within each risk level</caption>
          <thead><tr>{['Location', 'Hazard Type', 'Risk Level', 'Current Status', 'Action'].map(label => <th key={label} scope="col" className={label === 'Action' ? 'text-right' : ''}>{label}</th>)}</tr></thead>
          <tbody>{corePriorityHazards.length ? corePriorityHazards.map(incident => <IncidentCard key={incident.id} incident={incident} />) : <tr><td colSpan={5} className="text-center">No active core climate hazards are recorded.</td></tr>}</tbody>
        </table></div>
        <p className="table-footer">Supplied demo risk levels determine priority; this is not a live prediction model.</p>
      </section>
      <RecentIncidents incidents={coreRecentIncidents} title="Recent climate incidents" />
    </>
  );
}
