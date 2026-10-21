import { Check } from 'lucide-react';
import { stages, formatTime } from '../../utils/incidentStore';

// Stepper: Detected → Verified → Assigned → Accepted → En route → On site → Working → Resolved (→ Reopened if the road was closed).
export default function ResponseProgress({ incident }) {
  const steps = stages.filter(step => step.id !== 'reopened' || incident.roadEverClosed);
  const current = steps.findIndex(step => step.id === incident.stage);
  const timeOf = id => [...incident.timeline].reverse().find(event => event.type === id)?.at;
  return (
    <ol className="inc-progress" aria-label="Response progress">
      {steps.map((step, index) => {
        const state = index < current || (index === current && !incident.isOpen) ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={step.id} className={`is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="inc-step-dot">{state === 'done' ? <Check size={11} strokeWidth={3} aria-hidden="true" /> : index + 1}</span>
            <span className="inc-step-label">{step.short}</span>
            <span className="inc-mono inc-step-time">{index <= current ? formatTime(timeOf(step.id)) : '—'}</span>
          </li>
        );
      })}
    </ol>
  );
}
