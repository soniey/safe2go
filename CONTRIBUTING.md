# Contributing to Safe2Go

## Setup and workflow

Follow the [README](README.md). [package.json](package.json) defines `dev`, `build`, `preview`; no test, lint or formatter script is configured.

1. Inspect `git status --short` and preserve other contributors' changes.
2. Create a focused branch using the team's agreed convention. Historical ownership notes in the [previous README](docs/legacy-readme.md) are not a verified current roster.
3. Read the relevant [module](docs/04-module-documentation.md) and [data design](docs/05-data-design.md).
4. Keep changes focused. Explain affected routes, observable behavior and persistence changes in review.
5. Run appropriate checks and [manual scenarios](docs/08-testing.md); report what was executed.

```sh
npm run build
node scripts/test-road-vision.mjs
node scripts/test-shared-data.mjs
```

## Shared conventions

- Use Safe2Go as the product name; preserve legacy storage identifiers unless implementing a migration.
- Register routes in [App.jsx](src/App.jsx) and navigation in [navigation.js](src/utils/navigation.js).
- Reuse `SAFE`, `WATCH`, `HIGH`, `CRITICAL` from [risk.js](src/utils/risk.js).
- Use shared stores/hooks instead of duplicating incidents, teams or scoring logic.
- Preserve IDs, relationships, simulation flags and mock-location notices. Display times in `Asia/Kuala_Lumpur`.
- Validate Road Vision storage before writing; preserve detection identity fields.
- Coordinate changes to shared schemas, packages and UI with the team. No branch-protection or reviewer ownership policy was verified.

## Documentation and assets

Separate implemented functionality from Future Work and mock data from live integrations. Link real files using relative Markdown links; use fenced Mermaid for diagrams. Camera assets are not UI screenshots or verified incidents. Establish image provenance/licensing before external reuse.

Do not commit `node_modules/`, `dist/`, `.npm-cache/`, secrets or real resident information. No project license file was found; obtain owner guidance before distribution or relicensing.
