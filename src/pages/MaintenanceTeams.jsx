import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, UserPlus, Search, Pencil, Save, X, Eye, EyeOff, KeyRound } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { readTeamRegistry, useTeams, registerMaintenanceTeam, updateMaintenanceTeam, TEAM_REGISTRY_KEY, TEAM_SPECIALTIES, MIN_PASSWORD_LENGTH } from '../utils/teamRegistry';
import '../components/incidents/incidents.css';
import './maintenance-teams.css';

const emptyForm = { name: '', specialty: 'Flood', crew: '', leader: '', phone: '', serviceArea: 'City of Elmina', username: '', password: '' };
const specialtyLabels = { Flood: 'Flood & drainage', 'Tree Fall Risk': 'Tree inspection & arboriculture', 'Road Obstruction': 'Road obstruction clearance', Pothole: 'Road-surface maintenance', 'Traffic control': 'Traffic control' };
const formFrom = team => ({ name: team.name, specialty: team.specialty, crew: String(team.crew), leader: team.leader || '', phone: team.phone || '', serviceArea: team.serviceArea || 'City of Elmina', username: team.username || '', password: '' });

export default function MaintenanceTeams() {
  const [registry, setRegistry] = useState(() => readTeamRegistry());
  const directoryTeams = useTeams();
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [shownPasswords, setShownPasswords] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('ALL');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const formRef = useRef(null);
  const editingTeam = directoryTeams.find(team => team.id === editingId) || null;
  useEffect(() => {
    const refresh = event => { if (event.key === TEAM_REGISTRY_KEY || event.key === null) setRegistry(readTeamRegistry()); };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  const update = event => { setForm(previous => ({ ...previous, [event.target.name]: event.target.value })); setError(null); setSuccess(null); };
  const query = search.trim().toLowerCase();
  const filtered = directoryTeams.filter(team =>
    (specialty === 'ALL' || team.specialty === specialty) &&
    [team.name, team.id, team.leader, team.serviceArea, team.username, specialtyLabels[team.specialty]].some(value => String(value ?? '').toLowerCase().includes(query))
  );

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowFormPassword(false);
    setError(null);
  }

  function startEdit(team) {
    setEditingId(team.id);
    setForm(formFrom(team));
    setShowFormPassword(false);
    setError(null);
    setSuccess(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => formRef.current?.querySelector('input')?.focus({ preventScroll: true }), 300);
  }

  function togglePassword(id) {
    setShownPasswords(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function submit(event) {
    event.preventDefault();
    setSuccess(null);
    if (!form.username.trim()) { setError('Enter a username so the team can sign in to the crew app.'); return; }
    if (!editingTeam?.password && !form.password) { setError(`Set a password of at least ${MIN_PASSWORD_LENGTH} characters for the crew app.`); return; }
    const result = editingId ? updateMaintenanceTeam(editingId, form) : registerMaintenanceTeam(form);
    if (result.error) { setError(result.error); return; }
    setRegistry({ teams: result.teams, error: null });
    resetForm();
    setSuccess(editingId
      ? `${result.team.name} updated. Changes are saved in this browser's registry.`
      : `${result.team.name} registered successfully. The team can now sign in to the crew app as "${result.team.username}".`);
  }

  return (
    <div className="inc-page team-registry">
      <PageHeader title="Maintenance Team Registry" description="Register maintenance crews and maintain the township response directory.">
        <div className="heading-meta"><span className="simulation-badge">ADMIN WORKSPACE</span><Link to="/incidents" className="inc-btn inc-btn-ghost inc-btn-sm">Incident &amp; Response Center</Link></div>
      </PageHeader>
      <p className="team-registry-note">Teams are saved on this browser. Each team signs in to the crew app with its own username and password, and every team is available in the Incident &amp; Response Center assignment list.</p>
      <div className="inc-stats">
        <div className="inc-stat"><p>Teams in directory</p><strong>{directoryTeams.length}</strong><span>Existing and registered teams</span></div>
        <div className="inc-stat"><p>Registered teams</p><strong>{directoryTeams.filter(team => team.source === 'registered').length}</strong><span>Saved in this browser</span></div>
        <div className="inc-stat"><p>Crew app logins</p><strong>{directoryTeams.filter(team => team.username).length}</strong><span>Teams that can sign in</span></div>
        <div className="inc-stat"><p>Total crew</p><strong>{directoryTeams.reduce((sum, team) => sum + team.crew, 0)}</strong><span>Registered headcount, not availability</span></div>
      </div>
      {registry.error && <p className="team-message is-error" role="alert">{registry.error}</p>}
      {error && <p className="team-message is-error" role="alert">{error}</p>}
      {success && <p className="team-message is-success" role="status">{success}</p>}
      <div className="team-registry-layout">
        <section className={`inc-panel team-form-panel${editingTeam ? ' is-editing' : ''}`} aria-labelledby="register-team-title" ref={formRef}>
          <div className="inc-panel-head">
            <h2 id="register-team-title" className="flex items-center gap-2">{editingTeam ? <><Pencil size={16} />Edit {editingTeam.name}</> : <><UserPlus size={16} />Register a maintenance team</>}</h2>
            {editingTeam && <button type="button" className="inc-btn inc-btn-ghost inc-btn-sm" onClick={resetForm}><X size={13} />Cancel</button>}
          </div>
          <form className="team-registration-form" onSubmit={submit}>
            <p className="inc-small inc-faint">Fields marked * are required.</p>
            <label htmlFor="team-name">Team name *<input id="team-name" name="name" value={form.name} onChange={update} required minLength={2} maxLength={80} autoComplete="organization" /></label>
            <div className="team-form-row">
              <label htmlFor="team-specialty">Specialty *<select id="team-specialty" name="specialty" value={form.specialty} onChange={update} required>{TEAM_SPECIALTIES.map(value => <option key={value} value={value}>{specialtyLabels[value]}</option>)}</select></label>
              <label htmlFor="team-crew">Crew size *<input id="team-crew" name="crew" type="number" min="1" max="100" step="1" value={form.crew} onChange={update} required /></label>
            </div>
            <label htmlFor="team-leader">Team leader<input id="team-leader" name="leader" value={form.leader} onChange={update} maxLength={80} autoComplete="name" /></label>
            <label htmlFor="team-phone">Contact number<input id="team-phone" name="phone" type="tel" inputMode="numeric" placeholder="0121212546" pattern="01[0-9]{8,9}" value={form.phone} onChange={update} maxLength={11} autoComplete="tel" /></label>
            <label htmlFor="team-area">Service area<input id="team-area" name="serviceArea" value={form.serviceArea} onChange={update} maxLength={100} /></label>
            <fieldset className="team-login-fields">
              <legend><KeyRound size={14} />Crew app login</legend>
              <label htmlFor="team-username">Username *<input id="team-username" name="username" value={form.username} onChange={update} required minLength={3} maxLength={30} pattern="[A-Za-z0-9._\-]{3,30}" placeholder="drainage.c" autoComplete="off" autoCapitalize="none" spellCheck={false} /></label>
              <label htmlFor="team-password">{editingTeam?.password ? 'New password' : 'Password *'}
                <span className="team-password">
                  <input id="team-password" name="password" type={showFormPassword ? 'text' : 'password'} value={form.password} onChange={update} required={!editingTeam?.password} minLength={MIN_PASSWORD_LENGTH} maxLength={60} placeholder={editingTeam?.password ? 'Leave blank to keep the current password' : `At least ${MIN_PASSWORD_LENGTH} characters`} autoComplete="new-password" />
                  <button type="button" className="inc-icon-btn" aria-label={showFormPassword ? 'Hide password' : 'Show password'} aria-pressed={showFormPassword} onClick={() => setShowFormPassword(value => !value)}>{showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </span>
              </label>
              <p className="inc-small inc-faint">The team signs in on the login page with this username to receive and update jobs.</p>
            </fieldset>
            <div className="team-form-actions">
              {editingTeam
                ? <><button className="inc-btn inc-btn-primary" type="submit"><Save size={15} />Save changes</button><button className="inc-btn inc-btn-ghost" type="button" onClick={resetForm}>Cancel</button></>
                : <><button className="inc-btn inc-btn-primary" type="submit"><UserPlus size={15} />Register team</button><button className="inc-btn inc-btn-ghost" type="button" onClick={() => { resetForm(); setSuccess(null); }}>Clear form</button></>}
            </div>
          </form>
        </section>
        <section className="inc-panel" aria-labelledby="team-directory-title">
          <div className="inc-panel-head"><h2 id="team-directory-title" className="flex items-center gap-2"><UsersRound size={16} />Team directory</h2><span className="inc-pill">{directoryTeams.length} teams</span></div>
          <p className="px-4 pt-3 inc-small inc-faint">Existing-team leaders are fictional demo names; contact numbers and passwords are demo placeholders.</p><div className="team-directory-filters">
            <label htmlFor="team-search"><span className="flex items-center gap-1"><Search size={13} />Search teams</span><input id="team-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Team name, leader, area or username" /></label>
            <label htmlFor="directory-specialty">Filter by specialty<select id="directory-specialty" value={specialty} onChange={event => setSpecialty(event.target.value)}><option value="ALL">All specialties</option>{TEAM_SPECIALTIES.map(value => <option key={value} value={value}>{specialtyLabels[value]}</option>)}</select></label>
          </div>
          <p className="px-4 pb-3 inc-small inc-faint" role="status">Showing {filtered.length} of {directoryTeams.length} teams</p>
          <ul className="team-directory-list">{filtered.map(team => {
            const shown = shownPasswords.has(team.id);
            return <li key={team.id} className={team.id === editingId ? 'is-editing' : ''}>
              <div className="team-directory-heading">
                <h3>{team.name}</h3>
                <span className="team-directory-tags">
                  <span className="inc-pill">{team.source === 'seed' ? 'Existing demo team' : 'Registered'}</span>
                  {team.edited && <span className="inc-pill">Edited</span>}
                  <button type="button" className="inc-btn inc-btn-ghost inc-btn-sm" onClick={() => startEdit(team)} aria-label={`Edit ${team.name}`}><Pencil size={13} />Edit</button>
                </span>
              </div>
              <p className="inc-small inc-faint team-record-id">{team.id}</p>
              <p className="team-specialty">{specialtyLabels[team.specialty] || team.specialty}</p>
              <dl className="team-record-details">
                <div><dt>Crew</dt><dd>{team.crew} people</dd></div>
                <div><dt>Team leader</dt><dd>{team.leader || 'Not provided'}</dd></div>
                <div><dt>Contact</dt><dd>{team.phone || 'Not provided'}</dd></div>
                <div><dt>Service area</dt><dd>{team.serviceArea || 'City of Elmina'}</dd></div>
                <div><dt>Username</dt><dd className="team-mono">{team.username || 'No login yet'}</dd></div>
                <div><dt>Password</dt><dd className="team-password-view">{team.password
                  ? <><span className="team-mono">{shown ? team.password : '•'.repeat(8)}</span><button type="button" className="inc-icon-btn" aria-label={`${shown ? 'Hide' : 'Show'} password for ${team.name}`} aria-pressed={shown} onClick={() => togglePassword(team.id)}>{shown ? <EyeOff size={14} /> : <Eye size={14} />}</button></>
                  : 'Not set'}</dd></div>
              </dl>
            </li>;
          })}</ul>
          {!filtered.length && <div className="inc-empty">No teams match your search or specialty filter.</div>}
        </section>
      </div>
    </div>
  );
}
