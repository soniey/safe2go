import { useState } from 'react';
import { CheckCheck, Users, Truck, Wrench, CircleCheck, Route, Construction, Lightbulb, FileSearch } from 'lucide-react';
import RiskTag from './RiskTag';
import ResponseProgress from './ResponseProgress';
import IncidentTimeline from './IncidentTimeline';
import ResidentAlertPreview from './ResidentAlertPreview';
import AssignTeamModal from './AssignTeamModal';
import { hazardIcon, minutesLabel } from './labels';
import { acknowledgeIncident, dispatchTeam, startMaintenance, resolveIncident, closeRoad, reopenRoad, formatTime } from '../../utils/incidentStore';

// The one main action for each stage, so management always knows the next step.
function nextAction(incident, openAssign) {
  const id = incident.id;
  switch (incident.stage) {
    case 'detected': return { label: 'Acknowledge', icon: CheckCheck, run: () => acknowledgeIncident(id), hint: 'Confirm the hazard is real before sending a crew.' };
    case 'verified': return { label: 'Assign team', icon: Users, run: openAssign, hint: 'Pick the crew that will handle this.' };
    case 'assigned': return { label: 'Dispatch team', icon: Truck, run: () => dispatchTeam(id), hint: `${incident.team?.name} is waiting for the go-ahead.` };
    case 'dispatched': return { label: 'Start maintenance', icon: Wrench, run: () => startMaintenance(id), hint: 'Mark when the crew arrives on site.' };
    case 'in_progress': return { label: 'Resolve incident', icon: CircleCheck, run: () => resolveIncident(id), hint: 'Confirm the hazard has been cleared.' };
    case 'resolved': return incident.roadClosed ? { label: 'Reopen road', icon: Route, run: () => reopenRoad(id), hint: 'Remove barriers and lift the detour.' } : null;
    default: return null;
  }
}

export default function IncidentDetail({ incident, incidents }) {
  const [assignOpen, setAssignOpen] = useState(false);
  const Icon = hazardIcon(incident.type);
  const action = nextAction(incident, () => setAssignOpen(true));
  const closedAt = [...incident.timeline].reverse().find(event => event.type === 'road_closed')?.at;

  const facts = [
    { label: 'Priority', value: incident.priority },
    { label: 'Detected', value: formatTime(incident.detectedAt), mono: true },
    { label: 'Assigned team', value: incident.team?.name || 'Unassigned', muted: !incident.team },
    { label: 'Response time', value: incident.responseMinutes != null ? minutesLabel(incident.responseMinutes) : incident.isOpen ? 'Not dispatched' : '—', muted: incident.responseMinutes == null },
    { label: 'Road status', value: incident.roadClosed ? `Closed ${formatTime(closedAt)}` : 'Open to traffic', alert: incident.roadClosed },
    { label: incident.isOpen ? 'Open for' : 'Time to resolve', value: minutesLabel(incident.openMinutes) },
  ];

  return (
    <div className="inc-detail-wrap">
    <div className="inc-detail">
      <section className={`inc-panel inc-docket inc-edge-${incident.risk.toLowerCase()}`} aria-labelledby="incident-title">
        <header className="inc-docket-head">
          <span className={`inc-hazard-icon inc-tint-${incident.risk.toLowerCase()}`}><Icon size={20} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="inc-mono inc-faint">{incident.id} · {incident.type}</p>
            <h2 id="incident-title">{incident.location}</h2>
            {incident.summary && incident.summary !== incident.whyFlagged && <p className="inc-summary">{incident.summary}</p>}
          </div>
          <div className="inc-docket-status">
            <RiskTag risk={incident.risk} large />
            <span className={`inc-stage-pill${incident.isOpen ? '' : ' is-done'}`}>{incident.stageLabel}</span>
          </div>
        </header>

        <div className="inc-why">
          <p className="inc-label"><FileSearch size={13} aria-hidden="true" />Why it was flagged</p>
          <p>{incident.whyFlagged}</p>
          {incident.evidence.length > 0 && (
            <ul className="inc-evidence">
              {incident.evidence.map(item => <li key={item.source}><span>{item.source}</span>{item.value}</li>)}
            </ul>
          )}
        </div>

        <dl className="inc-facts">
          {facts.map(fact => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd className={`${fact.mono ? 'inc-mono' : ''}${fact.muted ? ' inc-faint' : ''}${fact.alert ? ' inc-text-alert' : ''}`}>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="inc-section">
          <p className="inc-label">Response progress</p>
          <ResponseProgress incident={incident} />
        </div>
      </section>

      <div className="inc-side">
        <section className="inc-card inc-actions" aria-label="Actions">
          <div className="inc-card-head"><h3>Next step</h3></div>
          {(incident.stage === 'detected' || incident.stage === 'verified') && incident.recommendedAction && (
            <p className="inc-reco"><Lightbulb size={14} aria-hidden="true" /><span><strong>Recommended:</strong> {incident.recommendedAction}</span></p>
          )}
          {action ? (
            <>
              <button type="button" className="inc-btn inc-btn-primary w-full" onClick={action.run}>
                <action.icon size={16} aria-hidden="true" />{action.label}
              </button>
              <p className="inc-hint">{action.hint}</p>
            </>
          ) : (
            <p className="inc-done"><CircleCheck size={16} aria-hidden="true" />Incident closed. Recorded in the township log.</p>
          )}
          {incident.isOpen && !incident.roadClosed && (
            <button type="button" className="inc-btn inc-btn-danger w-full" onClick={() => closeRoad(incident.id)}>
              <Construction size={15} aria-hidden="true" />Close road
            </button>
          )}
          {incident.roadClosed && (
            <p className="inc-barrier"><Construction size={14} aria-hidden="true" />Road closed since <span className="inc-mono">{formatTime(closedAt)}</span></p>
          )}
        </section>

        <ResidentAlertPreview incident={incident} />
      </div>

      <section className="inc-panel inc-history" aria-label="Incident log">
        <div className="inc-panel-head"><h2>Incident log</h2><span className="inc-faint inc-small">{incident.timeline.length} {incident.timeline.length === 1 ? 'entry' : 'entries'}</span></div>
        <IncidentTimeline timeline={incident.timeline} />
      </section>

      {assignOpen && <AssignTeamModal incident={incident} incidents={incidents} onClose={() => setAssignOpen(false)} />}
    </div>
    </div>
  );
}
