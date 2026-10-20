import RiskBadge from './RiskBadge';

export default function HazardDetails({ hazard, onClose }) {
  const detectionDate = hazard.detectedAt ? new Date(hazard.detectedAt) : null;
  const detectionTime = detectionDate && !Number.isNaN(detectionDate.getTime())
    ? new Intl.DateTimeFormat('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short',
      }).format(detectionDate) + ' MYT'
    : 'Not provided in demo data';

  return (
    <section aria-labelledby="selected-hazard-heading">
      <div className="flex items-center justify-between gap-3">
        <h3 id="selected-hazard-heading" className="text-sm font-semibold">Hazard details: {hazard.id}</h3>
        <button type="button" className="detail-link" onClick={onClose}>Close details</button>
      </div>
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div><dt className="text-neutral-500">Location</dt><dd className="mt-1">{hazard.location}</dd></div>
        <div><dt className="text-neutral-500">Hazard type</dt><dd className="mt-1">{hazard.type}</dd></div>
        <div><dt className="text-neutral-500">Risk level</dt><dd className="mt-1"><RiskBadge risk={hazard.risk} /></dd></div>
        <div><dt className="text-neutral-500">Incident status</dt><dd className="mt-1">{hazard.status}</dd></div>
        <div><dt className="text-neutral-500">Detection time</dt><dd className="mt-1">{detectionTime}{hazard.simulated && detectionDate && !Number.isNaN(detectionDate.getTime()) && <span> (simulated)</span>}</dd></div>
        {hazard.cameraId && <div><dt className="text-neutral-500">Camera</dt><dd className="mt-1">{hazard.cameraId}</dd></div>}
        {hazard.treeId && <div><dt className="text-neutral-500">Tree ID</dt><dd className="mt-1">{hazard.treeId}</dd></div>}
        {hazard.originalSeverity && <div><dt className="text-neutral-500">Original demo severity</dt><dd className="mt-1">{hazard.originalSeverity}</dd></div>}
      </dl>
      {hazard.summary && <p className="mt-4 text-xs text-neutral-500">{hazard.summary}</p>}
      <p className="mt-3 text-xs text-neutral-500">Simulated incident. Map position is illustrative and is not a verified geographical location.</p>
    </section>
  );
}
