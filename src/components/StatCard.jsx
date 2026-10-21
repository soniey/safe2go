// tone (optional): a risk level such as 'CRITICAL' or 'WATCH'. Adds the Incident & Response Center's coloured edge when the value is not zero.
export default function StatCard({ label, value, description, icon: Icon, note, tone }) {
  const accent = tone && value !== 0 && value !== '0' ? ` stat-${String(tone).toLowerCase()}` : '';
  return <article className={`panel stat-card${accent}`}><div className="flex justify-between items-center"><p className="text-xs font-medium text-neutral-600">{label}</p><span className="stat-icon"><Icon size={17} strokeWidth={1.7} /></span></div><div className="flex items-end gap-3 mt-3"><strong className="stat-value">{value}</strong>{note && <span className="stat-note">{note}</span>}</div><p className="text-xs text-neutral-500 mt-3">{description}</p></article>;
}
