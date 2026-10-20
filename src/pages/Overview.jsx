import { Activity, AlertTriangle, ClipboardList, ShieldAlert, Clock3, ArrowUpRight, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RiskMap from '../components/RiskMap';
import { lazy, Suspense } from 'react';
import IncidentCard from '../components/IncidentCard';
import { hazards, stats } from '../utils/dashboard';
import weather from '../data/weather.json';

const RiskStatus = lazy(() => import('../components/RiskStatus'));

const cards = [
  { label: 'Active Hazards', metric: 'activeHazards', description: 'Requires monitoring or response', icon: AlertTriangle, note: 'Across township' },
  { label: 'Critical Roads', metric: 'criticalRoads', description: 'Immediate attention required', icon: ShieldAlert, note: 'Priority response' },
  { label: 'Roads Under Watch', metric: 'watchRoads', description: 'Elevated monitoring', icon: Activity, note: 'Stay informed' },
  { label: 'Open Incidents', metric: 'openIncidents', description: 'Awaiting action or resolution', icon: ClipboardList, note: 'In the queue' },
];
export default function Overview() {
  const updated = new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(weather.updatedAt));
  return <><PageHeader title="Township Overview" description="Real-time road hazard intelligence and operational monitoring."><div className="heading-meta"><span className="simulation-badge"><span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />SIMULATED DATA</span><span className="flex items-center gap-1.5 text-[11px] text-neutral-400"><Clock3 size={12} />Last Updated: {updated} MYT</span></div></PageHeader><div className="overview-context"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Township monitoring overview</span><span className="flex items-center gap-2"><CloudRain size={14} />{weather.temperatureC}&deg;C<span className="text-neutral-300">/</span>{weather.condition}<span className="text-neutral-400">(simulated)</span></span></div><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(card => <StatCard key={card.metric} {...card} value={stats[card.metric]} />)}</div><div className="dashboard-grid"><RiskMap /><Suspense fallback={<section className="panel p-5 text-sm text-neutral-500" role="status">Loading risk distribution…</section>}><RiskStatus /></Suspense></div><section className="panel overflow-hidden"><div className="panel-heading"><div className="flex items-center gap-2.5"><h2>Priority Hazards</h2><span className="count-badge">{hazards.length}</span></div><Link className="detail-link" to="/incidents">All incidents<ArrowUpRight size={14} /></Link></div><div className="overflow-x-auto"><table><caption className="sr-only">Simulated priority road hazards</caption><thead><tr>{['Location', 'Hazard Type', 'Risk Level', 'Current Status', 'Action'].map(label => <th key={label} scope="col" className={label === 'Action' ? 'text-right' : ''}>{label}</th>)}</tr></thead><tbody>{hazards.map(incident => <IncidentCard key={incident.id} incident={incident} />)}</tbody></table></div><div className="table-footer"><span className="flex items-center gap-1.5"><ShieldAlert size={13} />Early awareness. Coordinated response.</span><span>Showing {hazards.length} priority hazards</span></div></section></>;
}
