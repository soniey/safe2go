import { useDemoSession } from '../utils/demoSession';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ShieldCheck, Radio, X } from 'lucide-react';
import { navigation } from '../utils/navigation';

export default function Sidebar({ open, hidden, onClose }) {
  const { session } = useDemoSession();
  return <>{open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
    <aside aria-label="Township navigation" id="main-sidebar" inert={hidden} className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>
      <div className="brand"><span className="brand-mark"><ShieldCheck size={23} strokeWidth={1.7} /></span><div><strong>Safe2Go<span className="text-neutral-400">.</span></strong><p>Road Climate Resilience</p></div><button className="icon-button ml-auto lg:hidden" onClick={onClose} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="township-selector"><span className="township-icon">E</span><div><strong>City of Elmina</strong><p>Township workspace</p></div></div>
      <p className="eyebrow px-3 mb-3 mt-7">Township operations</p>
      <nav aria-label="Main navigation" className="space-y-1">{navigation.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}><Icon size={18} strokeWidth={1.7} /><span>{label}</span>{path === '/' && <span className="ml-auto text-xs text-neutral-400">01</span>}</NavLink>)}</nav>
      <div className="mt-auto"><div className="system-card"><div className="eyebrow mb-4 flex items-center gap-2"><Radio size={13} />System status</div><div className="flex items-center justify-between text-xs"><span>Demo Mode</span><span className="flex items-center gap-1.5 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Active</span></div><p className="mt-3 text-xs text-neutral-500">Road Climate Monitoring</p><p className="mt-1 text-xs text-neutral-500">Mock Data Active</p></div><div className="sidebar-footer"><span className="avatar">{session?.initials || 'TA'}</span><div><strong>{session?.label || 'Township Admin'}</strong><p>Demo workspace</p></div><span className="ml-auto text-neutral-400 text-xs">v1.0</span></div></div>
    </aside></>;
}
