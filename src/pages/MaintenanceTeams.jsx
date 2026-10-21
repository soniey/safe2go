import demoContacts from '../data/teamRegistryContacts.json';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, UserPlus, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { readTeamRegistry, registerMaintenanceTeam, TEAM_REGISTRY_KEY, TEAM_SPECIALTIES } from '../utils/teamRegistry';
import '../components/incidents/incidents.css';
import './maintenance-teams.css';

const emptyForm = { name: '', specialty: 'Flood', crew: '', etaMin: '', leader: '', phone: '', serviceArea: 'City of Elmina' };
const specialtyLabels = { Flood: 'Flood & drainage', 'Tree Fall Risk': 'Tree inspection & arboriculture', 'Road Obstruction': 'Road obstruction clearance', Pothole: 'Road-surface maintenance', 'Traffic control': 'Traffic control' };

export default function MaintenanceTeams() {
  const [registry, setRegistry] = useState(() => readTeamRegistry());
  // Keep seed contacts current when Vite preserves existing component state on refresh.
  const directoryTeams = registry.teams.map(team => team.source === 'seed' ? { ...team, ...demoContacts[team.id] } : team);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('ALL');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  useEffect(() => {
    const refresh = event => { if (event.key === TEAM_REGISTRY_KEY || event.key === null) setRegistry(readTeamRegistry()); };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  const update = event => { setForm(previous => ({ ...previous, [event.target.name]: event.target.value })); setError(null); setSuccess(null); };
  const query = search.trim().toLowerCase();
  const filtered = directoryTeams.filter(team =>
    (specialty === 'ALL' || team.specialty === specialty) &&
    [team.name, team.id, team.leader, team.serviceArea, specialtyLabels[team.specialty]].some(value => String(value ?? '').toLowerCase().includes(query))
  );
  function submit(event) {
    event.preventDefault();
    setSuccess(null);
    const result = registerMaintenanceTeam(form);
    if (result.error) { setError(result.error); return; }
    setRegistry({ teams: result.teams, error: null });
    setForm({ ...emptyForm });
    setError(null);
    setSuccess(`${result.team.name} registered successfully. The team is saved in this browser's registry.`);
  }
  return (
    <div className="inc-page team-registry">
      <PageHeader title="Maintenance Team Registry" description="Register maintenance crews and maintain the township response directory.">
        <div className="heading-meta"><span className="simulation-badge">ADMIN WORKSPACE</span><Link to="/incidents" className="inc-btn inc-btn-ghost inc-btn-sm">Incident &amp; Response Center</Link></div>
      </PageHeader>
      <p className="team-registry-note">Registrations are saved on this browser. Assignment integration is not enabled; new teams do not appear in the Incident &amp; Response Center's assignment list yet.</p>
      <div className="inc-stats">
        <div className="inc-stat"><p>Teams in directory</p><strong>{directoryTeams.length}</strong><span>Existing and registered teams</span></div>
        <div className="inc-stat"><p>Registered teams</p><strong>{directoryTeams.filter(team => team.source === 'registered').length}</strong><span>Saved in this browser</span></div>
        <div className="inc-stat"><p>Specialties covered</p><strong>{new Set(directoryTeams.map(team => team.specialty)).size}</strong><span>Across the directory</span></div>
        <div className="inc-stat"><p>Total crew</p><strong>{directoryTeams.reduce((sum, team) => sum + team.crew, 0)}</strong><span>Registered headcount, not availability</span></div>
      </div>
      {registry.error && <p className="team-message is-error" role="alert">{registry.error}</p>}
      {error && <p className="team-message is-error" role="alert">{error}</p>}
      {success && <p className="team-message is-success" role="status">{success}</p>}
      <div className="team-registry-layout">
        <section className="inc-panel" aria-labelledby="register-team-title">
          <div className="inc-panel-head"><h2 id="register-team-title" className="flex items-center gap-2"><UserPlus size={16} />Register a maintenance team</h2></div>
          <form className="team-registration-form" onSubmit={submit}>
            <p className="inc-small inc-faint">Fields marked * are required.</p>
            <label htmlFor="team-name">Team name *<input id="team-name" name="name" value={form.name} onChange={update} required minLength={2} maxLength={80} autoComplete="organization" /></label>
            <label htmlFor="team-specialty">Specialty *<select id="team-specialty" name="specialty" value={form.specialty} onChange={update} required>{TEAM_SPECIALTIES.map(value => <option key={value} value={value}>{specialtyLabels[value]}</option>)}</select></label>
            <div className="team-form-row">
              <label htmlFor="team-crew">Crew size *<input id="team-crew" name="crew" type="number" min="1" max="100" step="1" value={form.crew} onChange={update} required /></label>
              <label htmlFor="team-eta">Travel time (min) *<input id="team-eta" name="etaMin" type="number" min="0" max="240" step="1" value={form.etaMin} onChange={update} required /></label>
            </div>
            <label htmlFor="team-leader">Team leader<input id="team-leader" name="leader" value={form.leader} onChange={update} maxLength={80} autoComplete="name" /></label>
            <label htmlFor="team-phone">Contact number<input id="team-phone" name="phone" type="tel" inputMode="numeric" placeholder="0121212546" pattern="01[0-9]{8,9}" value={form.phone} onChange={update} maxLength={11} autoComplete="tel" /></label>
            <label htmlFor="team-area">Service area<input id="team-area" name="serviceArea" value={form.serviceArea} onChange={update} maxLength={100} /></label>
            <div className="team-form-actions"><button className="inc-btn inc-btn-primary" type="submit"><UserPlus size={15} />Register team</button><button className="inc-btn inc-btn-ghost" type="button" onClick={() => { setForm({ ...emptyForm }); setError(null); setSuccess(null); }}>Clear form</button></div>
          </form>
        </section>
        <section className="inc-panel" aria-labelledby="team-directory-title">
          <div className="inc-panel-head"><h2 id="team-directory-title" className="flex items-center gap-2"><UsersRound size={16} />Team directory</h2><span className="inc-pill">{directoryTeams.length} teams</span></div>
          <p className="px-4 pt-3 inc-small inc-faint">Existing-team leaders are fictional demo names; contact numbers are demo placeholders.</p><div className="team-directory-filters">
            <label htmlFor="team-search"><span className="flex items-center gap-1"><Search size={13} />Search teams</span><input id="team-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Team name, leader or area" /></label>
            <label htmlFor="directory-specialty">Filter by specialty<select id="directory-specialty" value={specialty} onChange={event => setSpecialty(event.target.value)}><option value="ALL">All specialties</option>{TEAM_SPECIALTIES.map(value => <option key={value} value={value}>{specialtyLabels[value]}</option>)}</select></label>
          </div>
          <p className="px-4 pb-3 inc-small inc-faint" role="status">Showing {filtered.length} of {directoryTeams.length} teams</p>
          <ul className="team-directory-list">{filtered.map(team => <li key={team.id}>
            <div className="team-directory-heading"><h3>{team.name}</h3><span className="inc-pill">{team.source === 'seed' ? 'Existing demo team' : 'Registered'}</span></div>
            <p className="inc-small inc-faint team-record-id">{team.id}</p>
            <p className="team-specialty">{specialtyLabels[team.specialty] || team.specialty}</p>
            <dl className="team-record-details"><div><dt>Crew</dt><dd>{team.crew} people</dd></div><div><dt>Travel time</dt><dd>{team.etaMin} min estimate</dd></div><div><dt>Team leader</dt><dd>{team.leader || 'Not provided'}</dd></div><div><dt>Contact</dt><dd>{team.phone || 'Not provided'}</dd></div><div><dt>Service area</dt><dd>{team.serviceArea || 'City of Elmina'}</dd></div></dl>
          </li>)}</ul>
          {!filtered.length && <div className="inc-empty">No teams match your search or specialty filter.</div>}
        </section>
      </div>
    </div>
  );
}
