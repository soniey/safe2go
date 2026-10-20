import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';
export default function ModulePlaceholder({ title, description, icon: Icon }) {
  return <><PageHeader title={title} description={description} /><section className="panel placeholder-panel"><span className="placeholder-icon"><Icon size={28} strokeWidth={1.4} /></span><span className="small-tag mt-6"><Construction size={12} />STARTER MODULE</span><h2 className="mt-4 text-lg!">Module under development</h2><p className="text-sm text-neutral-500 max-w-md mt-3 leading-6">This workspace is ready for the {title} module. Shared navigation, risk definitions, and simulated data are in place.</p><Link to="/" className="primary-button mt-7"><ArrowLeft size={15} />Back to overview</Link></section></>;
}
