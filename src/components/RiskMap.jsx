import { useEffect, useRef, useState } from 'react';
import { loadMapFilters, saveMapFilters } from '../utils/mapFilters';
import HazardDetails from './HazardDetails';
import { MapPin } from 'lucide-react';
import LeafletHazardMap from './LeafletHazardMap';
import { useDashboard } from '../utils/dashboard';
import { riskLevels, riskStyles } from '../utils/risk';



export default function RiskMap({ roadFocus, onRoadRiskChange }) {
  const { hazards, roads } = useDashboard();
  const hazardTypes = [...new Set(['Flood', 'Standing Water', 'Tree Fall Risk', 'Pothole', 'Fallen Tree', 'Fallen Branch', 'Road Obstruction', 'Road Blockage', ...hazards.map(hazard => hazard.type)])];
  const [selectedId, setSelectedId] = useState(null);
  const detailsRef = useRef(null);
  function viewDetails() {
    detailsRef.current?.focus({ preventScroll: true });
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const [savedFilters] = useState(() => loadMapFilters(hazardTypes, riskLevels));
  const [hazardType, setHazardType] = useState(savedFilters.hazardType);
  const [riskLevel, setRiskLevel] = useState(savedFilters.riskLevel);
  const [canPersist, setCanPersist] = useState(true);
  useEffect(() => {
    setCanPersist(saveMapFilters({ hazardType, riskLevel }));
  }, [hazardType, riskLevel]);
  const visibleHazards = hazards.filter(hazard =>
    (hazardType === 'ALL' || hazard.type === hazardType) &&
    (riskLevel === 'ALL' || hazard.risk === riskLevel)
  );
  const selectedHazard = visibleHazards.find(hazard => hazard.id === selectedId);

  function resetFilters() {
    setHazardType('ALL');
    setRiskLevel('ALL');
    setSelectedId(null);
  }
  return <section className="panel overflow-hidden"><div className="panel-heading"><div><h2>Township Risk Map</h2><p>Core climate hazards and extended detections across monitored roads.</p></div><span className="small-tag"><MapPin size={12} />Elmina</span></div><form aria-label="Map hazard filters" className="flex flex-wrap items-end gap-3 border-b border-neutral-200 p-4" onSubmit={event => event.preventDefault()}>
  <label className="flex flex-col gap-1 text-xs text-neutral-500">
    Hazard type
    <select className="rounded border border-neutral-200 bg-white p-2 text-neutral-800" value={hazardType} onChange={event => { setHazardType(event.target.value); setSelectedId(null); }}>
      <option value="ALL">All hazard types</option>
      {hazardTypes.map(type => <option key={type} value={type}>{type}</option>)}
    </select>
  </label>
  <label className="flex flex-col gap-1 text-xs text-neutral-500">
    Risk level
    <select className="rounded border border-neutral-200 bg-white p-2 text-neutral-800" value={riskLevel} onChange={event => { setRiskLevel(event.target.value); setSelectedId(null); }}>
      <option value="ALL">All risk levels</option>
      {riskLevels.map(risk => <option key={risk} value={risk}>{risk}</option>)}
    </select>
  </label>
  <button type="button" className="detail-link p-2" onClick={resetFilters}>Reset filters</button>
  <p className="w-full text-xs text-neutral-500" role="status">Showing {visibleHazards.length} of {hazards.length} active hazards. Filters apply to hazard markers only.</p>
<p className="w-full text-xs text-neutral-500">{canPersist ? 'Map filters are remembered on this browser.' : 'Browser storage is unavailable. Filters will reset when you refresh.'}</p></form><LeafletHazardMap onViewDetails={viewDetails} roadFocus={roadFocus} onRoadRiskChange={onRoadRiskChange} roads={roads} allHazards={hazards} hazards={visibleHazards} selectedId={selectedId} onSelect={setSelectedId} /><div className="map-legend"><span className="text-neutral-400 mr-auto">Risk level</span>{riskLevels.map(risk => <span key={risk}><i style={{ background: riskStyles[risk].color }} />{risk}</span>)}</div><div id="map-hazard-details" ref={detailsRef} tabIndex={-1} className="scroll-mt-24 border-t border-neutral-200 p-5" aria-live="polite">{selectedHazard ? <HazardDetails hazard={selectedHazard} onClose={() => setSelectedId(null)} /> : visibleHazards.length === 0 ? <p className="text-xs text-neutral-500">No active hazards match these filters. Change a filter or reset to show all hazards.</p> : <p className="text-xs text-neutral-500">Select a hazard marker to view its details. Locations are illustrative, not verified geography.</p>}</div></section>;
}
