import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { riskStyles } from '../utils/risk';

// Approximate demo viewport only; not a verified township boundary or hazard location.
const demoCenter = [3.1785, 101.5090];

function MapViewport({ positions }) {
  const map = useMap();
  const positionKey = JSON.stringify(positions);
  useEffect(() => {
    const points = JSON.parse(positionKey);
    if (points.length) map.fitBounds(points, { padding: [35, 35], maxZoom: 16 });
    else map.setView(demoCenter, 14);
  }, [map, positionKey]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function LeafletHazardMap({ hazards, selectedId, onSelect }) {
  const [tileError, setTileError] = useState(false);
  const mappedHazards = hazards.filter(({ coordinates }) =>
    Number.isFinite(coordinates?.lat) && Number.isFinite(coordinates?.lng) &&
    Math.abs(coordinates.lat) <= 90 && Math.abs(coordinates.lng) <= 180
  );
  const positions = mappedHazards.map(({ coordinates }) => [coordinates.lat, coordinates.lng]);
  return (
    <>
      <p className="border-b border-neutral-200 p-3 text-xs text-neutral-500">
        OpenStreetMap basemap. All hazard positions are mock coordinates, not verified road locations.
      </p>
      <MapContainer center={demoCenter} zoom={14} scrollWheelZoom={false} style={{ height: 360, width: '100%', zIndex: 0 }} aria-label="Elmina demo hazard map">
        <TileLayer
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          eventHandlers={{ tileerror: () => setTileError(true), load: () => setTileError(false) }}
        />
        <MapViewport positions={positions} />
        {mappedHazards.map(hazard => (
          <CircleMarker
            key={hazard.id}
            center={[hazard.coordinates.lat, hazard.coordinates.lng]}
            radius={selectedId === hazard.id ? 13 : 10}
            pathOptions={{ color: riskStyles[hazard.risk].color, fillColor: riskStyles[hazard.risk].color, fillOpacity: 0.85, weight: selectedId === hazard.id ? 4 : 2 }}
            eventHandlers={{ click: () => onSelect(hazard.id) }}
          >
            <Tooltip>{hazard.id}: {hazard.type} · {hazard.risk} (mock position)</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {tileError && <p role="status" className="p-3 text-xs text-neutral-500">Map tiles could not load. Check your internet connection. Hazard selection below remains available.</p>}
      {mappedHazards.length < hazards.length && <p className="p-3 text-xs text-neutral-500">{hazards.length - mappedHazards.length} hazards have no valid map position. Their details remain available below.</p>}
      <div className="flex flex-wrap gap-2 p-3" role="group" aria-label="Select a map hazard">
        {hazards.map(hazard => (
          <button type="button" key={hazard.id} className="rounded border border-neutral-200 p-2 text-left text-xs" onClick={() => onSelect(hazard.id)} aria-pressed={selectedId === hazard.id} aria-controls="map-hazard-details">
            {hazard.id} · {hazard.location} · {hazard.risk}
          </button>
        ))}
      </div>
    </>
  );
}
