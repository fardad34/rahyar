# Rahyar

A truck and passenger vehicle navigation web application. The original static application, facility/geographic data, radio/media player, weather, border calculations and route options are preserved. This branch adds a Supabase-backed reporting/account layer and development tooling without a framework rewrite.

**This is a review branch, not a production release.** The map-first navigation redesign is documented in [NAVIGATION_REDESIGN.md](docs/NAVIGATION_REDESIGN.md). See [staging access and iPad setup](docs/STAGING_ACCESS.md). See [progress](docs/IMPLEMENTATION_CHECKLIST.md), [handover](docs/RELEASE_HANDOVER.md), [architecture/context](PROJECT_CONTEXT.md), [recovery](docs/RECOVERY.md) and [external services](docs/EXTERNAL_SERVICES.md).

## Local development / Codex Projects

Install Node.js 24 LTS, npm and Git. Clone into your own Projects folder, then open that folder as an existing project in Codex:

```sh
git clone https://github.com/fardad34/rahyar.git
cd rahyar
git switch feature/comprehensive-staging-20261117T052834Z
npm ci
```

Copy `.env.example` to `.env.local` and obtain the URL and **publishable** key for the existing Supabase project `pdipokhucdzttziyzoiw`. Never use a service-role/secret key. These two values configure the browser Data API under RLS; they do not grant administration. Without them, navigation works and shared services report their configuration failure.

```sh
npm run dev
```

Open **http://localhost:3000**. The development server binds only to loopback, serves `dist/` and the three local API handlers, and does not expose `.git` or environment files. `predev` builds the new client and copies the same Leaflet 1.9.4 version locally. There is no hot reload; refresh after edits. `PORT=3001 npm run dev` changes the port on macOS/Linux; use `$env:PORT=3001; npm run dev` in PowerShell. Storage is per host/port/browser.

The existing Vercel project is `rahyar`, ID `prj_VWcZXiqXvf9CJLRqCsgr73fRqAlV`, team `team_PuUJOIzmcLUiNoqlGAdgDzLR`. Development and preview configuration are set there; production credentials are intentionally not configured. No duplicate project is required. `.vercel/` and `.env.local` are ignored.

## Commands and tests

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm start` | Build and serve locally |
| `npm run build` | Bundle only the new reporting client; copy Leaflet; create offline manifest |
| `npm test` | Run all unit/regression test files, including the original 14 files |
| `npm run check` | JavaScript syntax and JSON/manifest parsing |
| `npm run test:ui` | Opt-in map-first navigation, bottom-sheet and mobile browser regression checks |
| `npm run verify` | Checks followed by all unit/regression tests |
| `npm run test:integration` | Opt-in real Supabase authorization/report checks |
| `npm run test:browser` | Opt-in two-browser realtime/offline queue checks |
| `node tests/integration/weigh-status.browser.cjs` | Opt-in real two-account Wasi Open/Closed WebSocket checks |
| `node tests/integration/planning.browser.cjs` | Responsive/planning/offline reload browser checks |

The original invocation remains supported from the repository root:

```sh
node --test tests/*.test.cjs
```

The original baseline reported 25 results. This branch reports **79**, adding report confidence/direction/expiry, queue ownership, voice availability, data-assistant, staging adapter and Wasi identity/search tests. Two existing assertions were updated for intentionally brighter satellite rendering and explicit fork direction wording. No original test file or fixture was removed.

Live tests require two dedicated test accounts and a credentials JSON file **outside the repository**, passed via `RAHYAR_TEST_USERS_FILE`. Do not use real driver accounts or commit credentials. Browser tests use system Chromium by default (`CHROMIUM_PATH` can override) and synthetic GPS/recorded fixtures. They do not prove physical Safari or actual speech audibility. Set `BASE_URL` for the browser's application URL. Network-restricted Node environments may require their platform's proxy configuration (this workspace uses `NODE_USE_ENV_PROXY=1`).

Run `npm run verify` after modifications and repeat the affected live/browser tests. Unit tests do not call external providers. Live tests create real reports in the selected database: use authorized synthetic accounts in the existing project, hide their shared reports afterward, and remove/revoke only those accounts when authorized. Do not create another cloud project.

## Architecture

```text
api/                         Serverless config, health and data-assistant handlers
src/cloud-client.js          Account/session, report subscription and offline queue
src/report-model.cjs         Direction/expiry/confidence/filter logic
src/assistant-data.cjs        Deterministic lookup; no LLM
supabase/migrations/          Applied, additive schema migrations
supabase/verify.sql           RLS/privilege/publication/registry assertions
scripts/                     Build, local server, checks and tests
DIST BELOW REMAINS THE ORIGINAL CLASSIC-SCRIPT APPLICATION:
dist/index.html              Markup and explicit script load order
dist/app.js                  GPS, routing, ETA, weather, route lifecycle
dist/truck-routing.js        Valhalla truck/auto profiles and border-aware alternatives
dist/road-context.js          Regions, facilities, units and boundaries
dist/focus-dashboard.js       Watched cities, trip dashboard and fullscreen fallback
dist/road-media.js            Original radio/local media IndexedDB implementation
dist/station-alerts.js        Route-relative station alerts, shared status presentation
dist/shared-reports.js        Bridge from navigation/map state to cloud reports
dist/development-enhancements.js Vehicle cards, history/favorites, explicit settings sync
dist/trip-storage.js          Last route package and basic offline canvas/guidance
dist/sw.js                   Opt-in app cache; no API/auth/tile caching
dist/vendor/                 Original licensed vendors + generated pinned bundles
dist/*.json                  All original geographic and facility datasets
tests/                       Original fixtures and regression tests + additions
```

Application scripts share globals and retain their load order. New modules bridge into them rather than replacing the routing/media/weather implementation. Generated assets (`vendor/rahyar-cloud.js`, `vendor/leaflet/`, `offline-manifest.json`) are ignored and reproducibly generated by the build; original `dist/` assets/datasets remain tracked.

## Shared reports and privacy

Sign in with email/password to submit or view shared reports. Navigation does not require an account. Report categories are exactly Police, Road Closed, Construction, and Weigh Station (Open/Closed). GPS/time/direction are attached where available. Offline reports are queued under their submitting account and expire before replay if stale; another account cannot submit that queue.

Station observations must match a registered government station and be submitted within 1.5 km with a fresh accurate GPS fix and heading. A single observation is shown as unverified; two independent matching drivers may produce a corroborated driver status. Conflicting/stale/missing-direction evidence remains **Unknown**. Corroboration is not an official government status. All original 212 government station records are included; commercial scales are excluded.

Profiles and saved records use owner RLS. Account settings sync is explicit and private; vehicle/media/history state also remains on this device unless deliberately synchronized. Media files are not uploaded. Shared location reports are visible to other signed-in drivers and expire. API calls and user tokens are never service-worker cached. Notice acceptance has a new version in all six languages.

## Limits and release restrictions

- Direct long requests still exceed the public Valhalla limit. Bounded vehicle-aware segmentation now produced continuous Canada-only Toronto–Winnipeg and Toronto–Vancouver truck routes in live checks. Each section/join uses the vehicle router; no car geometry is substituted. Global optimality and every corridor alternative have not been verified.
- Ontario 511 confirms the existing Wasi South record (often searched as Wassi). Search now accepts either spelling and dashboard station identities match the central registry. The official inventory supplies no Open/Closed field; unverified operating status remains Unknown.
- Ask Rahyar supports route-data questions and confirmed map controls, with optional browser speech input. **No language model is connected.** No paid AI provider or background wake-word service is enabled.
- Offline preparation includes route geometry, instructions, truck profile and app assets. No offline basemap, satellite tiles or rerouting. Safari can evict data; Wi-Fi detection/persistent storage are not guaranteed.
- Six-language notices/voice options/core controls are present; full interface translation and physical voice verification remain incomplete.
- No verified truck-legal blue road layer or new live official-alert feed is claimed. Existing official reference links remain.
- Production/main and the existing public website remain unchanged. Auto Git deployments are disabled in `vercel.json`. Vercel Hobby's [terms](https://vercel.com/legal/terms) restrict it to personal/non-commercial use; a commercial staging release needs eligibility clarification or a separately approved hosting arrangement. No upgrade is authorized.

No application redistribution license was supplied. Preserve the existing vendor/data attribution; Leaflet Rotate includes GPL-3.0 terms. Review licensing separately before commercial redistribution.

Latest road-test corrections and current limitations: [18 November feedback update](docs/ROADTEST_FEEDBACK_20261118.md). On the existing preview, use **More controls → Update app** (translated according to Settings → Interface language) to refresh while preserving local trip/settings and an existing valid session. Hosting login protection is independent.

Latest Safari/UI follow-up, verification and remaining data limitations: [Safari follow-up](docs/SAFARI_UI_FOLLOWUP_20261118.md).

Trip reporting, admin invitation, protected sharing, verification and remaining limits: [21 November update](docs/TRIP_REPORTS_20261121.md). Reports are under Settings or the main menu → Trip reports & sharing.

Current request-by-request status, including incomplete requirements: [completion review](docs/REQUEST_COMPLETION_REVIEW_20261121.md). Long-route and waypoint alternatives retain genuine provider options; three are never invented when unavailable.

Immediate route-choice memory, default revalidation and exact Calgary-corridor limitations: [corridor preference follow-up](docs/CORRIDOR_PREFERENCES_20261122.md).

Nearby bypass alternatives, PTH 101 North reference evidence, approximate tail ETA provenance and remaining limits: [upcoming-corridor follow-up](docs/UPCOMING_CORRIDORS_20261122.md).
