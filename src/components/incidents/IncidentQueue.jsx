import { Construction, UserRound, UserX } from 'lucide-react';
import RiskTag from './RiskTag';
import { hazardIcon } from './labels';
import { formatTime, isCrewStage } from '../../utils/incidentStore';

const filters = [
  { id: 'open', label: 'Open', test: incident => incident.isOpen },
  { id: 'closed', label: 'Closed', test: incident => !incident.isOpen },
  { id: 'all', label: 'All', test: () => true },
];

function crewLine(incident) {
  if (incident.needsReassign) return null;
  if (incident.team && isCrewStage(incident.stage)) return `${incident.team.name} · ${incident.stageShort.toLowerCase()}`;
  if (incident.team) return incident.team.name;
  return 'Unassigned';
}

export default function IncidentQueue({ incidents, selectedId, onSelect, filter, onFilter }) {
  const active = filters.find(item => item.id === filter) || filters[0];
  const visible = incidents.filter(active.test);
  return (
    <section className="inc-panel inc-queue" aria-label="Incident queue">
      <div className="inc-panel-head">
        <h2>Incident queue</h2>
        <div className="inc-tabs" role="group" aria-label="Filter incidents">
          {filters.map(item => (
            <button key={item.id} type="button" aria-pressed={item.id === active.id} className={item.id === active.id ? 'is-on' : ''} onClick={() => onFilter(item.id)}>
              {item.label}<span>{incidents.filter(item.test).length}</span>
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="inc-empty">{active.id === 'open' ? 'No open incidents. Every reported hazard has been resolved.' : 'Nothing here yet.'}</p>
      ) : (
        <ul className="inc-queue-list">
          {visible.map(incident => {
            const Icon = hazardIcon(incident.type);
            const selected = incident.id === selectedId;
            return (
              <li key={incident.id}>
                <button type="button" className={`inc-queue-item inc-edge-${incident.risk.toLowerCase()}${selected ? ' is-selected' : ''}${incident.isOpen ? '' : ' is-closed'}`} aria-current={selected ? 'true' : undefined} onClick={() => onSelect(incident.id)}>
                  <span className="inc-queue-top">
                    <span className="inc-mono">{incident.id}</span>
                    <span className="inc-prio">{incident.priority}</span>
                    <span className="inc-mono inc-faint ml-auto">{formatTime(incident.detectedAt)}</span>
                  </span>
                  <span className="inc-queue-road"><Icon size={14} aria-hidden="true" />{incident.location}</span>
                  <span className="inc-queue-meta">
                    <RiskTag risk={incident.risk} />
                    <span className="inc-stage-text">{incident.needsReassign ? 'Verified' : incident.stageShort}</span>
                  </span>
                  <span className="inc-queue-team">
                    {incident.needsReassign
                      ? <span className="inc-declined-chip"><UserX size={11} aria-hidden="true" />Declined, reassign</span>
                      : <><UserRound size={12} aria-hidden="true" />{crewLine(incident)}</>}
                    {incident.roadClosed && <span className="inc-closed-chip"><Construction size={11} aria-hidden="true" />Road closed</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
