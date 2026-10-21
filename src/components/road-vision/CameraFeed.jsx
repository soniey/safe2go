import { useState } from 'react';
import { CameraOff } from 'lucide-react';
import { riskStyles } from '../../utils/risk';

export default function CameraFeed({ camera, detections, selectedId, onSelect }) {
  const [failed, setFailed] = useState(false);

  if (camera.status !== 'Online' || !camera.image || failed) {
    return (
      <div className="rv-unavailable">
        <CameraOff size={32} strokeWidth={1.5} aria-hidden="true" />
        <h3>{failed ? 'Preview unavailable' : `Camera ${camera.status.toLowerCase()}`}</h3>
        <p>{camera.id} / {camera.location}</p>
        <p>{failed ? 'Detection details remain available below.' : 'No active feed or current detections available.'}</p>
      </div>
    );
  }

  const aspect = camera.imageAspect;
  const imageSize = {
    width: `${Math.min(100, aspect / (16 / 9) * 100)}%`,
    height: `${Math.min(100, (16 / 9) / aspect * 100)}%`,
  };

  return (
    <div className="rv-feed">
      <div className="rv-image-stage" style={imageSize}>
        <img src={camera.image} onError={() => setFailed(true)} alt={camera.imageAlt} />
        {detections.map(item => (
          <button type="button" key={item.id} className="rv-box"
            style={{
              left: `${item.box.x}%`, top: `${item.box.y}%`,
              width: `${item.box.width}%`, height: `${item.box.height}%`,
              borderColor: riskStyles[item.risk].color,
            }}
            onClick={() => onSelect(item.id)}
            aria-label={`Select ${item.type}, ${item.confidence}% confidence, ${item.risk} risk`}
            aria-pressed={selectedId === item.id}>
            {!camera.embeddedAnnotations && (
              <span style={{ background: riskStyles[item.risk].bg, color: riskStyles[item.risk].fg }}>{item.type} · {item.confidence}%</span>
            )}
          </button>
        ))}
      </div>
      <div className="rv-feed-label"><span>{camera.id}</span><span>{camera.status.toUpperCase()}</span></div>
      <div className="rv-feed-caption">{camera.location}</div>
    </div>
  );
}
