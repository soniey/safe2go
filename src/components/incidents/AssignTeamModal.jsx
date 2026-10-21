import { useEffect, useRef, useState } from 'react';
import { X, Users, Timer, Star } from 'lucide-react';
import { assignTeam, teams } from '../../utils/incidentStore';

export default function AssignTeamModal({ incident, incidents, onClose }) {
  const [teamId, setTeamId] = useState(incident.recommendedTeamId || teams[0].id);
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.querySelector('input:checked')?.focus();
    const onKey = event => { if (event.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);

  const busyWith = id => incidents.find(item => item.isOpen && item.team?.id === id && item.id !== incident.id)?.id;
  const chosen = teams.find(team => team.id === teamId);

  function confirm() {
    assignTeam(incident.id, teamId);
    onClose();
  }

  return (
    <div className="inc-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="inc-modal" role="dialog" aria-modal="true" aria-labelledby="assign-title" ref={dialogRef}>
        <div className="inc-modal-head">
          <div>
            <p className="inc-mono inc-faint">{incident.id} · {incident.location}</p>
            <h2 id="assign-title">Assign a maintenance team</h2>
          </div>
          <button type="button" className="inc-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <fieldset className="inc-team-list">
          <legend className="sr-only">Available teams</legend>
          {teams.map(team => {
            const busy = busyWith(team.id);
            const recommended = team.id === incident.recommendedTeamId;
            return (
              <label key={team.id} className={`inc-team${team.id === teamId ? ' is-on' : ''}`}>
                <input type="radio" name="team" value={team.id} checked={team.id === teamId} onChange={() => setTeamId(team.id)} />
                <span className="min-w-0">
                  <span className="inc-team-name">{team.name}{recommended && <span className="inc-pill inc-pill-ok"><Star size={10} aria-hidden="true" />Recommended</span>}</span>
                  <span className="inc-team-meta">{team.specialty} · <Users size={11} aria-hidden="true" />{team.crew} crew · <Timer size={11} aria-hidden="true" />ETA {team.etaMin} min</span>
                  {busy && <span className="inc-team-busy">Currently on {busy}</span>}
                </span>
              </label>
            );
          })}
        </fieldset>
        <div className="inc-modal-foot">
          <button type="button" className="inc-btn inc-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="inc-btn inc-btn-primary" onClick={confirm}>Assign {chosen?.name}</button>
        </div>
      </div>
    </div>
  );
}
