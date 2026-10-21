import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OctagonAlert, RotateCcw, ChevronRight, HardHat } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import IncidentQueue from '../components/incidents/IncidentQueue';
import IncidentDetail from '../components/incidents/IncidentDetail';
import { useIncidents, resetDemo, isCrewStage } from '../utils/incidentStore';
import { useDemoSession } from '../utils/demoSession';
import '../components/incidents/incidents.css';

export default function Incidents() {
  const incidents = useIncidents();
  const { session } = useDemoSession() || {};
  const isAdmin = session?.type !== 'demo-maintenance';
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState('open');

  // /incidents?incident=RG-002 opens a specific incident (Road Vision already links this way).
  const requested = params.get('incident') || params.get('id');
  const selected = incidents.find(item => item.id === requested) || incidents.find(item => item.isOpen) || incidents[0];
  const select = id => setParams({ incident: id }, { replace: true });

  // Pin the default choice in the URL so the view doesn't jump when that incident is resolved.
  useEffect(() => {
    if (selected && params.get('incident') !== selected.id) setParams({ incident: selected.id }, { replace: true });
  }, [selected, params, setParams]);

  // Arriving from another page (e.g. Road Vision) should start at the top.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // If someone links to a closed incident, show the list it belongs to.
  useEffect(() => {
    if (selected && !selected.isOpen && filter === 'open' && requested === selected.id) setFilter('all');
  }, [selected, requested, filter]);

  const open = incidents.filter(item => item.isOpen);
  const critical = open.filter(item => item.risk === 'CRITICAL');
  const declined = open.filter(item => item.needsReassign);
  const stats = [
    { label: 'Open incidents', value: open.length, note: 'Not yet resolved' },
    { label: 'Need a crew', value: open.filter(item => item.stage === 'detected' || item.stage === 'verified').length, note: declined.length ? `${declined.length} declined, reassign` : 'Not yet assigned', warn: true },
    { label: 'Crews on the job', value: open.filter(item => isCrewStage(item.stage)).length, note: 'Assigned, en route or working' },
    { label: 'Roads closed', value: incidents.filter(item => item.roadClosed).length, note: 'Detour active', alert: true },
  ];

  function reset() {
    resetDemo();
    setFilter('open');
    setParams({}, { replace: true });
  }

  return (
    <div className="inc-page">
      <PageHeader title="Incident & Response Center" description="Turn detected hazards into assigned, tracked and resolved work.">
        <div className="heading-meta">
          <span className="simulation-badge"><span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />{isAdmin ? 'ADMIN WORKSPACE' : 'VIEW ONLY'}</span>
          {isAdmin
            ? <button type="button" className="inc-btn inc-btn-ghost inc-btn-sm" onClick={reset}><RotateCcw size={13} aria-hidden="true" />Reset demo</button>
            : <Link to="/staff" className="inc-btn inc-btn-ghost inc-btn-sm"><HardHat size={13} aria-hidden="true" />My field jobs</Link>}
        </div>
      </PageHeader>

      {!isAdmin && (
        <p className="inc-role-note">You're signed in as <strong>{session?.label || 'Maintenance Team'}</strong>. Admin actions are hidden here; update your jobs on <Link to="/staff">Field Jobs</Link>.</p>
      )}

      {critical.length > 0 && (
        <div className="inc-banner" role="alert">
          <OctagonAlert size={18} aria-hidden="true" />
          <span className="min-w-0"><strong>{critical.length} critical road{critical.length > 1 ? 's' : ''} need{critical.length > 1 ? '' : 's'} response</strong> · {critical.map(item => `${item.location} (${item.type.toLowerCase()})`).join(', ')}</span>
          {selected?.id !== critical[0].id && (
            <button type="button" onClick={() => select(critical[0].id)}>Open {critical[0].id}<ChevronRight size={14} aria-hidden="true" /></button>
          )}
        </div>
      )}

      <div className="inc-stats">
        {stats.map(stat => (
          <div key={stat.label} className={`inc-stat${stat.alert && stat.value ? ' is-alert' : ''}${stat.warn && stat.value ? ' is-warn' : ''}`}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.note}</span>
          </div>
        ))}
      </div>

      <div className="inc-layout">
        <IncidentQueue incidents={incidents} selectedId={selected?.id} onSelect={select} filter={filter} onFilter={setFilter} />
        {selected && <IncidentDetail key={selected.id} incident={selected} canAct={isAdmin} />}
      </div>
    </div>
  );
}
