import { Camera } from 'lucide-react';
import { formatTime } from '../../utils/incidentStore';
import { eventLabels } from './labels';

export default function IncidentTimeline({ timeline }) {
  return (
    <ol className="inc-log">
      {timeline.map((event, index) => (
        <li key={`${event.type}-${index}`} className={`inc-log-${event.type}`}>
          <span className="inc-mono inc-log-time">{formatTime(event.at)}</span>
          <span className="inc-log-dot" aria-hidden="true" />
          <span>
            <strong>{event.label || eventLabels[event.type] || event.type}</strong>
            {event.by && <span className="inc-log-by"> · {event.by}</span>}
            {event.note && <span className="inc-log-note">{event.note}</span>}
            {event.photo && <span className="inc-log-photo"><Camera size={12} aria-hidden="true" />Photo attached</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
