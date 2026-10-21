import { lazy, Suspense, useState } from 'react';
import { Activity, AlertTriangle, ClipboardList, ShieldAlert, Clock3, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RiskMap from '../components/RiskMap';
import IncidentCard from '../components/IncidentCard';
import HazardSummary from '../components/HazardSummary';
import RecentIncidents from '../components/RecentIncidents';
import RoadRiskEvidence from '../components/RoadRiskEvidence';
import ResilienceWorkflow from '../components/ResilienceWorkflow';
import { useDashboard } from '../utils/dashboard';
import { weather } from '../utils/sharedData';

const RiskStatus = lazy(() => import('../components/RiskStatus'));
const cards = [
  { label: 'Active Hazards', metric: 'activeHazards', description: 'Includes core climate hazards and extended detections', icon: AlertTriangle, note: 'All capabilities' },
  { label: 'Critical Roads', metric: 'criticalRoads', description: 'Immediate management attention required', icon: ShieldAlert, note: 'Priority response' },
  { label: 'Roads Under Watch', metric: 'watchRoads', description: 'Elevated road-level monitoring', icon: Activity, note: 'Across township' },
  { label: 'Open Incidents', metric: 'openIncidents', description: 'Awaiting action or resolution across capabilities', icon: ClipboardList, note: 'All capabilities' },
];

export default function Overview() {
  const { stats, coreHazardSummaries, extendedHazardSummaries, corePriorityHazards, extendedPriorityHazards, coreRecentIncidents, roadRiskEvidence } = useDashboard();
  const [roadFocus, setRoadFocus] = useState({ risk: 'ALL', request: 0 });
  function focusRoadRisk(risk) {
    setRoadFocus(previous => ({ risk, request: previous.request + 1 }));
  }
  const updated = new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(weather.updatedAt));
  return (
    <>
      <PageHeader title="Township Overview" description="Earlier road-level visibility and prioritisation of weather-related hazards.">
        <div className="heading-meta">
          <span className="simulation-badge">DEMO MODE — SIMULATED DATA</span>
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-400"><Clock3 size={12} />Demo snapshot: {updated} MYT</span>
        </div>
      </PageHeader>
      <section className="panel mb-6 p-5" aria-labelledby="resilience-heading">
        <p className="eyebrow">PLANET · Climate resilience</p>
        <h2 id="resilience-heading" className="mt-2">Safe2Go — Township Road Climate Resilience &amp; Hazard Intelligence Platform</h2>
        <p className="mt-3 text-sm text-neutral-500">Township management needs earlier, road-level visibility and prioritisation of weather-related hazards before and while roads become unsafe.</p>
        <p className="mt-3 text-xs text-neutral-500">Flooding and weather-related tree instability are the core focus. Combine source context, physical verification and management priorities into one road-risk picture.</p>
      </section>
      <div className="overview-context">
        <span>{corePriorityHazards.length} active core climate hazards · {extendedPriorityHazards.length} extended detections</span>
        <span className="flex items-center gap-2"><CloudRain size={14} />{weather.temperatureC}°C · {weather.condition}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(card => <StatCard key={card.metric} {...card} value={stats[card.metric]} />)}</div>
      <section aria-labelledby="hazard-summaries-heading" className="mt-6">
        <h2 id="hazard-summaries-heading" className="mb-3">Core climate hazards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{coreHazardSummaries.map(summary => <HazardSummary key={summary.id} {...summary} />)}</div>
      </section>
      <RoadRiskEvidence incidents={roadRiskEvidence} weather={weather} />
      <div className="dashboard-grid"><RiskMap roadFocus={roadFocus} onRoadRiskChange={focusRoadRisk} /><Suspense fallback={<section className="panel p-5 text-sm text-neutral-500" role="status">Loading risk distribution…</section>}><RiskStatus selectedRisk={roadFocus.risk} onSelectRisk={focusRoadRisk} /></Suspense></div>
      <section className="panel overflow-hidden" aria-labelledby="priority-hazards-heading">
        <div className="panel-heading"><div><h2 id="priority-hazards-heading">Climate hazard priorities</h2><p>{corePriorityHazards.length} active core hazards · highest risk first</p></div><Link className="detail-link" to="/incidents">Response center</Link></div>
        <div className="overflow-x-auto"><table>
          <caption className="sr-only">Simulated core climate hazards, highest risk first and newest detections first within each risk level</caption>
          <thead><tr>{['Location', 'Hazard Type', 'Risk Level', 'Current Status', 'Action'].map(label => <th key={label} scope="col" className={label === 'Action' ? 'text-right' : ''}>{label}</th>)}</tr></thead>
          <tbody>{corePriorityHazards.length ? corePriorityHazards.map(incident => <IncidentCard key={incident.id} incident={incident} />) : <tr><td colSpan={5} className="text-center">No active core climate hazards are recorded.</td></tr>}</tbody>
        </table></div>
        <p className="table-footer">Supplied demo risk levels determine priority; this is not a live prediction model.</p>
      </section>
      <RecentIncidents incidents={coreRecentIncidents} title="Recent climate incidents" />
      <ResilienceWorkflow />
      <section className="mt-6" aria-labelledby="extended-capability-heading">
        <h2 id="extended-capability-heading">Extended capability: Road Vision damage detection</h2>
        <p className="mt-2 mb-3 text-xs text-neutral-500">Potholes and road-surface damage support maintenance operations. They are separate from Safe2Go's core climate-resilience problem.</p>
        {extendedHazardSummaries.map(summary => <HazardSummary key={summary.id} {...summary} />)}
        <ul className="mt-3 space-y-2 text-xs text-neutral-500">{extendedPriorityHazards.map(incident => <li key={incident.id}>{incident.id} · {incident.location} · {incident.type} · {incident.risk}{incident.originalSeverity && ` · Original severity: ${incident.originalSeverity}`}</li>)}</ul>
      </section>
    </>
  );
}
