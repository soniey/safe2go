import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { DEMO_ACCOUNTS, useDemoSession } from '../utils/demoSession';
import '../components/incidents/incidents.css';
import './login.css';

function returnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  const pathname = value.split(/[?#]/)[0];
  return ['/', '/flood', '/trees', '/vision', '/incidents', '/teams'].includes(pathname) ? value : '/';
}

export default function Login() {
  const { session, signIn } = useDemoSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const destination = returnPath(location.state?.from);
  useEffect(() => { document.title = 'Team & Admin Login · Safe2Go'; }, []);
  if (session) return <Navigate to={destination} replace />;
  function submit(event) {
    event.preventDefault();
    if (!signIn(email, password)) { setError('The email, username or password is incorrect. Use the sample credentials below or a team login from the Team Registry.'); return; }
    setPassword('');
    navigate(destination, { replace: true });
  }
  return (
    <main className="inc-page login-page">
      <div className="login-shell">
        <div className="login-brand"><ShieldCheck size={30} aria-hidden="true" /><strong>Safe2Go<span>.</span></strong></div>
        <p className="login-tagline">Township Road Climate Resilience &amp; Hazard Intelligence Platform</p>
        <section className="inc-panel login-card" aria-labelledby="login-heading">
          <div className="login-intro"><span className="inc-pill inc-pill-ok">TOWNSHIP MANAGEMENT</span><h1 id="login-heading">Team & Admin Login</h1><p>Sign in to monitor road risks and coordinate your township workspace.</p></div>
          <form className="login-form" onSubmit={submit}>
            {error && <p className="login-error" role="alert">{error}</p>}
            <label htmlFor="login-email">Email or team username<input id="login-email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => { setEmail(event.target.value); setError(''); }} placeholder="admin@safe2go.demo or drainage" /></label>
            <label htmlFor="login-password">Password</label>
            <div className="login-password"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={event => { setPassword(event.target.value); setError(''); }} /><button type="button" className="inc-icon-btn" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            <button type="submit" className="inc-btn inc-btn-primary login-submit"><LogIn size={16} />Sign in</button>
          </form>
          <aside className="login-demo" aria-label="Demo login credentials"><strong>Demo access only</strong><p>This prototype uses sample accounts, not production authentication. Use these demo credentials; no real password is needed.</p><div className="space-y-4">{DEMO_ACCOUNTS.map(account => <div key={account.type}><strong>{account.label}</strong><dl><div><dt>Email</dt><dd>{account.email}</dd></div><div><dt>Password</dt><dd>{account.password}</dd></div></dl></div>)}</div><p>Maintenance crews can also sign in with their team username and password from the Maintenance Team Registry.</p><p>Your password is not saved. The demo session lasts for this browser tab.</p></aside>
        </section>
        <p className="login-footer">City of Elmina · See risk earlier. Respond faster.</p>
      </div>
    </main>
  );
}
