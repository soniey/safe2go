import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import RiskBadge from './RiskBadge';
export default function IncidentCard({ incident }) {
  return <tr><td><div className="font-medium text-neutral-800">{incident.location}</div><div className="mt-1 text-[11px] text-neutral-400">{incident.id}</div></td><td>{incident.type}</td><td><RiskBadge risk={incident.risk} /></td><td><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />{incident.status}</span></td><td className="text-right"><Link className="detail-link" to="/incidents" aria-label={`View details for ${incident.id}`}>View Details<ArrowUpRight size={14} /></Link></td></tr>;
}
