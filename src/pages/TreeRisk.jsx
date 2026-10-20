import { Fragment, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ClipboardCheck, Clock3, Leaf, Search, ShieldAlert, Trees, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RiskBadge from '../components/RiskBadge';
import { treeApi } from '../utils/treeRisk';

const filters = ['All trees', 'Critical', 'High', 'Watch', 'Safe'];
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });

export default function TreeRisk() {
  const [trees, setTrees] = useState([]);
  const [filter, setFilter] = useState('All trees');
  const [query, setQuery] = useState('');
  const [historyId, setHistoryId] = useState(null);
  const [inspectTree, setInspectTree] = useState(null);
  const [notice, setNotice] = useState('');

  async function refresh() { setTrees(await treeApi.list()); }
  useEffect(() => { refresh(); }, []);

  const counts = useMemo(() => trees.reduce((result, tree) => {
    result[tree.risk] = (result[tree.risk] || 0) + 1;
    return result;
  }, {}), [trees]);
  const visibleTrees = trees.filter(tree => {
    const matchesRisk = filter === 'All trees' || tree.risk.toLowerCase() === filter.toLowerCase();
    const term = query.trim().toLowerCase();
    return matchesRisk && (!term || `${tree.id} ${tree.species} ${tree.location}`.toLowerCase().includes(term));
  });

  async function saveInspection(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await treeApi.addInspection(inspectTree.id, {
      date: form.get('date'), inspector: form.get('inspector').trim(),
      notes: form.get('notes').trim(), health: form.get('health'), soil: form.get('soil'), tilt: form.get('tilt'),
    });
    setInspectTree(null);
    setNotice(`Inspection saved for ${inspectTree.id}`);
    window.setTimeout(() => setNotice(''), 3500);
    await refresh();
  }

  return <>
    <PageHeader title="Tree Risk" description="Assess tree condition, environmental factors and inspection priorities.">
      <div className="heading-meta"><span className="simulation-badge"><span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />DEMO RECORDS</span><span className="flex items-center gap-1.5 text-[11px] text-neutral-400"><Clock3 size={12} />Risk recalculated from latest inspection</span></div>
    </PageHeader>

    <div className="tree-summary grid grid-cols-2 gap-3 sm:grid-cols-4">
      <article className="panel tree-metric"><span>Total tree records</span><strong>{trees.length}</strong><Trees size={17} /></article>
      <article className="panel tree-metric tree-metric-critical"><span>Critical risk</span><strong>{counts.CRITICAL || 0}</strong><ShieldAlert size={17} /></article>
      <article className="panel tree-metric tree-metric-high"><span>High risk</span><strong>{counts.HIGH || 0}</strong><ShieldAlert size={17} /></article>
      <article className="panel tree-metric"><span>Inspection due</span><strong>{trees.filter(tree => ['CRITICAL', 'HIGH'].includes(tree.risk)).length}</strong><ClipboardCheck size={17} /></article>
    </div>

    <section className="panel tree-panel">
      <div className="panel-heading tree-list-heading"><div><div className="flex items-center gap-2.5"><h2>Tree register</h2><span className="count-badge">{visibleTrees.length}</span></div><p>Inspection priority is sorted by calculated risk score.</p></div>
        <label className="tree-search"><Search size={14} /><span className="sr-only">Search tree records</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search ID, species or location" /></label>
      </div>
      <div className="tree-filters" aria-label="Filter by risk level">{filters.map(item => <button key={item} type="button" onClick={() => setFilter(item)} className={filter === item ? 'tree-filter tree-filter-active' : 'tree-filter'}>{item}{item === 'Critical' && counts.CRITICAL ? <span>{counts.CRITICAL}</span> : null}</button>)}</div>
      <div className="overflow-x-auto"><table className="tree-table"><caption className="sr-only">Tree records ordered by calculated risk</caption><thead><tr>{['Tree record', 'Condition', 'Soil', 'Tilt', 'Risk score', 'Last inspection', ''].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>
        {visibleTrees.map(tree => <Fragment key={tree.id}>
          <tr key={tree.id} className={tree.risk === 'CRITICAL' || tree.risk === 'HIGH' ? 'tree-priority-row' : ''}>
            <td><strong className="tree-id">{tree.id}</strong><span className="tree-species">{tree.species} · {tree.age} yrs</span><span className="tree-location">{tree.location}</span></td>
            <td><span className={`condition-pill condition-${tree.health.toLowerCase()}`}>{tree.health}</span></td><td>{tree.soil}</td><td>{tree.tilt}&deg;</td>
            <td><div className="tree-risk-score"><strong>{tree.riskScore}</strong><RiskBadge risk={tree.risk} /></div></td><td>{new Date(`${tree.lastInspection}T12:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })}</td>
            <td><div className="tree-actions"><button type="button" className="tree-history-button" onClick={() => setHistoryId(historyId === tree.id ? null : tree.id)}>History</button><button type="button" className="tree-inspect-button" onClick={() => setInspectTree(tree)}>Inspect</button></div></td>
          </tr>
          {historyId === tree.id && <tr key={`${tree.id}-history`} className="history-row"><td colSpan="7"><div className="inspection-history"><div className="history-title"><ClipboardCheck size={14} />Inspection history <span>{tree.history?.length || 0} entries</span></div>{(tree.history || []).map((item, index) => <article key={`${item.date}-${index}`}><time>{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })}</time><div><strong>{item.inspector}</strong><p>{item.notes}</p></div></article>)}</div></td></tr>}
        </Fragment>)}
        {visibleTrees.length === 0 && <tr><td colSpan="7" className="tree-empty">No tree records match this view.</td></tr>}
      </tbody></table></div>
      <div className="tree-table-footer"><span><Leaf size={13} />Risk score combines age, health, soil condition and trunk tilt.</span><span><ArrowDownUp size={12} />Highest priority first</span></div>
    </section>

    {notice && <div className="tree-notice" role="status">{notice}</div>}
    {inspectTree && <div className="tree-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setInspectTree(null); }}><section className="tree-modal panel" role="dialog" aria-modal="true" aria-labelledby="inspection-title"><div className="tree-modal-heading"><div><span className="eyebrow">{inspectTree.id} · {inspectTree.species}</span><h2 id="inspection-title">Record inspection</h2></div><button className="icon-button" onClick={() => setInspectTree(null)} aria-label="Close inspection form"><X size={18} /></button></div><form onSubmit={saveInspection} className="tree-form"><label>Inspection date<input type="date" name="date" defaultValue={today()} required /></label><label>Inspector<input name="inspector" placeholder="Inspector name" required /></label><div className="tree-form-row"><label>Health<select name="health" defaultValue={inspectTree.health}><option>Good</option><option>Fair</option><option>Poor</option></select></label><label>Soil condition<select name="soil" defaultValue={inspectTree.soil}><option>Dry</option><option>Normal</option><option>Moist</option><option>Saturated</option></select></label></div><label>Trunk tilt (degrees)<input type="number" name="tilt" min="0" max="90" defaultValue={inspectTree.tilt} required /></label><label>Findings and follow-up<textarea name="notes" rows="3" placeholder="Describe observations and recommended action" required /></label><div className="tree-form-actions"><button type="button" className="tree-history-button" onClick={() => setInspectTree(null)}>Cancel</button><button className="primary-button" type="submit"><ClipboardCheck size={15} />Save inspection</button></div></form></section></div>}
  </>;
}
