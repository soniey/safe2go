# Shared application data

The JSON files contain seed/demo facts by entity, rather than independent page datasets. Pages read current records through `useSharedData()`, `useDashboard()`, `useTrees()`, `useIncidents()`, and `useTeams()`.

## Ownership

- `cameras.json`: every camera ID, status, road reference, capture time and image configuration. Road Vision adds only derived road names. Existing IDs are retained for saved incidents.
- `incidents.json`: seed incidents. `incidentStore` merges Road Vision creations and saved response actions. It provides one workflow status and `isOpen` flag to every page. Resolved and road-reopened incidents stay in history but leave active counts and map markers.
- `trees.json`: tree identity and road references. Inspection updates persist under the existing storage key. Risk scores and categories are calculated once by `treeRisk`. RG-002 links to TR-204 on RD-002 (Persiaran Elmina), as confirmed by the project owner. Existing saved TR-204 inspections keep their inspection fields; canonical road metadata is applied when reading them.
- Flood sensor readings override corresponding demo estimates. The Flood page and shared road selector use the same flood score and thresholds.
- `teamRegistry` merges seed crews and saved registrations. The directory and assignment modal use the same team list.

## Risk meanings

Overall road risk is the highest category among its flood assessment, linked current tree assessments and open incidents. A flood assessment is not the same as overall road risk. Resolving an incident removes it from active counts but does not erase a sensor reading or change a tree inspection. An assessment must change before that independent source becomes safe. Trees outside the monitored road registry remain in the tree directory without an invented road association.

Road Vision shows fixed saved captures, not a live stream. Its detection count describes those captures; the linked incident's current workflow status is shown separately.

## Persistence and updates

Existing localStorage keys are preserved. Same-tab notifications refresh subscribers after incident creation, tree inspections and team registration; response actions notify the incident store directly. Browser storage events refresh other tabs, including storage reset. No backend or cross-device synchronization is introduced.

Run `node scripts/test-shared-data.mjs` for cross-page create/resolve/reopen, tree updates, canonical relationships, registered-team assignment and reload persistence. It uses isolated in-memory storage and does not touch the user's demo records. Existing Road Vision checks remain in `scripts/test-road-vision.mjs`.
