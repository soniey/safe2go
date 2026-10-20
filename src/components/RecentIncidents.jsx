import RiskBadge from './RiskBadge';

const demoTime = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short',
});

export default function RecentIncidents({ incidents, title = 'Recent incidents' }) {
  return (
    <section className="panel mt-6" aria-labelledby="recent-incidents-heading">
      <div className="panel-heading">
        <div>
          <h2 id="recent-incidents-heading">{title}</h2>
          <p>Newest detections first. Times shown in Malaysia time.</p>
        </div>
      </div>
      {incidents.length === 0 ? <p className="p-5 text-xs text-neutral-500">No incidents with detection times are available.</p> : (
        <ol className="divide-y divide-neutral-200">
          {incidents.map(incident => (
            <li key={incident.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{incident.id} · {incident.location}</h3>
                <RiskBadge risk={incident.risk} />
              </div>
              <p className="mt-2 text-xs text-neutral-500">{incident.type} · {incident.status}</p>
              {incident.resolvedAt && <p className="mt-2 text-xs text-neutral-500">Resolved: <time dateTime={incident.resolvedAt}>{demoTime.format(new Date(incident.resolvedAt))} MYT</time></p>}{incident.summary && <p className="mt-2 text-xs text-neutral-500">{incident.summary}</p>}
              <p className="mt-2 text-xs text-neutral-500">
                Detected: <time dateTime={incident.detectedAt}>{demoTime.format(new Date(incident.detectedAt))} MYT</time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
