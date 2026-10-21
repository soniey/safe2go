import { Camera } from 'lucide-react';
import ModulePlaceholder from '../components/ModulePlaceholder';
export default function RoadVision() { return <ModulePlaceholder title="Road Vision" description="Planned module: CCTV verification of flooding, fallen trees, branches and obstructions. Potholes and road damage are extended capabilities." icon={Camera} />; }
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Radio, CameraOff, ScanLine, ArrowUpRight, Plus, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import CameraFeed from '../components/road-vision/CameraFeed';
import { cameras, detections } from '../data/roadVision';
import { createRoadVisionIncident, findIncident, readRoadVisionIncidents } from '../utils/roadVisionIncidents';
import '../components/road-vision/road-vision.css';

const time = value => new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export default function RoadVision() {
  const [cameraId, setCameraId] = useState('CAM-03');
  const [detectionId, setDetectionId] = useState('DET-002');
  const [stored, setStored] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const refresh = () => { try { setStored(readRoadVisionIncidents()); setError(''); } catch (cause) { setError(`Incident storage unavailable: ${cause.message}`); } };
    refresh(); window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  const camera = cameras.find(item => item.id === cameraId);
  const visible = camera.status === 'Online' ? detections.filter(item => item.cameraId === cameraId) : [];
  const detection = visible.find(item => item.id === detectionId);
  const incident = detection && findIncident(detection, stored);
  const activeCount = detections.filter(item => cameras.some(cam => cam.id === item.cameraId && cam.status === 'Online')).length;
  function selectCamera(item) { setCameraId(item.id); setDetectionId(detections.find(d => d.cameraId === item.id)?.id ?? null); setMessage(''); }
  async function createIncident() {
    if (busy || !detection) return;
    setBusy(true); setMessage('');
    try {
      const result = await (navigator.locks?.request ? navigator.locks.request('safe2go-road-vision-incidents', () => createRoadVisionIncident(detection.id)) : Promise.resolve(createRoadVisionIncident(detection.id)));
      setStored(readRoadVisionIncidents()); setError('');
      setMessage(`${result.incident.id} ${result.created ? 'created with status Detected and saved in this browser.' : 'already exists; no duplicate created.'}`);
    } catch (cause) { setError(`Could not save incident: ${cause.message}`); }
    finally { setBusy(false); }
  }
  return <div className="road-vision"><PageHeader title="Road Vision" description="Monitor township road conditions through simulated CCTV hazard intelligence."><span className="simulation-badge"><ScanLine size={14} />Simulated Detection</span></PageHeader>
    <div className="rv-stats">{[
      ['Total Cameras', cameras.length, Camera, 'Shared cameras + labeled demo cameras'],
      ['Online Cameras', cameras.filter(item => item.status === 'Online').length, Radio, 'Available simulated previews'],
      ['Offline Cameras', cameras.filter(item => item.status === 'Offline').length, CameraOff, `${cameras.filter(item => item.status === 'Maintenance').length} additional camera in maintenance`],
      ['Active Detections', activeCount, ScanLine, 'Fixed demo detections on online cameras'],
    ].map(([label, value, icon, description]) => <StatCard key={label} label={label} value={value} icon={icon} description={description} />)}</div>
    <div className="rv-workspace"><section className="panel" aria-label="Camera selection"><div className="panel-heading"><div><h2>Camera network</h2><p>Select a monitoring point</p></div><Camera size={17} /></div><div className="rv-camera-list">{cameras.map(item => <button type="button" className={`rv-camera ${cameraId === item.id ? 'rv-selected' : ''}`} key={item.id} onClick={() => selectCamera(item)} aria-pressed={cameraId === item.id}><span className="rv-row"><strong>{item.id}</strong><span className={`rv-status rv-${item.status.toLowerCase()}`}>{item.status}</span></span><span>{item.location}</span><small>{item.status === 'Online' ? `${detections.filter(d => d.cameraId === item.id).length} detections` : 'No active detections'}{item.id.includes('DEMO') && ' · Demo camera'}</small><small>{item.status === 'Online' ? 'Capture' : 'Last recorded'}: {time(item.capturedAt)} MYT</small></button>)}</div></section>
    <div className="rv-main"><section className="panel overflow-hidden"><div className="panel-heading"><div><h2>{camera.location}</h2><p>{camera.id} · {camera.status} · Simulated capture</p></div><span className="small-tag">Demo Mode</span></div><CameraFeed key={camera.id} camera={camera} detections={visible} selectedId={detectionId} onSelect={id => { setDetectionId(id); setMessage(''); }} /><p className="rv-capture">Capture: <time dateTime={camera.capturedAt}>{time(camera.capturedAt)} MYT</time> · Fixed demo image, no CCTV or AI connection</p></section>
    <div className="rv-details-grid"><section className="panel"><div className="panel-heading"><h2>Detections</h2><span className="count-badge">{visible.length}</span></div><div className="rv-camera-list">{visible.length ? visible.map(item => <button type="button" key={item.id} aria-pressed={detectionId === item.id} className={`rv-camera rv-detection ${detectionId === item.id ? 'rv-selected' : ''}`} onClick={() => { setDetectionId(item.id); setMessage(''); }}><span className="rv-row"><strong>{item.type}</strong><RiskBadge risk={item.risk} /></span><small>{item.id} · {item.confidence}% confidence</small></button>) : <p className="rv-empty">{camera.status === 'Online' ? 'No hazards detected in this simulated capture.' : 'Detections are unavailable while this camera is offline or in maintenance.'}</p>}</div></section>
    <section className="panel" aria-labelledby="rv-detail-heading"><div className="panel-heading"><h2 id="rv-detail-heading">Detection details</h2><ScanLine size={17} /></div><div className="rv-detail-body">{detection ? <><div className="rv-row"><h3>{detection.type}</h3><RiskBadge risk={detection.risk} /></div><p className="rv-description">{detection.description}</p><dl className="rv-facts"><dt>Camera / location</dt><dd>{detection.cameraId} · {detection.location}</dd><dt>Confidence</dt><dd>{detection.confidence}% · Simulated</dd><dt>Detected</dt><dd><time dateTime={detection.detectedAt}>{time(detection.detectedAt)} MYT</time></dd><dt>Detection ID</dt><dd>{detection.id}</dd></dl>{incident ? <><p className="rv-linked"><CheckCircle2 size={14} />Linked incident: {incident.id}</p><Link className="rv-primary" to={`/incidents?incident=${encodeURIComponent(incident.id)}`}>View Existing Incident<ArrowUpRight size={15} /></Link></> : <button type="button" className="rv-primary" onClick={createIncident} disabled={busy}>{busy ? 'Saving incident…' : 'Create Maintenance Incident'}<Plus size={15} /></button>}</> : <p className="rv-empty">Select a detection to inspect the hazard and maintenance options.</p>}
    {message && <p role="status" className="rv-success">{message}</p>}{error && <p role="alert" className="rv-error">{error}</p>}
    <p className="rv-integration">Incidents page integration is pending Member 5. New incidents are saved only in this browser. <Link to="/incidents">Open Incidents</Link></p></div></section></div></div></div></div>;
}
