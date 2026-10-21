# Safe2Go — Township Road Climate Resilience & Hazard Intelligence Platform

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
- Six mock roads provide one SAFE, two WATCH, two HIGH and one CRITICAL. Six incident records provide five active hazards (four core climate hazards and one extended pothole detection), plus one resolved flood incident in history.
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

Production build passes. All five routes and the not-found route passed server-render smoke checks; shared counts were checked against 5 active hazards, 1 critical road, 2 WATCH roads, and 5 open incidents. The risk chart is loaded in a separate bundle. Subsequent Member 1 browser checks cover responsive layouts at 320px, 375px and 768px, all five routes, map filters and reset, persistent filter reloads, marker details, tile loading and zoom. The production build passes after these additions.

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
2. Check 5 active hazards, 1 critical road, 2 roads under watch, and 5 open incidents.
3. Check core climate summaries: two Flood hazards (highest CRITICAL), one Tree risk (HIGH), and one weather-related physical hazard (HIGH). Check the separate extended capability: RG-003 Pothole WATCH, original severity Medium.
4. Filter the map by type and risk, check the no-match state, then reset.
5. Select each marker or its button; confirm shared IDs, risk, status and simulated MYT time.
6. Select filters, refresh, and confirm they persist. Reset restores all hazards.
7. Confirm recent incident times and highest-risk-first table order.
8. On a narrow screen, open navigation, visit each module and return to Overview.
9. Run `npm run build` before requesting commit, push or integration approval.
## Climate-resilience positioning (revised scope)

Safe2Go addresses one problem: township management needs earlier, road-level visibility
and prioritisation of weather-related hazards before and while roads become unsafe.
Positioning: PLANET track, Climate Resilience.

- Core hazards: flooding/rising water and weather-related roadside tree instability.
- Road Vision's primary role: verify flooding, fallen trees/branches and obstructions.
- Extended capability: potholes and road-surface damage. RG-003 remains canonical but
  appears separately from core climate priorities; all-capability totals still include it.
- The Overview joins supplied incident risks with flood readings, tree/soil records,
  camera references and the shared weather snapshot. It explains management priorities;
  it does not calculate a new fused score or claim an implemented prediction model.
- Workflow: DETECT → ASSESS → PREDICT → VERIFY → PRIORITISE → RESPOND → RESOLVE.
  The workflow panel describes intended behavior. Forecast-driven prediction, CCTV
  live verification, assignment, dispatch and interactive resolution actions await module integration. RG-005 and RG-006 contain scripted verification and resolution examples only.
- Tree Risk & Registry is the shared navigation label. Member 3 must implement Tree
  Passports, inspection/maintenance history and risk assessment. No exact fall-time
  prediction or automatic disease diagnosis is claimed.
- Road Vision and Incident & Response Center remain module integrations owned by
  Members 4 and 5. Only starter-page labels and descriptions were aligned with the revised scope; module implementations remain untouched.
- PACC is strategic context only; no existing PACC integration is claimed.
- No additional major pages, backend or new shared risk states were added.
### Additional simulated scenarios

RG-001–003 retain their original record values. The following are fictional, scripted demo
records; names and coordinates do not verify actual road hazards or road geometry.

| ID | Scenario | Current risk | Status | Demonstration purpose |
| --- | --- | --- | --- | --- |
| RG-004 | Rising water on RD-004 | WATCH | Under monitoring | Early warning: 4 cm, supplied risk 35% |
| RG-005 | Weather-related fallen branch on RD-005 | HIGH | Awaiting response | Scripted CCTV confirmation; pending clearance |
| RG-006 | Cleared standing water on RD-006 | SAFE | Resolved | Historical WATCH risk; current 0 cm water; excluded from active totals/map |

`weatherRelated: true` associates a physical obstruction with the climate scenario.
Generic obstructions are not automatically classified as climate-related. RG-005's
`verification` object is explicitly simulated. RG-006's `resolvedAt` is a fixed demo time.
The two original hazard categories remain the core problem; branch verification supports
that workflow. Six incidents do not imply six active hazards.
### Demo presentation

The Overview has one prominent "Demo mode — simulated data" notice. Individual weather
values and timestamps do not repeat that label. Shared data retains all simulation flags.
Map locations remain explicitly illustrative; scripted CCTV confirmation stays labelled.
The full numbered workflow explanation is replaced with a compact intended-workflow line.
The line is a process guide, not a claim that all seven stages are implemented.
### Road-status map layer

`roads.json` includes `illustrativePath: { isMock: true, positions: [[lat, lng], ...] }`.
The initial fictional overlays have been replaced with road segments extracted from
OpenStreetMap road geometry. Risk colours remain illustrative and use the exact same
`roads[].risk` values as Township Risk Status. Basemap streets remain external context.

The road-status layer includes all six roads (including the SAFE road) and has an on/off
checkbox. Solid circles represent active incidents. Hazard type/risk filters affect circles
only, so a SAFE filter may show no active incidents while the SAFE road remains present.
Road details report the road's all-active-incident count, independent of marker filters.
Current chart/layer distribution: SAFE 1, WATCH 2, HIGH 2, CRITICAL 1.

Chart segments and keyboard-accessible risk buttons now select the road-risk map layer.
Selection fits the map to matching road paths and restores the road layer if hidden.
"Show all roads" clears the road filter. This filter is independent of hazard filters
and does not change township-wide chart totals. Selecting a road button or dashed path
fits and highlights that road, including SAFE roads with no active incidents. Repeated
selections recenter after manual panning. Road paths remain explicitly illustrative.

Selecting a hazard now opens a compact map popup (ID, location, type, risk and status).
"View details below" scrolls and focuses the full details for that same shared record.
Hazard filters clear hidden selections; road/chart selection clears the hazard popup.
The compact popup is readable on mobile, with full detail retained below the map.

### On-road demonstration placement

Marker coordinates and short road overlays now share OpenStreetMap road geometry,
retrieved from the public OSM map API on 21 October 2026. Each marker is an explicit
vertex of its matching road overlay. Stored OSM way IDs/source URLs record provenance.
Road geometry is sourced; incidents, road risks and their placement remain simulated.

The original demo location names are retained. `basemapRoadName` shows the actual street
used for display and is surfaced in road/incident cards to avoid claiming aliases match
real street names. RG-002 uses mapped Persiaran Elmina. Other demo aliases use nearby
named road segments; those are demonstration placements, not verified hazard locations.
No external request is required at runtime beyond the existing map tiles.
## Maintenance Team Registry (admin workspace)

Route: `/teams`. Files: `pages/MaintenanceTeams.jsx`, `pages/maintenance-teams.css`,
`utils/teamRegistry.js`. The page reuses Incident & Response Center panel/button styles
and reads existing demo teams from `data/teams.json` without changing those seed records.

Admins can register teams (name, specialty, crew size, estimated travel time, optional
leader/contact and service area), search the directory, and filter by specialty.
Registration validates names, duplicates and numeric bounds. It persists only custom
records under `safe2go.maintenanceTeams.v1`; malformed or blocked browser storage produces
an error instead of silently losing or overwriting saved records. There is no backend
or new authentication mechanism; this remains a local prototype workspace.

Per Yina's scope decision, this page is registry-only. The Incident Center still uses
its original static team assignment list. New registrations do not become assignable
until a separately approved integration of Member 5's implementation.

Validation: production build; isolated store checks for invalid values, duplicate names,
round-trip persistence and blocked/corrupted storage; browser registration/reload and
search empty-state checks on a separate localhost origin; normal preview kept unchanged;
375px mobile layout checked without horizontal overflow.

## Demo login

Route `/login` is outside the shared navigation shell. Workspace routes redirect there
until a demo session exists, preserving the requested route after sign-in. The page reuses
Incident & Response Center colours, typography and form/button treatment.

Demo accounts: `admin@safe2go.demo` / `Safe2GoDemo!` (Township Admin) and
`maintenance@safe2go.demo` / `MaintenanceDemo!` (Maintenance Team).
The header and sidebar display the signed-in role. Both accounts currently access the
same workspace; role-based permissions and team assignment integration are not implemented.
These are public sample credentials,
not real authentication. The client-side route guard is for demonstration flow only.
Session metadata (email and demo role) is stored under `safe2go.demoSession.v1` in
sessionStorage; passwords are never stored. Refresh retains a session in that tab.
If session storage is blocked, sign-in works in memory until refresh. Sign out in the
header clears the demo session; existing incident/registry demo data is retained.

Files: `pages/Login.jsx`, `pages/login.css`, `utils/demoSession.jsx`,
`components/RequireDemoSession.jsx`, plus route/header integration.
Browser validation: invalid credentials, password visibility, redirect back to /teams,
refresh persistence, sign-out and 375px mobile layout. Production build passes.
