import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, ArrowUpRight, Camera, CheckCircle2, Clock3,
  CloudDrizzle, CloudRain, Gauge, Info, MapPin, Radio,
  ShieldAlert, TrendingUp, Waves, Wind,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import './flood-weather.css';
import { useSharedData } from '../utils/sharedData';

const FILTERS = ['All roads', 'Critical', 'High', 'Watch', 'Safe'];
const formatTime = value => new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value));
const formatDate = value => new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric',
}).format(new Date(value));
const colorByRisk = { SAFE: '#15803d', WATCH: '#a37308', HIGH: '#c26617', CRITICAL: '#cc4141' };

// Base location/incident/sensor facts always come from the team's shared files.
// Other road scores, chart histories and forecast are explicitly simulated demo extensions.
function buildFloodRoads({ roads, floodReadings, incidents, floodDemo }) {
  return floodDemo.roads.map(demo => {
    const road = roads.find(item => item.id === demo.roadId);
    const reading = floodReadings.find(item => item.roadId === demo.roadId);
    const floodIncident = incidents.find(item => item.roadId === demo.roadId && item.type === 'Flood');
    const history = demo.history.map((point, index) => ({
      ...point,
      levelCm: reading && index === demo.history.length - 1 ? reading.waterLevelCm : point.levelCm,
      label: formatTime(point.time),
    }));
    const latest = history.at(-1);
    const previous = history.at(-2);
    const minutes = previous ? (new Date(latest.time) - new Date(previous.time)) / 60000 : 0;
    const rate = minutes > 0 ? (latest.levelCm - previous.levelCm) / minutes : 0;
    const score = road.floodScore;
    return {
      ...demo,
      id: demo.roadId,
      name: road?.name ?? demo.roadId,
      score,
      risk: road.floodRisk,
      level: reading?.waterLevelCm ?? latest.levelCm,
      rate,
      history,
      cameraId: reading?.cameraId ?? null,
      incident: floodIncident ?? null,
      isSharedReading: Boolean(reading),
    };
  }).sort((left, right) => right.score - left.score);
  }



  function Metric({ label, value, description, icon, note }) {
    return <StatCard label={label} value={value} description={description} icon={icon} note={note} />;
  }

  function WaterTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return <div className="fw-tooltip"><span>{label} MYT</span><strong>{payload[0].value} cm</strong><small>Simulated water level</small></div>;
  }

  export default function FloodWeather() {
    const data = useSharedData();
    const { weather, floodDemo, incidents } = data;
    const floodRoads = useMemo(() => buildFloodRoads(data), [data]);
    const peakRain = Math.max(...floodDemo.forecast.map(item => item.rainfallMmH));
    const floodIncidents = incidents.filter(item => ['Flood', 'Standing Water'].includes(item.type) && item.isOpen);
    const [selectedRoadId, setSelectedRoadId] = useState('RD-001');
    const [filter, setFilter] = useState('All roads');
    const selected = floodRoads.find(road => road.id === selectedRoadId) ?? floodRoads[0];
    const listed = useMemo(() => floodRoads.filter(road =>
      filter === 'All roads' || road.risk === filter.toUpperCase()
    ), [filter, floodRoads]);

    const highest = floodRoads[0];
    const statusText = selected.rate >= 1 ? 'Rapidly rising' : selected.rate > 0 ? 'Slowly rising' : 'Stable';
    const rateText = `${selected.rate > 0 ? '+' : ''}${selected.rate.toFixed(1)} cm/min`;
    const maxLevel = Math.max(20, Math.ceil((Math.max(...selected.history.map(point => point.levelCm)) + 3) / 5) * 5);

    return <div className="flood-page">
      <PageHeader
        title="Flood & Weather"
        description="Road-level flood intelligence, rainfall outlook and early response prioritisation."
      >
        <div className="heading-meta">
          <span className="simulation-badge"><span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />SIMULATED DATA</span>
          <span className="fw-updated"><Clock3 size={12} />Last Updated: {formatDate(weather.updatedAt)}, {formatTime(weather.updatedAt)} MYT</span>
        </div>
      </PageHeader>

      <div className="fw-context">
        <span><span className="fw-live-dot" />City of Elmina · Flood monitoring</span>
        <span><CloudDrizzle size={14} />{weather.temperatureC}°C <i />{weather.condition} <span className="fw-muted">(simulated)</span></span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Monitored Roads" value={floodRoads.length} description="Road-level flood watchlist" icon={MapPin} note="Elmina" />
        <Metric label="Active Flood Alerts" value={floodIncidents.length} description="Linked to shared incident records" icon={ShieldAlert} note="Action required" />
        <Metric label="Highest Flood Risk" value={`${highest.score}%`} description={`${highest.name} · ${highest.risk}`} icon={Gauge} note="Risk index" />
        <Metric label="Peak Forecast Rain" value={`${peakRain} mm/h`} description="Highest simulated hourly rainfall" icon={CloudRain} note="Next 4 hours" />
      </div>

      <div className="fw-split fw-top-split">
        <section className="panel fw-watchlist" aria-labelledby="fw-list-title">
          <div className="panel-heading">
            <div><div className="fw-title-row"><h2 id="fw-list-title">Flood-risk watchlist</h2><span className="count-badge">{floodRoads.length}</span></div><p>Select a road to review the monitoring signals.</p></div>
            <span className="small-tag"><Activity size={12} />Risk ranked</span>
          </div>
          <div className="fw-filters" aria-label="Filter flood risk level">
            {FILTERS.map(option => <button key={option} type="button" onClick={() => {
              setFilter(option);
              const matches = floodRoads.filter(road => option === 'All roads' || road.risk === option.toUpperCase());
              if (matches.length && !matches.some(road => road.id === selectedRoadId)) setSelectedRoadId(matches[0].id);
            }} aria-pressed={filter === option} className={`fw-filter ${filter === option ? 'fw-filter-active' : ''}`}>{option}</button>)}
          </div>
          <div className="fw-road-list">
            {listed.length ? listed.map(road => <button
              key={road.id} type="button" aria-pressed={selected.id === road.id}
              onClick={() => setSelectedRoadId(road.id)}
              className={`fw-road ${selected.id === road.id ? 'fw-road-selected' : ''}`}
            >
              <span className="fw-road-left"><span className="fw-road-pin" style={{ background: colorByRisk[road.risk] }} /><span><strong>{road.name}</strong><small>{road.id} · {road.isSharedReading ? 'Linked flood reading' : 'Demo estimate'}</small></span></span>
              <span className="fw-road-right"><strong>{road.score}<small>/100</small></strong><RiskBadge risk={road.risk} /></span>
            </button>) : <p className="fw-empty">No roads in this flood-risk category.</p>}
          </div>
          <div className="fw-panel-note"><Info size={13} />Flood scores are simulated, not calibrated probabilities of flooding.</div>
        </section>

        <section className="panel fw-detail" aria-labelledby="fw-detail-title">
          <div className="panel-heading">
            <div><h2 id="fw-detail-title">Selected road intelligence</h2><p>Monitoring signals and recommended priority</p></div>
            <RiskBadge risk={selected.risk} />
          </div>
          <div className="fw-detail-body">
            <div className="fw-location"><MapPin size={15} /><span>{selected.name}</span><small>{selected.id}</small></div>
            <div className="fw-score-line">
              <div><span className="fw-mini-label">Flood risk index</span><div className="fw-large-score">{selected.score}<span>/100</span></div><span className="fw-score-caption">{selected.risk === 'CRITICAL' ? 'Immediate review recommended' : selected.risk === 'HIGH' ? 'Prioritise inspection' : selected.risk === 'WATCH' ? 'Monitor closely' : 'Routine monitoring'}</span></div>
              <div className="fw-score-meter" role="img" aria-label={`Flood risk index ${selected.score} out of 100`}><div style={{ width: `${selected.score}%`, background: colorByRisk[selected.risk] }} /></div>
            </div>
            <div className="fw-reading-grid">
              <div className="fw-reading"><Waves size={16} /><span>Water level</span><strong>{selected.level} <small>cm</small></strong></div>
              <div className="fw-reading"><TrendingUp size={16} /><span>Rate of rise</span><strong>{rateText}</strong></div>
              <div className="fw-reading"><Activity size={16} /><span>Level trend</span><strong className="fw-reading-text">{statusText}</strong></div>
            </div>
            <div className="fw-risk-drivers"><h3>Why this road was flagged</h3><ul>{selected.riskFactors.map(factor => <li key={factor}><span className="fw-driver-dot" />{factor}</li>)}</ul></div>
            <div className="fw-source"><Radio size={13} /><span>{selected.source}</span></div>
          </div>
        </section>
      </div>

      <div className="fw-split fw-lower-split">
        <section className="panel fw-chart-panel" aria-labelledby="fw-chart-title">
          <div className="panel-heading"><div><h2 id="fw-chart-title">Water level trend</h2><p>{selected.name} · recent simulated readings</p></div><span className="small-tag"><Waves size={12} />cm · MYT</span></div>
          <div className="fw-chart-wrap" role="img" aria-label={`Water level history for ${selected.name}: ${selected.history.map(item => `${item.label} ${item.levelCm} centimetres`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selected.history} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
                <defs><linearGradient id="fwWaterGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6b9bab" stopOpacity={0.22} /><stop offset="100%" stopColor="#6b9bab" stopOpacity={0.015} /></linearGradient></defs>
                <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 4" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#929292' }} axisLine={false} tickLine={false} minTickGap={13} />
                <YAxis domain={[0, maxLevel]} tick={{ fontSize: 10, fill: '#929292' }} axisLine={false} tickLine={false} />
                <Tooltip content={<WaterTooltip />} />
                <Area type="monotone" dataKey="levelCm" stroke="#527c8a" strokeWidth={2.5} fill="url(#fwWaterGradient)" activeDot={{ r: 5, strokeWidth: 0, fill: '#527c8a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="fw-chart-footer"><span><span className="fw-legend-line" />Water level (cm)</span><span>Latest: <strong>{selected.level} cm</strong> · <strong>{rateText}</strong></span></div>
        </section>

        <section className="panel fw-forecast" aria-labelledby="fw-forecast-title">
          <div className="panel-heading"><div><h2 id="fw-forecast-title">Rainfall forecast</h2><p>Upcoming hours · simulated weather outlook</p></div><CloudRain size={17} color="#909090" /></div>
          <div className="fw-forecast-body">
            <div className="fw-weather-now"><div><CloudDrizzle size={19} /><span><strong>{weather.temperatureC}°C</strong><small>{weather.condition} · current</small></span></div><span>{floodDemo.currentRainfallMmH} mm/h</span></div>
            {floodDemo.forecast.map(item => <div className="fw-forecast-row" key={item.time}>
              <span className="fw-forecast-time">{formatTime(item.time)}</span>
              <span className="fw-forecast-bar"><span style={{ width: `${(item.rainfallMmH / peakRain) * 100}%` }} /></span>
              <strong>{item.rainfallMmH} <small>mm/h</small></strong>
              <span className="fw-wind"><Wind size={12} />{item.windKmh}</span>
            </div>)}
            <div className="fw-forecast-key"><CloudRain size={12} />Rainfall intensity <span><Wind size={12} />Wind (km/h)</span></div>
            <div className="fw-outlook"><Info size={14} /><p>{floodDemo.rainfallNote}</p></div>
          </div>
        </section>
      </div>

      <section className="panel fw-response" aria-labelledby="fw-response-title">
        <div className="panel-heading"><div><h2 id="fw-response-title">Verification & response workflow</h2><p>Turn road-level risk intelligence into an operational decision.</p></div><span className="small-tag">DETECT → RESPOND</span></div>
        <div className="fw-response-content">
          <div className="fw-response-steps"><div><span className="fw-step-icon"><Gauge size={17} /></span><strong>1. Assess</strong><small>{selected.name}: {selected.risk} flood risk</small></div><ArrowRight className="fw-step-arrow" size={16} /><div><span className="fw-step-icon"><Camera size={17} /></span><strong>2. Verify</strong><small>{selected.cameraId ? `${selected.cameraId} linked to flood reading` : 'Inspect available road cameras'}</small></div><ArrowRight className="fw-step-arrow" size={16} /><div><span className="fw-step-icon"><CheckCircle2 size={17} /></span><strong>3. Respond</strong><small>{selected.incident ? `${selected.incident.id} · ${selected.incident.status}` : 'No linked flood incident'}</small></div></div>
          <div className="fw-response-actions"><Link to="/vision" className="fw-action-link"><Camera size={14} />Open Road Vision<ArrowUpRight size={14} /></Link><Link to="/incidents" className="fw-action-link fw-action-primary"><ShieldAlert size={14} />Incident Center<ArrowUpRight size={14} /></Link></div>
        </div>
      </section>
      <p className="fw-disclaimer"><Info size={12} />Demo only. Forecast, historical trends and non-sensor road flood scores are simulated; the 0–100 risk index is not a real-world flood probability. Verify on site before operational decisions.</p>
    </div>;
  }
