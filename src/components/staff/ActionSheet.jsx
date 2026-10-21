import { useEffect, useRef, useState } from 'react';
import { Undo2, ClipboardCheck, Camera, RefreshCw, ImageIcon } from 'lucide-react';
import { declineJob, completeJob, DECLINE_REASONS } from '../../utils/incidentStore';
import { makeProofPhoto } from './photo';

// Sample "after" photo for laptops without a camera (reuses the Road Vision clear-road image).
const SAMPLE_PHOTO = '/images/cctv/cam-01-normal.jpg';

// Bottom sheet for the two steps that need a little more input: declining a job and finishing one.
export default function ActionSheet({ job, kind, onClose, onDone }) {
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  const [note, setNote] = useState('');
  const [safe, setSafe] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sheetRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const decline = kind === 'decline';
  const teamId = job.team?.id;
  const photoLabel = `${job.id} · ${job.location} · ${job.team?.name || 'Crew'}`;

  useEffect(() => {
    sheetRef.current?.querySelector('input')?.focus();
    const onKey = event => { if (event.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function usePhoto(source) {
    if (!source) return;
    setBusy(true);
    setError('');
    try {
      setPhoto(await makeProofPhoto(source, photoLabel));
    } catch (cause) {
      setError(cause.message || 'The photo could not be used. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (decline) {
      if (declineJob(job.id, teamId, { reason, note })) onDone(`${job.id} sent back to the admin team.`);
      else onClose();
      return;
    }
    if (!photo) { setError('Take a photo of the finished site first.'); return; }
    if (!safe) { setError('Confirm the site is safe first.'); return; }
    if (completeJob(job.id, teamId, { note, photo, checks: ['Hazard cleared', 'Road safe for traffic'] })) onDone(`${job.id} done. Photo sent to admin.`);
    else onClose();
  }

  const cameraInput = (
    <input
      type="file"
      accept="image/*"
      capture="environment"
      className="sr-only"
      onChange={event => { usePhoto(event.target.files?.[0]); event.target.value = ''; }}
    />
  );

  return (
    <div className="crew-sheet-wrap" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="crew-sheet" role="dialog" aria-modal="true" aria-labelledby="crew-sheet-title" ref={sheetRef}>
        <span className="crew-sheet-grip" aria-hidden="true" />
        <h2 id="crew-sheet-title">{decline ? `Decline ${job.id}?` : `Finish ${job.id}`}</h2>
        <p className="crew-sheet-sub">{job.location} · {job.team?.name}</p>

        {decline ? (
          <fieldset>
            <legend>Reason</legend>
            {DECLINE_REASONS.map(item => (
              <label key={item} className={`crew-option${reason === item ? ' is-on' : ''}`}>
                <input type="radio" name="decline-reason" value={item} checked={reason === item} onChange={() => setReason(item)} />{item}
              </label>
            ))}
          </fieldset>
        ) : (
          <>
            {photo ? (
              <div className="crew-photo-preview">
                <img src={photo} alt={`Finished site at ${job.location}`} />
                <label className="crew-photo-retake">{cameraInput}<RefreshCw size={14} aria-hidden="true" />Retake</label>
              </div>
            ) : (
              <>
                <label className={`crew-photo-take${busy ? ' is-busy' : ''}`}>
                  {cameraInput}
                  <Camera size={26} aria-hidden="true" />
                  <strong>{busy ? 'Preparing photo…' : 'Take photo of the finished site'}</strong>
                  <span>Required as proof for the admin team</span>
                </label>
                <button type="button" className="crew-photo-sample" onClick={() => usePhoto(SAMPLE_PHOTO)} disabled={busy}>
                  <ImageIcon size={13} aria-hidden="true" />No camera? Use a sample photo
                </button>
              </>
            )}
            <label className={`crew-option${safe ? ' is-on' : ''}`}>
              <input type="checkbox" checked={safe} onChange={event => { setSafe(event.target.checked); setError(''); }} />Hazard cleared and road is safe
            </label>
          </>
        )}

        <label className="crew-sheet-label" htmlFor="crew-sheet-note">{decline ? 'Note for admin (optional)' : 'What did you do? (optional)'}</label>
        <textarea id="crew-sheet-note" value={note} maxLength={200} onChange={event => setNote(event.target.value)} placeholder={decline ? 'Pump truck is at another site' : 'Cleared the drain inlet'} />
        {error && <p className="inc-field-error" role="alert">{error}</p>}

        <div className="crew-two">
          <button type="button" className="inc-btn inc-btn-ghost" onClick={onClose}>Cancel</button>
          {decline
            ? <button type="button" className="inc-btn inc-btn-danger" onClick={submit}><Undo2 size={16} aria-hidden="true" />Send to admin</button>
            : <button type="button" className="inc-btn inc-btn-primary" onClick={submit}><ClipboardCheck size={16} aria-hidden="true" />Mark as done</button>}
        </div>
      </div>
    </div>
  );
}
