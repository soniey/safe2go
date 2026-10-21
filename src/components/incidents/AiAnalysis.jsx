import { useEffect, useMemo, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

// Splits "**bold**" markers into segments. Text without markers gets its numbers and risk words bolded automatically.
export function parseBold(text = '') {
  const source = text.includes('**')
    ? text
    : text.replace(/(\d+(?:\.\d+)?\s?(?:%|cm\/min|cm|min)|\b(?:CRITICAL|HIGH|WATCH)\b)/g, '**$1**');
  return source.split('**').map((part, index) => ({ text: part, bold: index % 2 === 1 })).filter(part => part.text);
}

export function BoldText({ text }) {
  return parseBold(text).map((part, index) => (part.bold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>));
}

// Remembers which analyses already "typed" during this visit, so going back to an incident shows it instantly.
const typedOnce = new Set();
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const CHARS_PER_SECOND = 85;
const THINKING_MS = 700;

/**
 * "Why it was flagged" written out like an AI typing it.
 * The animation is visual only: screen readers get the full text straight away.
 */
export default function AiAnalysis({ id, text, sources = [] }) {
  const segments = useMemo(() => parseBold(text), [text]);
  const total = useMemo(() => segments.reduce((sum, part) => sum + part.text.length, 0), [segments]);
  const cacheKey = `${id}:${text}`;
  const skip = typedOnce.has(cacheKey) || prefersReducedMotion();
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState(skip ? 'done' : 'thinking');
  const [shown, setShown] = useState(skip ? total : 0);

  useEffect(() => {
    if (phase === 'done') return undefined;
    let frame;
    let timer;
    if (phase === 'thinking') {
      timer = setTimeout(() => setPhase('typing'), THINKING_MS);
    } else {
      const started = performance.now();
      const tick = now => {
        const next = Math.min(total, Math.floor(((now - started) / 1000) * CHARS_PER_SECOND));
        setShown(next);
        if (next < total) frame = requestAnimationFrame(tick);
        else { typedOnce.add(cacheKey); setPhase('done'); }
      };
      frame = requestAnimationFrame(tick);
    }
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [phase, total, cacheKey, run]);

  function regenerate() {
    typedOnce.delete(cacheKey);
    setShown(0);
    setPhase(prefersReducedMotion() ? 'done' : 'thinking');
    if (prefersReducedMotion()) setShown(total);
    setRun(value => value + 1);
  }

  let remaining = shown;
  const visible = segments.map((part, index) => {
    if (remaining <= 0) return null;
    const slice = part.text.slice(0, remaining);
    remaining -= slice.length;
    return part.bold ? <strong key={index}>{slice}</strong> : <span key={index}>{slice}</span>;
  });

  return (
    <div className="inc-ai">
      <div className="inc-ai-head">
        <p className="inc-label"><Sparkles size={13} aria-hidden="true" />Why it was flagged</p>
        <span className="inc-ai-badge"><Sparkles size={11} aria-hidden="true" />Safe2Go AI</span>
        {phase === 'done' && (
          <button type="button" className="inc-ai-rerun" onClick={regenerate} aria-label="Run the AI analysis again" title="Run the analysis again">
            <RefreshCw size={13} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="sr-only">{segments.map(part => part.text).join('')}</p>
      {phase === 'thinking' ? (
        <p className="inc-ai-thinking" aria-hidden="true">Analysing sensor, CCTV and weather data<span className="inc-dots"><i /><i /><i /></span></p>
      ) : (
        <p className="inc-ai-text" aria-hidden="true">{visible}{phase === 'typing' && <span className="inc-caret" />}</p>
      )}
      {phase === 'done' && sources.length > 0 && (
        <ul className="inc-evidence">
          {sources.map(item => <li key={item.source}><span>{item.source}</span>{item.value}</li>)}
        </ul>
      )}
    </div>
  );
}
