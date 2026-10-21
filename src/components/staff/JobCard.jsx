import { Check, X, Truck, MapPinned, Wrench, ClipboardCheck, Navigation, Timer, UsersRound, Construction } from 'lucide-react';
import RiskTag from '../incidents/RiskTag';
import { hazardIcon, directionsUrl } from '../incidents/labels';
import { acceptJob, startTravel, arriveOnSite, startWork, formatTime } from '../../utils/incidentStore';

const steps = ['On the way', 'On site', 'Working', 'Done'];
const stepIndex = { accepted: -1, dispatched: 0, on_site: 1, in_progress: 2, resolved: 4, reopened: 4 };

// One job on the crew's phone: what, where, and the single next button.
export default function JobCard({ job, isNew, onSheet, onUpdated }) {
  const teamId = job.team?.id;
  const risk = job.risk.toLowerCase();
  const Icon = hazardIcon(job.type);
  const directions = directionsUrl(job.coordinates);
  const current = stepIndex[job.stage];

  const next = {
    accepted: { label: 'On my way', icon: Truck, run: () => startTravel(job.id, teamId), done: 'Status: on the way' },
    dispatched: { label: 'Arrived on site', icon: MapPinned, run: () => arriveOnSite(job.id, teamId), done: 'Status: on site' },
    on_site: { label: 'Start work', icon: Wrench, run: () => startWork(job.id, teamId), done: 'Status: working' },
    in_progress: { label: 'Mark as done', icon: ClipboardCheck, run: () => { onSheet('complete', job.id); return false; } },
  }[job.stage];

  function accept() {
    if (acceptJob(job.id, teamId)) onUpdated(`${job.id} accepted. Admin notified.`);
  }

  function update() {
    if (next.run() && next.done) onUpdated(`${next.done}. Admin notified.`);
  }

  return (
    <article id={`job-${job.id}`} className={`crew-job inc-edge-${risk}${isNew ? ' is-new' : ''}`} aria-labelledby={`job-title-${job.id}`}>
      <div className="crew-job-top">
        <span className={`crew-job-icon inc-tint-${risk}`}><Icon size={15} aria-hidden="true" /></span>
        <span className="crew-job-type">{job.type}<span className="inc-mono"> · {job.id}</span></span>
        <RiskTag risk={job.risk} />
      </div>

      <h3 id={`job-title-${job.id}`}>{job.location}</h3>
      <p className="crew-job-task">{job.crewTask}</p>

      <div className="crew-chips">
        <span><UsersRound size={12} aria-hidden="true" />{job.team?.name}</span>
        <span><Timer size={12} aria-hidden="true" />{job.stage === 'dispatched' && job.crewEtaAt != null ? `ETA ${formatTime(job.crewEtaAt)}` : `${job.team?.etaMin ?? '—'} min away`}</span>
        {job.roadClosed && <span className="is-alert"><Construction size={12} aria-hidden="true" />Road closed</span>}
      </div>

      {job.stage !== 'assigned' && (
        <ol className="crew-progress" aria-label="Job progress">
          {steps.map((label, index) => (
            <li key={label} className={index < current ? 'is-done' : index === current ? 'is-current' : ''}>{label}</li>
          ))}
        </ol>
      )}

      {job.stage === 'assigned' ? (
        <div className="crew-two">
          <button type="button" className="inc-btn inc-btn-ghost" onClick={() => onSheet('decline', job.id)}><X size={16} aria-hidden="true" />Decline</button>
          <button type="button" className="inc-btn inc-btn-primary" onClick={accept}><Check size={17} aria-hidden="true" />Accept</button>
        </div>
      ) : next && (
        <button type="button" className="inc-btn inc-btn-primary" onClick={update}><next.icon size={17} aria-hidden="true" />{next.label}</button>
      )}

      <div className="crew-job-foot">
        {directions && <a href={directions} target="_blank" rel="noreferrer"><Navigation size={13} aria-hidden="true" />Directions</a>}
        {job.stage === 'accepted' && <button type="button" className="crew-link" onClick={() => onSheet('decline', job.id)}>Can't take it?</button>}
        <span className="inc-mono">Updated {formatTime(job.lastUpdateAt)}</span>
      </div>
    </article>
  );
}
