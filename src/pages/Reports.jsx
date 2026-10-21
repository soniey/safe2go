import history from '../data/reportHistory.json';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, RefreshCw, FileDown, ChevronDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RiskBadge from '../components/RiskBadge';
import { useIncidents, formatTime, stages } from '../utils/incidentStore';
import { readRoadVisionIncidents } from '../utils/roadVisionIncidents';
import { treeApi } from '../utils/treeRisk';
import { buildReport, csvText } from '../utils/reports';
import seeds from '../data/incidents.json';
import cameras from '../data/cameras.json';
import '../components/incidents/incidents.css';
import './reports.css';

function Panel({ title, children }) { return <section className="inc-panel report-panel"><div className="inc-panel-head"><h2>{title}</h2></div><div className="report-body">{children}</div></section>; }
function Stats({ items }) { return <div className="inc-stats">{items.map(([label, value, note]) => <div className="inc-stat" key={label}><p>{label}</p><strong className={value === 'Unavailable' ? 'report-stat-unavailable' : undefined}>{value}</strong><span>{note}</span></div>)}</div>; }
export default function Reports() {
  const incidents = useIncidents();
  const [month, setMonth] = useState('2026-10');
  const [view, setView] = useState('internal');
  const [reportType, setReportType] = useState('incident');
  const [trees, setTrees] = useState([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    treeApi.list().then(result => { if (active) { setTrees(result); setError(''); } }).catch(() => { if (active) setError('Tree inspection records could not be loaded. Inspection totals are unavailable.'); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    let auditStates = [];
    const preparePrint = () => {
      auditStates = [...document.querySelectorAll('.reports-page .report-audit-incident')].map(element => ({ element, open: element.open }));
      auditStates.forEach(({ element }) => { element.open = true; });
    };
    const restorePrint = () => {
      auditStates.forEach(({ element, open }) => { element.open = open; });
      auditStates = [];
    };
    window.addEventListener('beforeprint', preparePrint);
    window.addEventListener('afterprint', restorePrint);
    return () => {
      window.removeEventListener('beforeprint', preparePrint);
      window.removeEventListener('afterprint', restorePrint);
      restorePrint();
    };
  }, []);
  let sources = seeds;
  let sourceError = '';
  try { sources = [...seeds, ...readRoadVisionIncidents().filter(item => !seeds.some(seed => seed.id === item.id))]; }
  catch { sourceError = 'Saved Road Vision records could not be read; those records are excluded.'; }
  const allRecords = [...incidents, ...history.incidents];
  const allSources = [...sources, ...history.incidents];
  const report = buildReport(allRecords, allSources, [...trees, ...history.trees], month);
  const historicalMonth = report.records.some(item => item.historical);
  const previousMonth = month ? new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 2, 1)).toISOString().slice(0, 7) : '';
  const previous = buildReport(history.incidents, history.incidents, [], previousMonth);
  const comparable = historicalMonth && report.responseCount >= 3 && previous.responseCount >= 3 && previous.averageResponse > 0;
  const responseChange = comparable ? Math.round((previous.averageResponse - report.averageResponse) / previous.averageResponse * 1000) / 10 : null;
  const improvementText = responseChange === null ? 'Unavailable: at least three timed records in each of two historical demo months are required.' : `${Math.abs(responseChange)}% ${responseChange >= 0 ? 'faster' : 'slower'} than ${previousMonth} (demo detection-to-dispatch averages: ${report.averageResponse} vs ${previous.averageResponse} min; n=${report.responseCount} vs ${previous.responseCount}).`;
  const { records, resolved, inspections } = report;
  const label = month ? new Date(`${month}-01T12:00:00+08:00`).toLocaleDateString('en-MY', { month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }) : 'Select a month';
  const audit = records.flatMap(item => item.timeline.map((event, index) => ({ ...event, incident: item, index })));
  const inspectionValue = error ? 'Unavailable' : report.inspectedTrees;
  const reportTitle = view === 'public' ? 'Community Safety Summary' : reportType === 'tree' ? 'Tree Inspection Report' : 'Incident Report';
  const audienceTitle = view === 'internal' ? 'Internal Management' : 'Public Community Summary';
  const treeStats = [
    ['Trees inspected', inspectionValue, 'Distinct trees in selected month'],
    ['Inspection records', error ? 'Unavailable' : inspections.length, 'Includes repeat inspections'],
    ['Inspection locations', error ? 'Unavailable' : new Set(inspections.map(item => item.location)).size, 'Distinct recorded location labels'],
    ['Inspection personnel', error ? 'Unavailable' : new Set(inspections.map(item => item.inspector).filter(Boolean)).size, 'Distinct recorded inspector labels'],
  ];
  function generate(event, format) {
    event.currentTarget.closest('details')?.removeAttribute('open');
    if (format === 'pdf') window.print();
    else download();
  }
  function download() {
    const rows = view === 'public' ? [
      ['Safe2Go community safety summary', label], ['Data source', 'Simulated demo; incident detection-month cohort'],
      ['Road hazards resolved', resolved.length], ['Potholes repaired', report.potholes], ['Roadside trees inspected', inspectionValue],
      ['Flood / standing-water incidents resolved', report.drainage], ['Response time comparison', improvementText],
    ] : reportType === 'tree' ? [
      ['Safe2Go internal tree inspection report', label], ['Source', 'Shared and report-only simulated inspection records; illustrative locations'],
      ['Distinct trees inspected', inspectionValue], ['Inspection records', error ? 'Unavailable' : inspections.length],
      ['Tree ID', 'Location', 'Inspection date', 'Inspector', 'Findings'],
      ...inspections.map(item => [item.treeId, item.location, item.date, item.inspector, item.notes]),
    ] : [
      ['Safe2Go internal management report', label], ['Source', historicalMonth ? 'Report-only fictional historical month-end snapshot; coordinates illustrative' : 'Shared simulated demo; detection-month cohort, current status; coordinates illustrative'],
      ['Average detection-to-dispatch minutes', report.averageResponse ?? 'Unavailable'], ['Timed sample size', report.responseCount], ['Response time comparison', improvementText], ['Unresolved incidents', records.filter(item => item.isOpen).length], ['High-risk roads', report.highRoads.join('; ') || 'None'], ['Repeated hazards', report.repeated.map(group => group.ids.join(', ')).join('; ') || 'None'], ['Resolved flood / standing-water incidents', report.drainage],
      ['ID', 'Demo location', 'Basemap road', 'Illustrative latitude', 'Illustrative longitude', 'Type', 'Risk', 'Status', 'Team', 'Detected timestamp', 'Response minutes'],
      ...records.map(item => [item.id, item.location, item.coordinates?.basemapRoadName, item.coordinates?.lat, item.coordinates?.lng, item.type, item.risk, item.stageLabel, item.team?.name || 'Unassigned', report.dates.get(item.id), item.responseMinutes]),
      [], ['Audit trail (scripted MYT clock; actor identity not captured)'], ['Incident', 'Event', 'Time on source incident date', 'Note'],
      ...audit.map(event => [event.incident.id, event.type, formatTime(event.at), event.note]),
      [], ['Maintenance cost', 'Not captured'], ['Camera/sensor uptime and accuracy', 'Not captured'],
    ];
    const url = URL.createObjectURL(new Blob(['\uFEFF', csvText(rows)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `safe2go-${view === 'public' ? 'community' : reportType}-${view}-${month}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <div className="inc-page reports-page">
    <PageHeader title="Audit & Reports" description="Management accountability and a clear community safety summary."><div className="heading-meta"><span className="simulation-badge">SIMULATED DATA</span><details className="report-generate" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
        <summary className="inc-btn inc-btn-secondary"><Download size={15} />Generate report<ChevronDown size={14} /></summary>
        <div className="report-generate-options"><span>{reportTitle} · {audienceTitle}</span><button type="button" disabled={!month} onClick={event => generate(event, 'pdf')}><FileDown size={15} />PDF (Save as PDF)</button><button type="button" disabled={!month} onClick={event => generate(event, 'csv')}><Download size={15} />CSV spreadsheet</button></div>
      </details></div></PageHeader>
    <p className="report-print-title">{reportTitle} | {audienceTitle} | {label} | City of Elmina</p>
    <p className="report-pdf-help">PDF export: choose <strong>Save as PDF</strong> in the print dialog. Only the selected report type, audience and month are included.</p>
    <div className="report-toolbar"><div role="group" aria-label="Report audience"><button className={`inc-btn ${view === 'internal' ? 'inc-btn-primary' : 'inc-btn-ghost'}`} aria-pressed={view === 'internal'} onClick={() => setView('internal')}>Internal Management Report</button><button className={`inc-btn ${view === 'public' ? 'inc-btn-primary' : 'inc-btn-ghost'}`} aria-pressed={view === 'public'} onClick={() => setView('public')}>Public Community Safety Summary</button></div><label>Reporting month<input type="month" value={month} onInput={event => setMonth(event.currentTarget.value)} onChange={event => setMonth(event.target.value)} /></label><button className="inc-btn inc-btn-ghost" onClick={() => setRevision(value => value + 1)}><RefreshCw size={14} />Refresh inspections</button></div>
    {view === 'internal' && <div className="report-toolbar"><div role="group" aria-label="Report type"><button type="button" className={`inc-btn ${reportType === 'incident' ? 'inc-btn-primary' : 'inc-btn-ghost'}`} aria-pressed={reportType === 'incident'} onClick={() => setReportType('incident')}>Incident Report</button><button type="button" className={`inc-btn ${reportType === 'tree' ? 'inc-btn-primary' : 'inc-btn-ghost'}`} aria-pressed={reportType === 'tree'} onClick={() => setReportType('tree')}>Tree Inspection Report</button></div></div>}
    <p className="report-context"><strong>Source context:</strong> {view === 'internal' && reportType === 'tree' ? <>Shared Tree Risk inspection records and report-only historical inspections for July, August and September 2026. Records are grouped by inspection date in {label}. Locations are illustrative; historical trees are separate from the operational registry.</> : <>Shared demo incidents and browser-saved response actions, plus separate report-only historical scenarios for July, August and September 2026. Incident metrics cover hazards detected in {label}, using {historicalMonth ? 'a frozen month-end status' : 'their current status'}, rather than work completed during that calendar month. Historical unresolved records are not active work orders. Tree inspections use recorded inspection dates. All locations are illustrative.</>}</p>
    {(error || sourceError) && <p role="alert">{view === 'public' ? `${error} ${sourceError}` : reportType === 'tree' ? error : sourceError}</p>}
    <h2 className="report-active-title">{reportTitle} <span>{label}</span></h2>
    {view === 'internal' ? reportType === 'tree' ? <>
      <Stats items={treeStats} />
      <Panel title="Tree inspection records"><p>{inspectionValue} distinct trees inspected; {error ? 'Unavailable' : inspections.length} recorded inspections.</p><div className="report-table-wrap"><table><thead><tr><th>Tree ID / location</th><th>Date / inspector</th><th>Findings</th></tr></thead><tbody>{inspections.map((item, index) => <tr key={`${item.treeId}-${index}`}><td><strong>{item.treeId}</strong><small>{item.location}</small></td><td>{item.date}<small>{item.inspector}</small></td><td>{item.notes}</td></tr>)}</tbody></table></div>{!inspections.length && !error && <p>No inspections recorded for this month.</p>}</Panel>
    </> : <>
      <Stats items={[[ 'Incidents detected', records.length, label ], ['Unresolved incidents', records.filter(item => item.isOpen).length, historicalMonth ? 'Frozen month-end snapshot' : 'Current state in selected cohort'], ['Average response', report.averageResponse === null ? 'Unavailable' : `${report.averageResponse} min`, `Detection to dispatch; ${report.responseCount} timed records`], ['High-risk roads', report.highRoads.length, 'Open HIGH / CRITICAL hazards']]} />
      <Panel title="Response time comparison"><p>{improvementText}</p><p>Comparison uses equal definitions (detection to dispatch) for historical demo cohorts; it is a descriptive demo comparison, not a measured real-world performance claim.</p></Panel>
      <Panel title="Incident register & location references"><p>Coordinates are exact demo map placements, not verified incident locations. Road labels may differ from the basemap.</p><div className="report-table-wrap"><table><thead><tr>{['Incident / detected', 'Location reference', 'Hazard / risk', 'Response status', 'Assigned team'].map(text => <th key={text}>{text}</th>)}</tr></thead><tbody>{records.map(item => <tr key={item.id}><td>{item.historical ? <strong>{item.id}</strong> : <Link to={`/incidents?incident=${item.id}`}>{item.id}</Link>}{item.historical && <small>Historical demo record</small>}<small>{report.dates.get(item.id)?.replace('T', ' ')}</small></td><td>{item.location}<small>{item.coordinates?.basemapRoadName || 'Basemap road unavailable'}</small><small>{Number.isFinite(item.coordinates?.lat) && Number.isFinite(item.coordinates?.lng) ? `${item.coordinates.lat.toFixed(6)}, ${item.coordinates.lng.toFixed(6)} (illustrative)` : 'Coordinates unavailable'}</small></td><td>{item.type}<br /><RiskBadge risk={item.risk} /></td><td>{item.stageLabel}{item.isOpen && <small>Unresolved</small>}</td><td>{item.team?.name || 'Unassigned'}</td></tr>)}</tbody></table></div>{!records.length && <p>No incidents detected in this month.</p>}</Panel>
      <div className="report-grid"><Panel title="Contractors & response teams">{[...new Map(records.filter(item => item.team).map(item => [item.team.id, item.team])).values()].map(team => <p key={team.id}><strong>{team.name}</strong>: {records.filter(item => item.team?.id === team.id).length} assigned incident(s)</p>)}{!records.some(item => item.team) && <p>No teams assigned in this cohort.</p>}<p>Contractor organisations and contract costs are not captured. Registry-only teams are not part of the Incident Center assignment list.</p></Panel>
      <Panel title="High-risk roads & repeated hazards"><p><strong>Open HIGH / CRITICAL roads:</strong> {report.highRoads.join(', ') || 'None in this cohort'}.</p><p><strong>Repeated hazards:</strong> same road and hazard type with at least two incident records in this cohort; recurrence is not independently verified.</p>{report.repeated.map(group => <p key={`${group.location}-${group.type}`}>{group.location}: {group.type} ({group.ids.join(', ')})</p>)}{!report.repeated.length && <p>No repeated road/type combinations recorded.</p>}</Panel></div>

      <div className="report-grid"><Panel title="Drainage issues"><p>{records.filter(item => ['Flood', 'Standing Water'].includes(item.type)).length} flood / standing-water incidents; {report.drainage} resolved.</p><p>These are drainage-related hazard proxies. A confirmed drain defect or cause is not recorded.</p></Panel><Panel title="Maintenance cost & monitoring performance"><p><strong>Maintenance cost:</strong> Future capability; no cost records available.</p><p><strong>Camera / sensor performance:</strong> {cameras.length} cameras in the shared inventory. Uptime, sensor reliability and verified detection accuracy are not recorded. Detection confidence is not measured accuracy.</p></Panel></div>
      <Panel title="Incident audit trail">
        <p>One row per incident shows its current status. Expand an incident to see every recorded event. Times use the scripted Malaysia demo clock on the source incident date. Actor identity is not captured; this is a prototype event history.</p>
        <div className="report-audit-list">
          {records.map(item => {
            const events = item.timeline.map((event, index) => ({ ...event, index })).sort((a, b) => a.at - b.at || a.index - b.index);
            const latest = events[events.length - 1];
            return <details className="report-audit-incident" key={`${month}-${item.id}`}>
              <summary>
                <span className="report-audit-title"><strong>{item.id}</strong><span>{item.location}</span></span>
                <span className="report-audit-status"><span>{item.historical ? 'Month-end status' : 'Current status'}</span><strong>{item.stageLabel}</strong></span>
                <span className="report-audit-updated"><span>Last event (MYT)</span><strong>{latest ? formatTime(latest.at) : 'Unavailable'}</strong></span>
                <span className="report-audit-count">{events.length} event{events.length === 1 ? '' : 's'}<span className="report-audit-toggle" aria-hidden="true" /></span>
              </summary>
              <div className="report-table-wrap">
                <table aria-label={`Event history for ${item.id}`}>
                  <thead><tr><th scope="col">Event</th><th scope="col">MYT time</th><th scope="col">Note</th></tr></thead>
                  <tbody>{events.map(event => <tr key={event.index}><td>{stages.find(stage => stage.id === event.type)?.label || event.type.replaceAll('_', ' ')}</td><td>{formatTime(event.at)}</td><td>{event.note || 'No note recorded'}</td></tr>)}</tbody>
                </table>
                {!events.length && <p>No workflow events recorded for this incident.</p>}
              </div>
            </details>;
          })}
        </div>
        {!records.length && <p>No workflow events for this month.</p>}
      </Panel>
    </> : <Panel title="This Month in Your Township"><div className="community-intro"><span className="inc-pill">City of Elmina: {label}</span><h2>Safer roads. Visible progress.</h2><p>Community summary of the selected demo cohort. Counts reflect recorded resolutions and inspections.</p></div><Stats items={[[ 'Road hazards resolved', resolved.length, 'Detected this month; now resolved'], ['Potholes repaired', report.potholes, 'Pothole incidents marked resolved'], ['Roadside trees inspected', inspectionValue, 'Distinct trees inspected this month'], ['Flood / standing-water incidents resolved', report.drainage, 'Drainage-related hazard proxy']]} /><p><strong>Average response time comparison:</strong> {improvementText}</p><p>This public summary omits exact locations, team contacts and internal audit notes. Figures are prototype demonstration data.</p></Panel>}
  </div>;
}
