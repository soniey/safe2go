import RiskTag from './RiskTag';
import ResponseProgress from './ResponseProgress';
import IncidentTimeline from './IncidentTimeline';
import ResidentAlertPreview from './ResidentAlertPreview';
import AdminActions from './AdminActions';
import AiAnalysis from './AiAnalysis';
import { hazardIcon, minutesLabel } from './labels';
import { formatTime } from '../../utils/incidentStore';

export default function IncidentDetail({ incident, canAct = true }) {
  const Icon = hazardIcon(incident.type);
  const closedAt = [...incident.timeline].reverse().find(event => event.type === 'road_closed')?.at;
  const teamValue = incident.team
    ? `${incident.team.name}${incident.stage === 'assigned' ? ' (awaiting reply)' : ''}`
    : incident.needsReassign ? 'Declined, reassign' : 'Unassigned';

  const facts = [
    { label: 'Priority', value: incident.priority },
    { label: 'Detected', value: formatTime(incident.detectedAt), mono: true },
    { label: 'Assigned crew', value: teamValue, muted: !incident.team && !incident.needsReassign, alert: incident.needsReassign },
    { label: 'Response time', value: incident.responseMinutes != null ? minutesLabel(incident.responseMinutes) : incident.isOpen ? 'Crew not on site yet' : '—', muted: incident.responseMinutes == null },
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
              {incident.summary && <p className="inc-summary">{incident.summary}</p>}
            </div>
            <div className="inc-docket-status">
              <RiskTag risk={incident.risk} large />
              <span className={`inc-stage-pill${incident.isOpen ? '' : ' is-done'}${incident.needsReassign ? ' is-alert' : ''}`}>{incident.needsReassign ? 'Needs reassignment' : incident.stageLabel}</span>
            </div>
          </header>

          <AiAnalysis id={incident.id} text={incident.whyFlagged} sources={incident.evidence} />

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
          <AdminActions incident={incident} canAct={canAct} />
          <ResidentAlertPreview incident={incident} canAct={canAct} />
        </div>

        <section className="inc-panel inc-history" aria-label="Incident log">
          <div className="inc-panel-head"><h2>Incident log</h2><span className="inc-faint inc-small">{incident.timeline.length} {incident.timeline.length === 1 ? 'entry' : 'entries'}</span></div>
          <IncidentTimeline timeline={incident.timeline} />
        </section>
      </div>
    </div>
  );
}
