import { useEffect, useRef, useState } from 'react';
import { CheckCheck, Sparkles, UserCheck, Construction, Route, CircleCheck, UserX, Undo2, PhoneCall, Lock, ChevronDown, Check, Camera, X } from 'lucide-react';
import { acknowledgeIncident, assignTeam, withdrawAssignment, closeRoad, reopenRoad, formatTime, specialtyLabels } from '../../utils/incidentStore';

function teamMeta(item) {
  const parts = [specialtyLabels[item.team.specialty] || item.team.specialty, `ETA ${item.team.etaMin} min`];
  if (item.declined) parts.push('declined this job');
  else if (item.busyWith) parts.push(`busy on ${item.busyWith}`);
  return parts.join(' · ');
}

// One control: the button assigns the AI's pick; the arrow opens a list to choose another team instead.
function AssignPicker({ incident }) {
  const ranking = incident.teamRanking;
  const aiPick = incident.recommendedTeam;
  const [chosenId, setChosenId] = useState(aiPick?.team.id || ranking[0]?.team.id || '');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const chosen = ranking.find(item => item.team.id === chosenId) || aiPick || ranking[0];
  const isAi = !!aiPick && chosen?.team.id === aiPick.team.id;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = event => { if (!wrapRef.current?.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === 'Escape') { setOpen(false); wrapRef.current?.querySelector('.inc-split-toggle')?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!chosen) return <p className="inc-hint">No teams in the registry yet. Add one on the Maintenance Team Registry page.</p>;

  function choose(id) {
    setChosenId(id);
    setOpen(false);
  }

  return (
    <div className="inc-assign">
      {isAi ? (
        <p className="inc-assign-label"><Sparkles size={12} aria-hidden="true" />AI recommended crew<span className="inc-mono">{aiPick.matchScore}% match</span></p>
      ) : (
        <p className="inc-assign-label is-manual">Your choice{aiPick && <button type="button" onClick={() => setChosenId(aiPick.team.id)}>Use AI pick</button>}</p>
      )}
      <div className="inc-split" ref={wrapRef}>
        <button type="button" className="inc-btn inc-btn-primary inc-split-main" onClick={() => assignTeam(incident.id, chosen.team.id, { viaAi: isAi })}>
          <UserCheck size={16} aria-hidden="true" /><span>Assign {chosen.team.name}</span>
        </button>
        <button type="button" className="inc-split-toggle" aria-haspopup="listbox" aria-expanded={open} aria-label="Choose a different team" title="Choose a different team" onClick={() => setOpen(value => !value)}>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        {open && (
          <ul className="inc-team-menu" role="listbox" aria-label="Teams">
            {ranking.map(item => {
              const selected = item.team.id === chosen.team.id;
              return (
                <li key={item.team.id}>
                  <button type="button" role="option" aria-selected={selected} onClick={() => choose(item.team.id)}>
                    <span className="inc-team-menu-name">{item.team.name}{item === aiPick && <span className="inc-ai-tag"><Sparkles size={10} aria-hidden="true" />AI pick</span>}{selected && <Check size={14} className="ml-auto" aria-hidden="true" />}</span>
                    <span className={`inc-team-menu-meta${item.declined ? ' is-declined' : item.busyWith ? ' is-busy' : ''}`}>{teamMeta(item)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="inc-assign-why">{chosen.declined ? 'Declined this job earlier · ' : ''}{chosen.reasons.join(' · ')}</p>
    </div>
  );
}

// The crew's proof photo and note, sent from the crew app when they mark the job done.
function CompletionProof({ incident }) {
  const [zoom, setZoom] = useState(false);
  const { completion } = incident;

  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = event => { if (event.key === 'Escape') setZoom(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom]);

  if (!completion) return null;
  return (
    <div className="inc-proof">
      <p className="inc-proof-title"><Camera size={13} aria-hidden="true" />Completion photo</p>
      {completion.photo ? (
        <button type="button" className="inc-proof-img" onClick={() => setZoom(true)} aria-label="Enlarge the completion photo">
          <img src={completion.photo} alt={`Finished work at ${incident.location}`} />
        </button>
      ) : <p className="inc-hint">No photo was attached.</p>}
      <p className="inc-proof-meta">{incident.team?.name || 'Crew'} · <span className="inc-mono">{formatTime(completion.at)}</span></p>
      {completion.note && <p className="inc-proof-note">“{completion.note}”</p>}
      {zoom && (
        <div className="inc-lightbox" role="dialog" aria-modal="true" aria-label="Completion photo" onClick={() => setZoom(false)}>
          <img src={completion.photo} alt={`Finished work at ${incident.location}`} />
          <button type="button" className="inc-lightbox-close" aria-label="Close photo"><X size={20} aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}

function CrewStatus({ incident }) {
  const { team } = incident;
  const lines = {
    accepted: 'Accepted the job and preparing to leave.',
    dispatched: incident.crewEtaAt != null ? `On the way, expected on site at ${formatTime(incident.crewEtaAt)}.` : 'On the way to the site.',
    on_site: 'Arrived and assessing the site.',
    in_progress: 'Repair or clearance in progress.',
  };
  return (
    <div className="inc-crew">
      <p className="inc-crew-name"><span className="inc-live-dot" aria-hidden="true" />{team?.name || 'Crew'}<span className="inc-stage-pill">{incident.stageShort}</span></p>
      <p className="inc-crew-line">{lines[incident.stage]}</p>
      {team?.leader && (
        <p className="inc-crew-contact"><PhoneCall size={13} aria-hidden="true" />{team.leader}{team.phone && <> · <a href={`tel:${team.phone}`} className="inc-mono">{team.phone}</a></>}</p>
      )}
      <p className="inc-hint">Last update {formatTime(incident.lastUpdateAt)}. Updates come from the crew's mobile app.</p>
    </div>
  );
}

export default function AdminActions({ incident, canAct }) {
  const closedAt = [...incident.timeline].reverse().find(event => event.type === 'road_closed')?.at;
  let body;
  if (incident.stage === 'detected') {
    body = canAct ? (
      <>
        <button type="button" className="inc-btn inc-btn-primary w-full" onClick={() => acknowledgeIncident(incident.id)}><CheckCheck size={16} aria-hidden="true" />Acknowledge</button>
        <p className="inc-hint">Confirm the hazard is real before sending a crew.</p>
      </>
    ) : <p className="inc-hint">Waiting for the admin team to confirm this hazard.</p>;
  } else if (incident.stage === 'verified') {
    body = (
      <>
        {incident.lastDecline && (
          <div className="inc-declined" role="status">
            <p><UserX size={14} aria-hidden="true" /><strong>{incident.lastDecline.teamName} declined</strong><span className="inc-mono">{formatTime(incident.lastDecline.at)}</span></p>
            <p>{incident.lastDecline.reason}{incident.lastDecline.note && <> · “{incident.lastDecline.note}”</>}</p>
            <p className="inc-declined-next">Assign another crew to keep this moving.</p>
          </div>
        )}
        {canAct ? <AssignPicker incident={incident} /> : <p className="inc-hint">Waiting for the admin team to assign a crew.</p>}
      </>
    );
  } else if (incident.stage === 'assigned') {
    body = (
      <div className="inc-waiting">
        <p><span className="inc-live-dot is-waiting" aria-hidden="true" />Waiting for <strong>{incident.team?.name}</strong> to accept</p>
        <p className="inc-hint">Sent to the crew's phones at {formatTime(incident.assignedAt)}.</p>
        {canAct && <button type="button" className="inc-btn inc-btn-ghost w-full" onClick={() => withdrawAssignment(incident.id)}><Undo2 size={14} aria-hidden="true" />Change team</button>}
      </div>
    );
  } else if (['accepted', 'dispatched', 'on_site', 'in_progress'].includes(incident.stage)) {
    body = <CrewStatus incident={incident} />;
  } else if (incident.stage === 'resolved' && incident.roadClosed) {
    body = canAct ? (
      <>
        <p className="inc-done"><CircleCheck size={16} aria-hidden="true" />{incident.team?.name || 'The crew'} completed the work.</p>
        <button type="button" className="inc-btn inc-btn-primary w-full" onClick={() => reopenRoad(incident.id)}><Route size={16} aria-hidden="true" />Reopen road</button>
        <p className="inc-hint">Remove barriers and lift the detour.</p>
      </>
    ) : <p className="inc-done"><CircleCheck size={16} aria-hidden="true" />Work completed. Waiting for the admin team to reopen the road.</p>;
  } else {
    body = <p className="inc-done"><CircleCheck size={16} aria-hidden="true" />Incident closed. Recorded in the township log.</p>;
  }

  return (
    <section className="inc-card inc-actions" aria-label="Next step">
      <div className="inc-card-head"><h3>Next step</h3>{!canAct && <span className="inc-pill"><Lock size={10} aria-hidden="true" />View only</span>}</div>
      {body}
      {!incident.isOpen && <CompletionProof incident={incident} />}
      {canAct && incident.isOpen && !incident.roadClosed && (
        <button type="button" className="inc-btn inc-btn-danger w-full" onClick={() => closeRoad(incident.id)}><Construction size={15} aria-hidden="true" />Close road</button>
      )}
      {incident.roadClosed && (
        <p className="inc-barrier"><Construction size={14} aria-hidden="true" />Road closed since <span className="inc-mono">{formatTime(closedAt)}</span></p>
      )}
    </section>
  );
}
