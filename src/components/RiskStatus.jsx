import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ShieldAlert } from 'lucide-react';
import { useDashboard } from '../utils/dashboard';
import { riskStyles } from '../utils/risk';
import RiskBadge from './RiskBadge';

export default function RiskStatus({ selectedRisk = 'ALL', onSelectRisk }) {
  const { distribution, overallRisk, roads } = useDashboard();
  return (
    <section className="panel risk-status" aria-labelledby="township-risk-heading">
      <div className="panel-heading"><div><h2 id="township-risk-heading">Township Risk Status</h2><p>Across {roads.length} monitored roads.</p></div><ShieldAlert size={17} className="text-neutral-400" /></div>
      <div className="flex justify-between items-center px-5 pt-4 text-xs"><span>Overall risk</span><RiskBadge risk={overallRisk} /></div>
      <div className="risk-chart" role="group" aria-label="Select a road risk on the chart or use the risk buttons below">
        <ResponsiveContainer width="100%" height="100%"><PieChart>
          <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={73} paddingAngle={5} stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false} onClick={entry => onSelectRisk?.(entry.name)}>
            {distribution.map(item => <Cell key={item.name} fill={riskStyles[item.name].color} opacity={selectedRisk === 'ALL' || selectedRisk === item.name ? 1 : 0.35} style={{ cursor: 'pointer' }} />)}
          </Pie>
        </PieChart></ResponsiveContainer>
        <div className="chart-center"><strong>{roads.length}</strong><span>monitored roads</span></div>
      </div>
      <div className="risk-distribution">{distribution.map(item => (
        <button type="button" key={item.name} className="flex items-center justify-between gap-2 rounded p-1 text-xs" aria-label={`Show ${item.name} roads on map (${item.value})`} aria-pressed={selectedRisk === item.name} onClick={() => onSelectRisk?.(item.name)}>
          <span className="flex items-center gap-2"><i style={{ background: riskStyles[item.name].color }} />{riskStyles[item.name].label}</span><strong>{item.value}<span className="text-neutral-400 font-normal ml-1">{item.value === 1 ? 'road' : 'roads'}</span></strong>
        </button>
      ))}</div>
      <div className="risk-footnote"><p>Click a segment or risk label to show matching roads on the map. Township totals stay unchanged.</p><button type="button" className="detail-link mt-3" onClick={() => onSelectRisk?.('ALL')}>Show all roads on map</button></div>
    </section>
  );
}
