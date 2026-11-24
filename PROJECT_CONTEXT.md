# Rahyar project context

## Protected baseline and branch

Repository: private `fardad34/rahyar`. Original baseline tag/commit: `baseline-original`, `b636409067dcee9c8d07c4a0d62ef2d1fbd3e1a6`. Pre-update main: `2086b7381466f40d6ce6dc4f5728aa49cc699c83`. Backup: `backup/pre-comprehensive-20261117T052834Z`, restored and verified before changes. Feature branch: `feature/comprehensive-staging-20261117T052834Z`. Do not rewrite main or replace the current live website. See `docs/RECOVERY.md`.

## Existing architecture/features preserved

Static HTML/CSS with shared classic JavaScript globals; Leaflet 1.9.4/Rotate 0.2.8, MapLibre 4.7.1, Valhalla truck/auto costing, Open-Meteo weather, ArcGIS/Photon search, Overpass facility/marker enrichment, optional user-keyed TomTom traffic. All original facility/geographic data, vendor files, icons, 14 test files and fixtures remain. Radio/local-media IndexedDB, weather-at-arrival, geographic units/borders, truck presets, saved places, route alternatives, focus dashboard and custom watched cities remain.

The new Supabase client is a small bundled module attached to the existing classic app by `shared-reports.js`. The rest of the app is not migrated to a framework. Existing routing globals remain the source of route-relative distances.

## Implemented update

- Real email/password sessions and optional account-backed reporting; private profiles and saved-record storage.
- Central report storage, Supabase Postgres Changes subscription, periodic recovery, bounds/direction/route filtering, sender feedback, timestamp/expiry/provenance and account-scoped offline queue.
- Four icon-based primary categories, floating entry point, near-station Open/Closed observation controls; fresh corroboration rules default Unknown.
- Registry seeded from all 212 original government stations, proximity/direction validation, client idempotency, per-account rate limit, immutable driver source/expiry and basic moderation flags/admin visibility control.
- Vehicle cards, saved truck combinations, load-state metadata without guessing weight, 30 recent destinations and five quick favorites in addition to all original saved places.
- Explicit upload/download of private settings, voice preferences, history/favorites and saved vehicle configurations.
- Six themes; core six-language controls; direct Explore-map taps; purple route and brighter night rendering; map hamburger menu; valid-trip-only Pause/End visibility; compact re-center.
- Device voice selection/volume/Test Voice, explicit missing-voice feedback, turn/exit speech details and radio-volume restoration. Audibility/Safari behavior unverified.
- One persisted route package, profile and prepared instructions with an offline GPS canvas; user-permitted app caching, content-version reuse, size/storage feedback and delete control. No basemap/reroute promise.
- Server config/health and authenticated deterministic Ask Rahyar data lookup. Map changes require a click; no destination change is performed by the assistant. No LLM/wake-word service activated.

## Database/services

Existing Supabase `pdipokhucdzttziyzoiw` in ca-central-1, Free plan. Before changes it contained no application tables/migrations/users/storage. Migrations add `rahyar_profiles`, `rahyar_saved_records`, `rahyar_road_reports`, `rahyar_report_flags`, and `rahyar_stations`, with private trigger helpers. RLS and explicit column grants prohibit public writes, profile access by another user, source/expiry forgery and client moderation. Only signed-in users can access shared reports; they intentionally see relevant driver observations from other accounts. Admins moderate through secure database/dashboard access. Flags do not automatically establish truth.

Existing Vercel project `rahyar` is configured as a static classic app with Node API endpoints, Node 24, root repository, `npm ci`, `npm run build`, output `dist`, yul1. Preview/development use only Supabase publishable credentials. Production credentials/deployment are not enabled. Deployment eligibility under Hobby terms is unresolved; no paid plan was activated.

## Known issues / pending work

- Direct public truck routing rejects long requests with DistanceExceeded. Bounded segmentation now produced continuous Toronto–Winnipeg and Toronto–Vancouver Canada-only truck routes using the configured dimensions, with section-join and original-waypoint accounting tests. Global optimality, every alternative corridor and navigation on real roads remain unverified. North Bay needs live route/device validation despite the generic fork-wording improvement.
- Ontario 511 confirms existing Wasi South/North identities, direction and coordinates. Wassi spelling lookup and dashboard-derived station-key aliases are corrected without changing the 212 station registry. Official inventory has no live operating-status field. Latest driver observations are not official status; collusion/spoofed physical GPS remain possible. Moderation is basic, not a complete trust system.
- No staging URL yet. Vercel Git namespace discovery is empty and Hobby commercial eligibility is not established. Optional Netlify preview adapters reuse the existing APIs, block main/production builds, and require owner authorization plus explicit Free/private settings. No new cloud project was created. See docs/STAGING_ACCESS.md. Main/public hosting unchanged.
- Full interface localization, reliable six-language voices and audio/radio coexistence on actual iOS devices require manual testing.
- LLM integration/usage controls remain pending a verified approved zero-cost provider. Current assistant is deliberately labeled data lookup.
- Detailed offline maps, offline rerouting and verified truck-permitted roads require suitable engines/licensed sources. No official live road-alert ingestion credentials were available.
- Local saved route geometry/origin/destination/profile/guidance survive reload, with a matching destination restored as a non-live map preview. Live tracking requires deliberate restart and online revalidation; automatic GPS resumption is intentionally not performed.
- Saved-trip/favorites backend storage exists, but cloud synchronization currently covers an explicit settings bundle, not complete trip/media archives. Feedback/bug/AI-usage kinds are schema-ready; complete dedicated UI/workflows are pending. Existing carrier reviews remain device-local.
- Supabase warns leaked-password protection is disabled. Do not enable a paid plan without permission. Expired reports are hidden by RLS/client filters but retained until an approved retention job/admin cleanup is implemented.
- Native CarPlay is future work, documented in `docs/CARPLAY.md`.

## Verification discipline

Run `npm run verify` after edits. Opt-in live and two-context browser tests use dedicated accounts via an external credentials file, never real drivers. Browser GPS/route fixtures are emulated; physical iPad/iPhone Safari, actual road legality, and audibility are not claimed as tested. Keep explicit blockers and costs in `docs/RELEASE_HANDOVER.md`.


## 21 November 2026 — trip reports and protected sharing

See [implementation, verification and rollback](docs/TRIP_REPORTS_20261121.md). New journal/admin/contact/share tables are additive and RLS protected. Owner account is invited but awaits email verification. Private journeys, actual GPS evidence, map route choices, date history, print/PDF/JSON, protected sharing and device/cloud persistence are integrated without changing the frontend framework. Public sharing remains blocked by Netlify account login; exact reported BC border/exit cases and physical Safari soak testing remain unverified.

## 21 November follow-up — completion review

The authoritative current status is [request completion review](docs/REQUEST_COMPLETION_REVIEW_20261121.md); older dated notes above describe earlier states. Segmented and user-waypoint routing now retain up to three genuine full-route alternatives, keeping original legs, current truck dimensions and country filtering. Variants replace a single provider-routed section and are not an exhaustive corridor search. Report action controls follow the six-language selector. No database or production-access changes are included.

## 22 November — road label and audio

See [road/audio follow-up](docs/ROAD_LABEL_AUDIO_20261122.md). Fixed centered current-road slot, compact mandatory map attribution, reused audio settings in the map menu, persisted separate warning/speech volume, configurable warning tones and Safari speech start/error handling. No paid TTS or guarantee of untested device audibility. Previous user mute preferences remain respected.

## 22 November — learned corridor default

See [corridor preferences](docs/CORRIDOR_PREFERENCES_20261122.md): immediate account/device-scoped route-choice anchors, current-profile/avoidance revalidation as first default, retained other alternatives, merged city-bridge option recovery and bounded generic diversification. No new provider/project/database. Exact Calgary full north/south/22X alternatives are explicitly incomplete, despite genuine multiple returned shapes.

## 22 November — upcoming corridors

See [nearby-corridor handover](docs/UPCOMING_CORRIDORS_20261122.md). Background proposals target the upcoming driving window, preserve the active route, reuse native shape vertices/profile for suffix estimates, refine actual forward road points, persist choices/gating, and reject stale results/selections. Nearby overview clears camera padding; labels sample visible branches. A genuine PTH 101 North reference option is verified; exact user address/profile, all-country/city coverage and physical Safari remain unverified. No database/main/production-access changes.

## 23 November: completed audio/layout follow-up

See [overall review, precise capabilities, tests and rollback](docs/AUDIO_LAYOUT_RELEASE_20261123.md). Persian basic now uses nine actual bundled synthetic prompts independent of browser voice installation; arbitrary road-name/number TTS remains unsupported by this fallback. The road label shrinks to its text and occupies the measured lower-map gap between docked trip sheet and milestone. It hides behind no full-width expanded panel. All changes remain on development PR #2; physical iPad output remains a manual check.

## 24 November: blank-map/search recovery

[Reproduction and verified recovery](docs/MAP_RECOVERY_20261124.md): actual basemap tile readiness now controls vector visibility, preserving Leaflet streets when vector data fails; real map-layer Retry restores vector rendering. Destination selection previews without GPS and permission errors remain visible. The offline status banner is no longer hidden by the shell CSS. The exact user's iPad/network fault remains unverified; failure injection and normal Chromium route regressions passed.
