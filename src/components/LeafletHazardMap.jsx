import RiskBadge from './RiskBadge';
import { useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { riskStyles } from '../utils/risk';

// Approximate demo viewport only; not a verified township boundary or hazard location.
const demoCenter = [3.1785, 101.5090];

function MapViewport({ positions, focusKey }) {
  const map = useMap();
  const positionKey = JSON.stringify(positions);
  useEffect(() => {
    if (focusKey !== '0:0:0') map.getContainer().scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [map, focusKey]);
  useEffect(() => {
    const points = JSON.parse(positionKey);
    if (points.length) map.fitBounds(points, { padding: [45, 45], maxZoom: 17, animate: false });
    else map.setView(demoCenter, 14);
  }, [map, positionKey, focusKey]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function LeafletHazardMap({ hazards, roads, allHazards, selectedId, onSelect, roadFocus, onRoadRiskChange, onViewDetails }) {
  const roadDetailsRef = useRef(null);
  function viewRoadDetails() {
    roadDetailsRef.current?.focus({ preventScroll: true });
    roadDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const [tileError, setTileError] = useState(false);
  const [showRoads, setShowRoads] = useState(true);
  const [selectedRoadId, setSelectedRoadId] = useState(null);
  const [roadSelectionRequest, setRoadSelectionRequest] = useState(0);
  const [hazardSelectionRequest, setHazardSelectionRequest] = useState(0);
  const selectedHazard = hazards.find(hazard => hazard.id === selectedId);
  const roadRisk = roadFocus?.risk ?? 'ALL';
  useEffect(() => {
    if (roadFocus?.request) { setShowRoads(true); setSelectedRoadId(null); onSelect(null); }
  }, [roadFocus?.request, onSelect]);
  function selectRoad(id) {
    setSelectedRoadId(id);
    onSelect(null);
    setRoadSelectionRequest(value => value + 1);
  }
  function selectHazard(id) {
    onSelect(id);
    setSelectedRoadId(null);
    setHazardSelectionRequest(value => value + 1);
  }
  const allMappedRoads = roads.filter(road => road.illustrativePath?.isMock && road.illustrativePath.positions?.length >= 2);
  const mappedRoads = allMappedRoads.filter(road => roadRisk === 'ALL' || road.risk === roadRisk);
  const selectedRoad = showRoads ? mappedRoads.find(road => road.id === selectedRoadId) : null;
  const selectedRoadHazards = selectedRoad ? allHazards.filter(hazard => hazard.roadId === selectedRoad.id) : [];
  const roadPopupPosition = selectedRoad?.illustrativePath.positions[Math.floor(selectedRoad.illustrativePath.positions.length / 2)];
  const mappedHazards = hazards.filter(({ coordinates }) =>
    Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lng) &&
    Math.abs(coordinates.lat) <= 90 && Math.abs(coordinates.lng) <= 180
  );
  const allPositions = [...mappedHazards.map(({ coordinates }) => [coordinates.lat, coordinates.lng]), ...(showRoads ? mappedRoads.flatMap(road => road.illustrativePath.positions) : [])];
  const positions = selectedHazard?.coordinates ? [[selectedHazard.coordinates.lat, selectedHazard.coordinates.lng]] : selectedRoad ? selectedRoad.illustrativePath.positions
    : roadRisk !== 'ALL' && showRoads ? mappedRoads.flatMap(road => road.illustrativePath.positions)
    : allPositions;
  const focusKey = `${roadFocus?.request ?? 0}:${roadSelectionRequest}:${hazardSelectionRequest}`;
  return (
    <>
      <p className="border-b border-neutral-200 p-3 text-xs text-neutral-500">
        OpenStreetMap basemap · Dashed road overlays and hazard positions are illustrative, not verified geography.
      </p>
      <div className="border-b border-neutral-200 p-3 text-xs text-neutral-500"><label className="flex items-center gap-2"><input type="checkbox" checked={showRoads} onChange={event => { setShowRoads(event.target.checked); setSelectedRoadId(null); }} />Road statuses ({mappedRoads.length} of {roads.length} roads)</label><p className="mt-2" role="status">Road risk: {roadRisk === 'ALL' ? 'All levels' : roadRisk}. <button type="button" className="detail-link" onClick={() => onRoadRiskChange?.('ALL')}>Show all roads</button></p><p className="mt-2">Dashed lines: road risk · Solid circles: active hazards. Hazard filters do not hide road statuses.</p></div><MapContainer center={demoCenter} zoom={14} scrollWheelZoom={false} style={{ height: 360, width: '100%', zIndex: 0 }} aria-label="Elmina demo hazard map">
        <TileLayer
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          eventHandlers={{ tileerror: () => setTileError(true), load: () => setTileError(false) }}
        />
        <MapViewport positions={positions} focusKey={focusKey} />
        {showRoads && mappedRoads.map(road => (
          <Polyline key={road.id} positions={road.illustrativePath.positions}
            pathOptions={{ color: riskStyles[road.risk].color, weight: selectedRoadId === road.id ? 9 : 6, dashArray: '8 6', opacity: 0.9 }}
            eventHandlers={{ click: () => selectRoad(road.id) }}>
            <Tooltip>{road.name} · Road status: {road.risk} · Illustrative path</Tooltip>
          </Polyline>
        ))}
        {mappedHazards.map(hazard => (
          <CircleMarker
            key={hazard.id}
            center={[hazard.coordinates.lat, hazard.coordinates.lng]}
            radius={selectedId === hazard.id ? 13 : 10}
            pathOptions={{ color: riskStyles[hazard.risk].color, fillColor: riskStyles[hazard.risk].color, fillOpacity: 0.85, weight: selectedId === hazard.id ? 4 : 2 }}
            eventHandlers={{ click: () => { selectHazard(hazard.id); } }}
          >
            <Tooltip>{hazard.id}: {hazard.type} · {hazard.risk}</Tooltip>
          </CircleMarker>
        ))}
        {selectedHazard?.coordinates && <Popup key={`${selectedHazard.id}:${hazardSelectionRequest}`} position={[selectedHazard.coordinates.lat, selectedHazard.coordinates.lng]} maxWidth={240} autoPanPadding={[16, 16]}>
          <section aria-label="Map hazard summary" className="text-xs">
            <div className="font-semibold">{selectedHazard.id} · {selectedHazard.location}</div>
            <div className="mt-2">{selectedHazard.type}</div>
            <div className="mt-2"><RiskBadge risk={selectedHazard.risk} /></div>
            <div className="mt-2">{selectedHazard.status}</div>
            <button type="button" className="detail-link mt-3" onClick={onViewDetails}>View details below</button>
          </section>
        </Popup>}
        {selectedRoad && <Popup key={`road:${selectedRoad.id}:${roadSelectionRequest}`} position={roadPopupPosition} maxWidth={240} autoPanPadding={[16, 16]}>
          <section aria-label="Map road summary" className="text-xs">
            <div className="font-semibold">{selectedRoad.name}</div>
            <div className="mt-2"><RiskBadge risk={selectedRoad.risk} /></div>
            <div className="mt-2">{selectedRoadHazards.length} active {selectedRoadHazards.length === 1 ? 'hazard' : 'hazards'}</div>
            <button type="button" className="detail-link mt-3" onClick={viewRoadDetails}>View road details below</button>
          </section>
        </Popup>}
      </MapContainer>
      {showRoads && <div className="border-b border-neutral-200 p-3">
        <p className="mb-2 text-xs font-medium">Road statuses · same records as Township Risk Status</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Select a road status">
          {mappedRoads.map(road => <button key={road.id} type="button" className="rounded border border-neutral-200 p-2 text-xs text-left" aria-pressed={selectedRoadId === road.id} onClick={() => selectRoad(road.id)}>{road.name} · {road.risk}</button>)}
        </div>
      </div>}
      {selectedRoad && <section id="map-road-details" ref={roadDetailsRef} tabIndex={-1} aria-label="Selected road status" className="scroll-mt-24 border-b border-neutral-200 p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{selectedRoad.name}</h3><RiskBadge risk={selectedRoad.risk} /></div>
        <p className="mt-2">{selectedRoad.id} · {selectedRoadHazards.length} active hazards</p>
        <p className="mt-2 text-neutral-500">Road status is taken from the same shared road record as the chart. Dashed path is illustrative.</p>
        <button type="button" className="detail-link mt-3" onClick={() => setSelectedRoadId(null)}>Close road status</button>
      </section>}
      {tileError && <p role="status" className="p-3 text-xs text-neutral-500">Map tiles could not load. Check your internet connection. Hazard selection below remains available.</p>}
      {mappedHazards.length < hazards.length && <p className="p-3 text-xs text-neutral-500">{hazards.length - mappedHazards.length} hazards have no valid map position. Their details remain available below.</p>}
      <div className="flex flex-wrap gap-2 p-3" role="group" aria-label="Select a map hazard">
        {hazards.map(hazard => (
          <button type="button" key={hazard.id} className="rounded border border-neutral-200 p-2 text-left text-xs" onClick={() => { selectHazard(hazard.id); }} aria-pressed={selectedId === hazard.id} aria-controls="map-hazard-details">
            {hazard.id} · {hazard.location} · {hazard.risk}
          </button>
        ))}
      </div>
    </>
  );
}
