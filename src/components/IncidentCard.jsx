import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import RiskBadge from './RiskBadge';
export default function IncidentCard({ incident }) {
  return <tr><td data-label="Location"><div><div className="font-medium text-neutral-800">{incident.location}</div><div className="overview-incident-id mt-1 text-neutral-400">{incident.id}</div></div></td><td data-label="Hazard Type">{incident.type}</td><td data-label="Risk Level"><RiskBadge risk={incident.risk} /></td><td data-label="Current Status"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />{incident.status}</span></td><td data-label="Action" className="text-right"><Link className="detail-link overview-details-button" to="/incidents" aria-label={`View details for ${incident.id}`}>View Details<ArrowUpRight size={14} /></Link></td></tr>;
}
