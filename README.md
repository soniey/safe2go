# Safe2Go

Shared township operations dashboard foundation for the Township of Tomorrow University Hackathon 2026. React + Vite, JSX, Tailwind CSS, React Router, Lucide, and Recharts. All readings and detections are simulated. No authentication, backend, or database is used. The map uses React Leaflet and OpenStreetMap tiles, which require internet access.

## Start

Use Node.js 22.12+ (Node 22.18 is supported).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. On Windows PowerShell with script execution disabled, use `npm.cmd` instead of `npm`.

```sh
npm run build
npm run preview
```

The production output is `dist/`. Production hosting must serve `index.html` for unknown paths so React Router deep links work.

## Shared conventions

- Colors and layout: `src/index.css`. Tailwind uses its Vite plugin and CSS import, following the [official setup](https://tailwindcss.com/docs/installation/using-vite).
- Risk states, badge styles, and chart colors: `src/utils/risk.js` and `.risk-*` styles in `src/index.css`. Only SAFE, WATCH, HIGH, and CRITICAL are global risk states.
- Navigation labels, icons, and paths: `src/utils/navigation.js`. Routes are registered in `src/App.jsx`.
- Dashboard content: `src/pages/Overview.jsx`; source records: `src/data/*.json`. Derived counts and road joins: `src/utils/dashboard.js`.
- Shared shell and reusable UI: `src/components/`.
- `weather.json` holds the fixed demo snapshot time, displayed in Malaysia time. It does not imply a live feed.
- Six roads provide a distribution of two SAFE, two WATCH, one HIGH, and one CRITICAL. Three incident records provide the three active hazards. The additional WATCH road is monitored without an open incident.
- Hazard coordinates are explicitly marked `isMock: true`. They are illustrative demo positions around an approximate Elmina viewport, not verified incident locations or road geometry. Legacy `mapPosition` percentages are retained for compatibility but are no longer used by the map.
- Notification and settings icons are visual placeholders. Incident links intentionally open the Incidents starter page; incident details are future work.
- localStorage is used by the tree risk demo to retain newly recorded inspection details in the browser.

## Tree risk module (`lip` branch)

- `/trees` shows tree records ranked by a calculated risk score using age, health, soil condition, and tilt.
- Tree records are seeded from `src/data/trees.json`. The `treeApi` adapter in `src/utils/treeRisk.js` exposes async list and inspection update operations; inspection updates persist in browser localStorage for the demo.
- Inspection history is available from each row. Saving an inspection updates the record and recalculates its score and priority.
- This is a front-end API prototype with simulated records, not a server-backed database. The adapter can be replaced with HTTP requests when the project backend is connected.
- Map filters persist under `safe2go.mapFilters.v1` in localStorage. Invalid saved values fall back to All; blocked storage leaves the map usable for the session. Incident workflow persistence is not implemented.

## Team ownership

| Module owner | Primary file | Route |
| --- | --- | --- |
| Member 1 (`yina`) | `src/pages/Overview.jsx` | `/` |
| Member 2 (confirm branch) | `src/pages/FloodWeather.jsx` | `/flood` |
| Member 3 (confirm branch) | `src/pages/TreeRisk.jsx` | `/trees` |
| Member 4 (confirm branch) | `src/pages/RoadVision.jsx` | `/vision` |
| Member 5 (confirm branch) | `src/pages/Incidents.jsx` | `/incidents` |
| `feature/overview` | `src/pages/Overview.jsx` | `/` |
| `feature/flood-weather` | `src/pages/FloodWeather.jsx` | `/flood` |
| `lip` | `src/pages/TreeRisk.jsx` | `/trees` |
| `feature/road-vision` | `src/pages/RoadVision.jsx` | `/vision` |
| `feature/incidents` | `src/pages/Incidents.jsx` | `/incidents` |

Each developer can replace their starter page without changing routing or the shared shell. Coordinate changes to shared mock schemas, risk definitions, and components. The four feature modules are intentionally placeholders.

## Validation

Production build passes. All five routes and the not-found route passed server-render smoke checks; shared counts were checked against 3 active hazards, 1 critical road, 2 WATCH roads, and 3 open incidents. The risk chart is loaded in a separate bundle. Subsequent Member 1 browser checks cover responsive layouts at 320px, 375px and 768px, all five routes, map filters and reset, persistent filter reloads, marker details, tile loading and zoom. The production build passes after these additions.

## File inventory / commit scope

Commit all of these source, configuration, documentation, and lock files. Do not commit `node_modules/`, `.npm-cache/`, `dist/`, or secrets.

```text
.gitignore
README.md
index.html
package.json
package-lock.json
vite.config.js
src/App.jsx
src/main.jsx
src/index.css
src/assets/.gitkeep
src/components/Header.jsx
src/components/IncidentCard.jsx
src/components/Layout.jsx
src/components/ModulePlaceholder.jsx
src/components/PageHeader.jsx
src/components/RiskBadge.jsx
src/components/RiskMap.jsx
src/components/RiskStatus.jsx
src/components/Sidebar.jsx
src/components/StatCard.jsx
src/data/cameras.json
src/data/floodReadings.json
src/data/incidents.json
src/data/roads.json
src/data/trees.json
src/data/weather.json
src/pages/FloodWeather.jsx
src/pages/Incidents.jsx
src/pages/Overview.jsx
src/pages/RoadVision.jsx
src/pages/TreeRisk.jsx
src/utils/dashboard.js
src/utils/navigation.js
src/utils/risk.js
```

## Member 1 integration notes

- Overview: `src/pages/Overview.jsx`; reusable cards and map components: `src/components/`.
- `src/utils/dashboard.js` derives active counts, category summaries, road risk distribution,
  recent incidents and priority order. Resolved incidents are excluded from active hazards,
  and remain eligible for recent history. Priority order is CRITICAL, HIGH, WATCH, SAFE;
  newer detection times break ties, and missing times sort after known times.
- Incident data is canonical in `src/data/incidents.json`; join `roadId` to `roads.json`.
  Do not create separate copies of RG-001, RG-002 or RG-003 for module pages.
- `detectedAt` is an ISO timestamp with timezone. Current timestamps are fixed demonstration
  values marked `simulated: true`, not actual detections. Display in Asia/Kuala_Lumpur.
- `coordinates` contains `lat`, `lng`, and `isMock: true`. No incident position or road
  geometry is verified. Basemap roads are OpenStreetMap context, not confirmed hazard roads.
- RG-003 has shared risk WATCH and `originalSeverity: "Medium"`; keep both fields.
- Leaflet/OpenStreetMap requires internet for tiles. Details and filtering remain usable
  if tiles fail. Marker selection can also use the buttons below the map.
- The four teammate modules remain starter pages. No teammate implementation has been
  integrated. Confirm branch ownership and permission before merging their work.
- Incident status editing, response assignments, and persistent workflow actions belong
  to the Incident Center integration. They are not implemented in Member 1's pages.
- Shared files likely to overlap with teammates: package files, App.jsx, main.jsx, shared
  layout/components, src/data/*.json and src/utils/*.js. Review these changes together.
- Current additions include HazardDetails.jsx, HazardSummary.jsx, LeafletHazardMap.jsx,
  RecentIncidents.jsx and utils/mapFilters.js in addition to the original file inventory.

### Manual demonstration check

1. Start `npm run dev` and open the printed local URL.
2. Check 3 active hazards, 1 critical road, 2 roads under watch, and 3 open incidents.
3. Check category summaries: Flood CRITICAL, Tree HIGH, Road condition WATCH (one each).
4. Filter the map by type and risk, check the no-match state, then reset.
5. Select each marker or its button; confirm shared IDs, risk, status and simulated MYT time.
6. Select filters, refresh, and confirm they persist. Reset restores all hazards.
7. Confirm recent incident times and highest-risk-first table order.
8. On a narrow screen, open navigation, visit each module and return to Overview.
9. Run `npm run build` before requesting commit, push or integration approval.