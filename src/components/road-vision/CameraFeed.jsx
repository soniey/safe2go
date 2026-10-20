import { useState } from 'react';
import { CameraOff } from 'lucide-react';
import { riskStyles } from '../../utils/risk';
import scene from './road-scene.svg';
export default function CameraFeed({ camera, detections, selectedId, onSelect }) {
  const [failed, setFailed] = useState(false);
  if (camera.status !== 'Online' || failed) return <div className="rv-unavailable"><CameraOff size={36} /><h3>{failed ? 'Preview unavailable' : `Camera ${camera.status.toLowerCase()}`}</h3><p>{failed ? 'Detection details remain available below.' : 'No active feed or current detections available.'}</p></div>;
  return <div className="rv-feed"><img src={scene} onError={() => setFailed(true)} alt="Illustrated township road for simulated CCTV detections" /><svg className="rv-hazards" viewBox="0 0 800 450" aria-hidden="true">
    {camera.scene === 'pothole' && <ellipse cx="412" cy="338" rx="58" ry="20" fill="#242b30" stroke="#aaa69c" strokeWidth="7" />}
    {camera.scene === 'water' && <path d="M280 275 Q410 247 550 280 L590 355 Q460 382 260 350Z" fill="#92bdce" opacity=".8" />}
    {camera.scene === 'tree' && <><path d="M222 265L550 229" stroke="#73513a" strokeWidth="18" /><path d="M340 250L305 216M400 245L440 217" stroke="#73513a" strokeWidth="9" /><ellipse cx="260" cy="230" rx="65" ry="30" fill="#4c7654" /><path d="M524 378l30-38 42 15 25 38Z" fill="#82796c" /></>}
    </svg><div className="rv-feed-label">SIMULATED FEED · LOCAL ILLUSTRATION</div>{detections.map(item => <button type="button" key={item.id} className={`rv-box ${selectedId === item.id ? 'rv-selected-box' : ''}`} style={{ left: `${item.box.x}%`, top: `${item.box.y}%`, width: `${item.box.width}%`, height: `${item.box.height}%`, borderColor: riskStyles[item.risk].color }} onClick={() => onSelect(item.id)} aria-label={`Select ${item.type}, ${item.confidence}% confidence`} aria-pressed={selectedId === item.id}><span style={{ background: riskStyles[item.risk].color }}>{item.type} · {item.confidence}%</span></button>)}<div className="rv-feed-caption">{camera.id} / {camera.location} · DEMO CAPTURE</div></div>;
}
