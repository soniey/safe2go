import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Camera, Radio, CameraOff, ScanLine, ArrowUpRight, Plus, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import CameraFeed from '../components/road-vision/CameraFeed';
import { useSharedData } from '../utils/sharedData';
import { createRoadVisionIncident } from '../utils/roadVisionIncidents';
import { riskStyles } from '../utils/risk';
import '../components/road-vision/road-vision.css';

const formatter = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short',
});
const time = value => formatter.format(new Date(value));
const detectionCount = (camera, detections) => camera.status === 'Online'
  ? detections.filter(item => item.cameraId === camera.id).length : 0;

export default function RoadVision() {
  const [cameraId, setCameraId] = useState('CAM-03');
  const [detectionId, setDetectionId] = useState('DET-002');
  const { cameras, detections, incidents } = useSharedData();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchParams] = useSearchParams();
  const requestedRoad = searchParams.get('road');
  const requestedCamera = cameras.find(item => item.id === searchParams.get('camera') && (!requestedRoad || item.roadId === requestedRoad))
    ?? cameras.find(item => item.roadId === requestedRoad && item.status === 'Online')
    ?? cameras.find(item => item.roadId === requestedRoad);
  const requestedCameraId = requestedCamera?.id;
  useEffect(() => {
    if (!requestedCameraId) return;
    setCameraId(requestedCameraId);
    setDetectionId(null);
    setMessage('');
  }, [requestedCameraId]);

  const camera = cameras.find(item => item.id === cameraId);
  const visible = camera.status === 'Online' ? detections.filter(item => item.cameraId === cameraId) : [];
  const detection = detectionId === null ? visible[0] : visible.find(item => item.id === detectionId);
  const incident = detection && incidents.find(item => item.id === detection.incidentId || item.detectionId === detection.id);
  const activeCount = cameras.reduce((total, item) => total + detectionCount(item, detections), 0);
  const maintenanceCount = cameras.filter(item => item.status === 'Maintenance').length;
  const metrics = [
    ['Total cameras', cameras.length, Camera, 'Across the township', 'network'],
    ['Online', cameras.filter(item => item.status === 'Online').length, Radio, 'Available to review', 'online'],
    ['Offline', cameras.filter(item => item.status === 'Offline').length, CameraOff, `${maintenanceCount} in maintenance`, 'offline'],
    ['Detections', activeCount, ScanLine, 'In saved camera captures', 'detections'],
  ];

  function selectDetection(id) {
    setDetectionId(id);
    setMessage('');
  }

  function selectCamera(item) {
    setCameraId(item.id);
    selectDetection(item.status === 'Online'
      ? detections.find(record => record.cameraId === item.id)?.id ?? null : null);
  }

  async function createIncident() {
    if (busy || !detection) return;
    setBusy(true);
    setMessage('');
    try {
      const save = () => createRoadVisionIncident(detection.id);
      const result = await (navigator.locks?.request
        ? navigator.locks.request('safe2go-road-vision-incidents', save)
        : Promise.resolve(save()));
      setError('');
      setMessage(result.created ? `${result.incident.id} created.` : `${result.incident.id} already exists.`);
    } catch (cause) {
      setError(`Could not save incident: ${cause.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="road-vision">
      <PageHeader title="Road Vision" description="Review road conditions and reported hazards">
        <span className="simulation-badge">Demo environment</span>
      </PageHeader>
      <div className="rv-stats">
        {metrics.map(([label, value, icon, description, tone]) => (
          <div key={label} className={`rv-metric rv-metric-${tone}`}>
            <StatCard label={label} value={value} icon={icon} description={description} />
          </div>
        ))}
      </div>
      <div className="rv-workspace">
        <section className="panel" aria-label="Camera selection">
          <div className="panel-heading"><h2>Cameras</h2><Camera size={17} aria-hidden="true" /></div>
          <div className="rv-camera-list">
            {cameras.map(item => {
              const count = detectionCount(item, detections);
              const highestRisk = count ? ['CRITICAL', 'HIGH', 'WATCH', 'SAFE'].find(risk =>
                detections.some(record => record.cameraId === item.id && record.risk === risk)) : null;
              return (
                <button type="button" key={item.id}
                  className={`rv-camera ${cameraId === item.id ? 'rv-selected' : ''}`}
                  style={{ '--camera-detection-color': highestRisk ? riskStyles[highestRisk].color : '#e5e5e5' }}
                  onClick={() => selectCamera(item)} aria-pressed={cameraId === item.id}>
                  <strong className="rv-camera-location">{item.location}</strong>
                  <span className="rv-row">
                    <span className="rv-camera-id">{item.id}</span>
                    <span className={`rv-status rv-${item.status.toLowerCase()}`}>{item.status}</span>
                  </span>
                  <small>{item.status === 'Online'
                    ? `${count} ${count === 1 ? 'detection' : 'detections'}${highestRisk ? ` · ${riskStyles[highestRisk].label} risk` : ''}` : 'No active detections'}</small>
                </button>
              );
            })}
          </div>
        </section>
        <div className="rv-main">
          <section className="panel rv-preview" aria-label="Selected camera">
            <div className="panel-heading">
              <div><h2>{camera.location}</h2><p>{camera.id}</p></div>
              <span className={`rv-status rv-${camera.status.toLowerCase()}`}>{camera.status}</span>
            </div>
            <CameraFeed key={camera.id} camera={camera} detections={visible}
              selectedId={detection?.id} onSelect={selectDetection} />
            <p className="rv-capture">
              {camera.status === 'Online' ? 'Captured' : 'Last recorded'}{' '}
              <time dateTime={camera.capturedAt}>{time(camera.capturedAt)} MYT</time>
            </p>
          </section>
          <div className="rv-details-grid">
            <section className="panel" aria-label="Detections">
              <div className="panel-heading"><h2>Detections</h2><span className="count-badge">{visible.length}</span></div>
              <div className="rv-detection-list">
                {visible.length ? visible.map(item => (
                  <button type="button" key={item.id} aria-pressed={detection?.id === item.id}
                    className={`rv-camera rv-detection ${detection?.id === item.id ? 'rv-selected' : ''}`}
                    onClick={() => selectDetection(item.id)}>
                    <span className="rv-row"><strong>{item.type}</strong><RiskBadge risk={item.risk} /></span>
                    <small>{item.confidence}% confidence</small>
                  </button>
                )) : <p className="rv-empty">{camera.status === 'Online'
                  ? 'No hazards detected.' : 'Detections are unavailable while this camera is offline or in maintenance.'}</p>}
              </div>
            </section>
            <section className="panel" aria-labelledby="rv-detail-heading">
              <div className="panel-heading"><h2 id="rv-detail-heading">Detection details</h2></div>
              <div className="rv-detail-body">
                {detection ? (
                  <>
                    <div className="rv-hazard-heading"><h3>{detection.type}</h3><RiskBadge risk={detection.risk} /></div>
                    <p className="rv-description">{detection.description.replace(/^Simulated /, '').replace(/^A simulated /, 'A ')}</p>
                    <dl className="rv-facts">
                      <div><dt>Confidence</dt><dd>{detection.confidence}%</dd></div>
                      <div><dt>Detected</dt><dd><time dateTime={detection.detectedAt}>{time(detection.detectedAt)} MYT</time></dd></div>
                      <div><dt>Detection ID</dt><dd>{detection.id}</dd></div>
                    </dl>
                    {incident ? (
                      <>
                        <p className="rv-linked"><CheckCircle2 size={14} aria-hidden="true" />{incident.id} ? {incident.status}</p>
                        <Link className="rv-primary" to={`/incidents?incident=${encodeURIComponent(incident.id)}`}>
                          View incident<ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                      </>
                    ) : (
                      <button type="button" className="rv-primary" onClick={createIncident} disabled={busy}>
                        <Plus size={15} aria-hidden="true" />{busy ? 'Saving…' : 'Create incident'}
                      </button>
                    )}
                  </>
                ) : <p className="rv-empty">Select a detection to review its details.</p>}
                {message && <p role="status" className="rv-success">{message}</p>}
                {error && <p role="alert" className="rv-error">{error}</p>}
                <p className="rv-integration">New demo incidents are saved in this browser.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
