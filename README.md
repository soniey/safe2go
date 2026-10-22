# Safe2Go

**Smart Township Road Hazard Intelligence & Response Platform**

For the Sime Darby Property Township of Tomorrow University Hackathon 2026.

Safe2Go is a React browser prototype for road-level hazard review and maintenance coordination in a City of Elmina demonstration scenario. It combines flood and weather information, tree inspections, saved camera images, incident response and reporting.

> Readings, camera statuses, detections and operational scenarios use mock data. Road Vision uses local JPEGs and predefined bounding boxes. No live CCTV, IoT ingestion, deployed AI, backend service or production database is implemented. Sign-in is client-side demo navigation control.

## Run locally

Use Node.js 22.12+ in the Node 22 line. Verification used Node 22.18.0/npm 10.9.3; installed Vite declares `^20.19.0 || >=22.12.0`. Commands match [package.json](package.json).

```sh
git clone https://github.com/soniey/safe2go.git
cd safe2go
npm ci
npm run dev
```

[vite.config.js](vite.config.js) sets development port 3000; use the URL Vite prints if occupied. On restricted PowerShell use `npm.cmd` instead of `npm`.

```sh
npm run build
npm run preview
```

Build output is `dist/`. Preview serves it locally. Static hosting requires fallback to `index.html` for deep links. No environment variables are required by the inspected source. Map tiles and web fonts require internet access. No dependencies were installed during this review.

## Demo access

| Role | Login | Password | Workspace |
| --- | --- | --- | --- |
| Township Admin | `admin@safe2go.demo` | `Safe2GoDemo!` | Management pages |
| Shared Maintenance Team | `maintenance@safe2go.demo` | `MaintenanceDemo!` | `/staff`, all assigned crews |

Registered teams use registry credentials to see their own jobs. Seed crew passwords are bundled; registered passwords are stored in plaintext in localStorage. Use demo credentials and data only.

## Implemented modules

| Module | Route | Functionality |
| --- | --- | --- |
| Overview | `/` | Shared risk, road/hazard map, filters and camera navigation |
| Flood & Weather | `/flood` | Simulated readings, ranked watchlist, trends and outlook |
| Tree Risk | `/trees` | 50 seed trees, heuristic scoring and saved inspections |
| Road Vision | `/vision` | 10 cameras, 7 online image previews, 7 fixed detections and incident creation |
| Incidents | `/incidents` | Verification, assignment, road controls and response tracking |

Supporting routes: `/login`, `/teams`, `/staff`, `/reports`. All five modules contain working UI. Six seed incidents include five open and one resolved scenario before local changes. Current road/tree risks are derived; older seed-only distributions are not reliable dashboard expectations.

## Documentation

| Guide | Content |
| --- | --- |
| [Project overview](docs/01-project-overview.md) | Scope, users and status |
| [Requirements](docs/02-system-requirements.md) | Functional and environment requirements |
| [Architecture](docs/03-system-architecture.md) | Routes, components and data flow |
| [Modules](docs/04-module-documentation.md) | Core and supporting workspaces |
| [Data design](docs/05-data-design.md) | Models, scoring and storage keys |
| [Risk assessment](docs/06-risk-assessment.md) | Engineering and demonstration risks |
| [User guide](docs/07-user-guide.md) | Admin and crew instructions |
| [Testing](docs/08-testing.md) | Checks and verification limits |
| [Limitations and roadmap](docs/09-limitations-roadmap.md) | Gaps and Future Work |
| [Contributing](CONTRIBUTING.md) | Development conventions |

[Shared-data notes](docs/shared-data.md) remain useful integration guidance. The [Road Vision handoff](docs/road-vision.md) is historical. The [previous README](docs/legacy-readme.md) preserves team notes, recent interface updates and prior validation claims.

## Verification

On 22 October 2026 the production build and both repository verification scripts passed using existing dependencies. Vite reported a chunk above 500 kB. No fresh installation, browser interaction or deployment was verified. No UI screenshots were found; `public/images/cctv/` contains demo assets, not application screenshots.
