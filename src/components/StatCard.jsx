export default function StatCard({ label, value, description, icon: Icon, note }) {
  return <article className="panel stat-card"><div className="flex justify-between items-center"><p className="text-xs font-medium text-neutral-600">{label}</p><span className="stat-icon"><Icon size={17} strokeWidth={1.7} /></span></div><div className="flex items-end gap-3 mt-3"><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></div><p className="text-xs text-neutral-500 mt-3">{description}</p></article>;
}
