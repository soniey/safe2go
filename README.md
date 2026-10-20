# Safe2Go

Shared township operations dashboard foundation for the Township of Tomorrow University Hackathon 2026. React + Vite, JSX, Tailwind CSS, React Router, Lucide, and Recharts. All readings and detections are simulated. No authentication, backend, external map service, or database is used.

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
- Map positions are percentages on a fictional schematic, not geographic coordinates.
- Notification and settings icons are visual placeholders. Incident links intentionally open the Incidents starter page; incident details are future work.
- localStorage is reserved for future persistent interactions; there is no need to persist static mock data yet.

## Team ownership

| Branch | Primary file | Route |
| --- | --- | --- |
| `feature/overview` | `src/pages/Overview.jsx` | `/` |
| `feature/flood-weather` | `src/pages/FloodWeather.jsx` | `/flood` |
| `feature/tree-risk` | `src/pages/TreeRisk.jsx` | `/trees` |
| `feature/road-vision` | `src/pages/RoadVision.jsx` | `/vision` |
| `feature/incidents` | `src/pages/Incidents.jsx` | `/incidents` |

Each developer can replace their starter page without changing routing or the shared shell. Coordinate changes to shared mock schemas, risk definitions, and components. The four feature modules are intentionally placeholders.

## Validation

Production build passes. All five routes and the not-found route passed server-render smoke checks; shared counts were checked against 3 active hazards, 1 critical road, 2 WATCH roads, and 3 open incidents. The risk chart is loaded in a separate bundle. Browser tools were unavailable during implementation, so visual and interactive browser checks remain unverified.

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
