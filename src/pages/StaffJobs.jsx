import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, LogOut, HardHat, Inbox, CheckCheck, CircleCheck, Signal, Wifi, BatteryFull } from 'lucide-react';
import JobCard from '../components/staff/JobCard';
import ActionSheet from '../components/staff/ActionSheet';
import { useResponseBoard, formatTime } from '../utils/incidentStore';
import { useDemoSession } from '../utils/demoSession';
import '../components/incidents/incidents.css';
import '../components/staff/staff.css';

// Crew mobile app: get notified of a job, accept or decline it, update its status.
// Signed in as Maintenance Team, the app receives jobs for every crew the admin assigns.
const ACTIVE = ['accepted', 'dispatched', 'on_site', 'in_progress'];
const assignmentKey = job => `${job.id}@${job.assignedAt}`;
const scrollToJob = id => document.getElementById(`job-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

export default function StaffJobs() {
  const { incidents, now } = useResponseBoard();
  const { session, signOut } = useDemoSession() || {};
  const [sheet, setSheet] = useState(null); // { kind: 'decline' | 'complete', id }
  const [toast, setToast] = useState('');
  // Jobs already waiting when the app opened don't trigger the "new job" alert.
  const [seen, setSeen] = useState(() => new Set(incidents.filter(job => job.stage === 'assigned').map(assignmentKey)));

  const jobs = incidents.filter(job => job.team);
  const requests = jobs.filter(job => job.stage === 'assigned');
  const active = jobs.filter(job => ACTIVE.includes(job.stage));
  const done = jobs.filter(job => (job.stage === 'resolved' || job.stage === 'reopened') && job.timeline.some(event => event.type === 'accepted'));
  const fresh = requests.filter(job => !seen.has(assignmentKey(job)));
  const freshKey = fresh.map(assignmentKey).join(',');
  const sheetJob = sheet && jobs.find(job => job.id === sheet.id);

  useEffect(() => {
    if (!freshKey) return undefined;
    const timer = setTimeout(() => setSeen(previous => new Set([...previous, ...freshKey.split(',')])), 10000);
    return () => clearTimeout(timer);
  }, [freshKey]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.title = requests.length ? `(${requests.length}) Crew app · Safe2Go` : 'Crew app · Safe2Go';
  }, [requests.length]);

  if (session && session.type !== 'demo-maintenance') return <Navigate to="/incidents" replace />;

  function viewFresh() {
    const job = fresh[0];
    setSeen(previous => new Set([...previous, ...fresh.map(assignmentKey)]));
    if (job) scrollToJob(job.id);
  }

  const card = job => <JobCard key={job.id} job={job} isNew={fresh.some(item => item.id === job.id)} onSheet={(kind, id) => setSheet({ kind, id })} onUpdated={setToast} />;

  return (
    <div className="inc-page crew-shell">
      <div className="crew-phone">
        <div className="crew-app">
          <div className="crew-statusbar" aria-hidden="true">
            <span>{formatTime(now)}</span>
            <span><Signal size={13} /><Wifi size={13} /><BatteryFull size={16} /></span>
          </div>

          <header className="crew-bar">
            <span className="crew-mark"><HardHat size={18} aria-hidden="true" /></span>
            <div className="crew-bar-title">
              <strong>Field Jobs</strong>
              <span>{session?.label || 'Maintenance Team'} · Safe2Go</span>
            </div>
            <button type="button" className="crew-icon" onClick={() => (requests[0] ? scrollToJob(requests[0].id) : setToast('No new jobs right now.'))} aria-label={requests.length ? `${requests.length} new job${requests.length > 1 ? 's' : ''}` : 'No new jobs'}>
              <Bell size={19} aria-hidden="true" />
              {requests.length > 0 && <span className="crew-badge">{requests.length}</span>}
            </button>
            <button type="button" className="crew-icon" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={18} aria-hidden="true" /></button>
          </header>

          {fresh.length > 0 && (
            <div className="crew-notify" role="alert">
              <span className="crew-notify-icon"><Bell size={16} aria-hidden="true" /></span>
              <span className="min-w-0"><strong>New job assigned</strong><span>{fresh[0].id} · {fresh[0].location}</span></span>
              <button type="button" onClick={viewFresh}>View</button>
            </div>
          )}

          <main className="crew-scroll">
            {requests.length > 0 && (
              <section aria-labelledby="crew-new-heading">
                <h2 id="crew-new-heading" className="crew-heading">New jobs<span>{requests.length}</span></h2>
                {requests.map(card)}
              </section>
            )}

            {active.length > 0 && (
              <section aria-labelledby="crew-active-heading">
                <h2 id="crew-active-heading" className="crew-heading">In progress<span>{active.length}</span></h2>
                {active.map(card)}
              </section>
            )}

            {requests.length + active.length === 0 && (
              <div className="crew-empty">
                <Inbox size={30} aria-hidden="true" />
                <strong>No jobs right now</strong>
                <p>New jobs from the admin team will pop up here.</p>
              </div>
            )}

            {done.length > 0 && (
              <section aria-labelledby="crew-done-heading">
                <h2 id="crew-done-heading" className="crew-heading">Done today<span>{done.length}</span></h2>
                <ul className="crew-done">
                  {done.map(job => (
                    <li key={job.id}>
                      {job.completion?.photo
                        ? <img className="crew-done-photo" src={job.completion.photo} alt={`Proof photo for ${job.id}`} />
                        : <CircleCheck size={15} aria-hidden="true" />}
                      <span className="min-w-0"><strong>{job.location}</strong><span>{job.id} · {job.team?.name}</span></span>
                      <span className="inc-mono">{formatTime([...job.timeline].reverse().find(event => event.type === 'resolved')?.at)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </main>

          {sheetJob && <ActionSheet key={`${sheet.kind}-${sheet.id}`} job={sheetJob} kind={sheet.kind} onClose={() => setSheet(null)} onDone={message => { setSheet(null); setToast(message); }} />}
          {toast && <p className="crew-toast" role="status"><CheckCheck size={16} aria-hidden="true" />{toast}</p>}
        </div>
      </div>
    </div>
  );
}
