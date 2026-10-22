> Historical handoff, superseded by [current module documentation](04-module-documentation.md) and [data design](05-data-design.md). Current previews use seven JPEG assets, camera metadata comes from cameras.json, and incident integration is implemented. The original notes below are retained for history; their SVG, placeholder and pending-integration statements no longer describe the working tree.

# Road Vision handoff

Branch: `feature/road-vision`. Existing uncommitted team changes were preserved.

## Files

Modified: `src/pages/RoadVision.jsx`.

Added: `src/data/roadVision.js`, `src/utils/roadVisionIncidents.js`, `src/components/road-vision/CameraFeed.jsx`, `src/components/road-vision/road-scene.svg`, `src/components/road-vision/road-vision.css`, `scripts/test-road-vision.mjs`, and this document. No dependencies added. Shared cameras, incidents, routes, layout, sidebar, header and risk badges were not changed by this task.

## Demo

Open `/vision`. CAM-03 defaults to the WATCH pothole with 91% confidence, linked to RG-003. CAM-02 standing water links to RG-001. CAM-DEMO-04 has selectable fallen-tree and road-blockage examples; create an incident for each and refresh to verify the link persists. CAM-DEMO-05 is offline, CAM-DEMO-06 is in maintenance, and CAM-DEMO-07 is online without detections. Shared camera records are reused; module-only metadata and additional cameras live in `roadVision.js`. Counts derive from this combined camera collection. Offline excludes maintenance, which is displayed separately.

Images are local SVG illustrations with fixed simulated hazard shapes. Bounding boxes use percentages in the same 16:9 coordinate system as the illustration. These are not actual Elmina photographs, CCTV connections, or model outputs. All captures use fixed MYT demo timestamps.

Keyboard: Tab to cameras, boxes and detection buttons; Enter/Space selects. Check at mobile and desktop widths. Check image failure by blocking `road-scene.svg`; detection details should remain usable. To check storage failures, disable browser storage or set the key below to malformed JSON. An error must appear and data must remain unchanged.

## Member 5 integration — pending

The Incidents page is currently a placeholder and does **not** display these incidents or handle the `incident` query parameter. Existing/new-incident links navigate to `/incidents?incident=ID`; they do not claim a working detail screen. Member 5 needs to merge the shared JSON records with `readRoadVisionIncidents()`, handle read errors, select the query-string incident, and refresh on navigation/storage changes. Import the utility rather than duplicating its key or schema. No changes were made to Member 5's page.

Storage key: `safe2go.roadVision.incidents.v1`. Value: JSON array of incident objects:

```json
{
  "id": "RG-RV-001",
  "detectionId": "DET-003",
  "type": "Fallen Tree",
  "roadId": "RD-004",
  "location": "Jalan Elmina 1",
  "cameraId": "CAM-DEMO-04",
  "risk": "HIGH",
  "detectedAt": "2026-10-20T09:55:00+08:00",
  "detectionConfidence": 94,
  "status": "Detected",
  "source": "Road Vision",
  "summary": "Simulated hazard explanation",
  "simulated": true
}
```

This extends the existing incident schema; new records have no verified geographic coordinates, so they should not acquire invented map positions. IDs use a module namespace to avoid shared RG-001 style IDs. Creation rereads storage and checks linked incidents and detection identity before writing. Web Locks serialize creation across tabs where supported; without Web Locks, simultaneous cross-tab writes are not guaranteed. Storage is local to the browser/origin, not a shared backend. Invalid arrays/records cause an error rather than silently overwriting saved incidents. Member 5 may update nonempty workflow status values, but must preserve detection identity fields.

## Verification and merges

Run `npm.cmd run build` and `node scripts/test-road-vision.mjs`. Automated checks cover links to RG-001/RG-003, creation, unique IDs, duplicate prevention, rereading persisted records, invalid data, write failures, bounding-box ranges, and camera data states. A real browser check remains required for layout, keyboard interaction, image failure and routing; browser automation was unavailable in this session.

Likely merge conflicts: `src/pages/RoadVision.jsx` if another branch replaces its placeholder. New files are module scoped. Existing staged/uncommitted changes in unrelated files predate this task and should not be bundled into a Member 4 commit.
