# Map-first navigation redesign

Based on the user-supplied dark Rahyar navigation reference and familiar map-navigation interaction principles. No Google source, icons, tiles, branding or proprietary assets were copied. This is a new development branch based on `43b7dad`, extending the unmerged comprehensive update. Main and existing Supabase data are not modified.

## Presentation architecture

`navigation-shell.js` moves existing live DOM nodes, IDs and event handlers into a full-viewport map shell, one three-state bottom sheet, a compact trip planner, and modal feature menus. `navigation-shell.css` defines the new navigation layout. Old containers stay available for initialization compatibility, but do not form a second dashboard. A small `navigation-redesign` guard prevents legacy cockpit reparenting from taking ownership of the new layout. No framework migration or backend schema change is involved.

The same Valhalla vehicle costing/profile, highway/via preferences, alternatives, GPS/ETA/weather calculations, geographic datasets, Supabase Auth/RLS/Realtime client, media player and saved places are retained. Camera padding now accounts for sheet height; first navigation activation zooms to the vehicle. Day/night, satellite and 2D/3D controls still act on the existing providers. Night road/label styling is brighter. Vector labels/tiles remain from the existing services, not Google.

## Working UI

- Full-screen map; original Rahyar identity; navy controls, purple route and compact custom SVG controls/vehicle position marker.
- Green live maneuver banner using real provider instructions, road references and exits. Restored trips explicitly remain non-live until the user restarts GPS.
- One bottom sheet on phones and tablets: collapsed destination/time/distance/arrival; half next three route-relevant cities with forecast/arrival data; full facilities, border, route alternatives, filters, summary and trip actions. Handle/summary drag, handle taps, keyboard arrows/Home/End and internal scrolling are supported. Essential maneuver and speed areas stay above the fully expanded sheet at tested sizes.
- Current mapped speed limit and separate actual GPS speed. No upcoming sign beyond 300 m, no permanent second sign, no invented missing limits; stale/inaccurate GPS suppresses the upcoming warning. Data is still mapped OSM/Valhalla advisory information, not officially verified truck-specific limits.
- Search/direct map selection, compact vehicle controls, 30 recent destinations, five favorites, named Home/Work saved-place shortcuts, saved vehicle/trailer settings, via points and alternative routes.
- Four icon-only report categories. Existing route/explore filtering and real backend rules are preserved; the redesign does not add a new backend or write test reports.
- Functional entry points for Ask Rahyar, settings/voices/languages, accounts, radio/local media, offline preparation, traffic, official links and carrier reviews. Features are moved, not represented by decorative substitutes.

Home/Work uses the existing saved-places store; assigning requires a selected destination. Existing places are reused and an active destination change asks for confirmation. The existing explicit cloud settings bundle is not expanded into automatic full trip/media sync.

## Verification

`npm run verify`: all original regressions plus three speed-sign display regressions. The focus-dashboard test mock now checks the actual class name instead of treating every CSS class as active.

`BASE_URL=http://127.0.0.1:3031 npm run test:ui`: real provider route/map, actual visible map canvas, maneuver visibility, sheet taps/keyboard/pointer drag, menus/account/assistant/report entry points, portrait iPhone (390×844), landscape iPad (1180×820), landscape phone (844×390), safe route/vehicle restoration and screenshots. GPS is emulated. Provider weather failure is allowed only as explicit unavailable information; no weather is fabricated.

The planning/offline integration suite uses the new menu entry point while retaining the same assertions. The road-test suite retains its real car/truck checks for Canada/US/UK/Germany, with direct map tapping adjusted to close the planner first. These integration tests are opt-in; do not count a command as passed unless its execution result is recorded.

## Actual limitations

- No physical iPhone/iPad Safari, real-road legality, audio audibility, radio-codec interoperability or touch-device background execution claim.
- Core six-language controls remain; new detailed navigation-shell/menu copy is not fully localized. SVG reporting controls retain translated accessible labels when the language changes.
- Ask Rahyar remains authenticated deterministic data lookup with optional detected browser speech input; no LLM or wake-word service is enabled.
- Existing offline capability is basic app/route/guidance caching and a GPS canvas. No detailed/offline basemap tiles or offline rerouting; Safari eviction remains possible. No nonfunctional quality selector was added.
- Official station inventory has no live operating-status feed. Existing driver corroboration/Unknown behavior and facility coverage gaps remain.
- No public truck-legal road guarantee/layer, universal country restriction coverage, full live government incident feed, toll/customs engine, or native CarPlay implementation is added by this UI task.
- Some public providers have fair-use/commercial-license restrictions; no paid service is enabled.

## Preview and recovery

Use a new PR Deploy Preview on existing Netlify site `eclectic-arithmetic-148297`; never merge main, unlock production publishing or change its URL. Supabase uses the existing preview-only publishable configuration, with no database migration.

The account was previously forcing Netlify login on all contexts. Public preview visibility must be configured independently of production by the account owner; the current connection has no supported visibility-control tool. A protected 401 is not public acceptance. Completion requires an unauthenticated HTTPS 200 containing Rahyar and its UI assets rather than a login page. Do not change production visibility or create duplicate projects to work around this.

Pre-redesign source backup: `/workspace/work/backups/ui-redesign-20261118T130316Z/before-redesign.bundle`, independently cloned and fsck verified, contains original baseline and latest pre-redesign development. Recover source into a separate checkout; retain database records and existing production. Roll back a test deploy by redeploying reviewed `43b7dad` as a preview only. The Git backup is not a backup of external database/account settings or device-local media.

## Road-test corrections — 2026-11-18

Backup before edits: `/workspace/work/backups/roadtest-fixes-20261118T153741Z/before-fixes.bundle`, independently restored and checked. Production/main and Supabase data are unchanged.

Long legs are proactively divided into bounded geographic sections (400 km straight-line threshold) using existing country/continent-aware catalog waypoints. Provider limits and transient section failures can recover through further subdivision, within request/depth bounds. Sections use the actual selected vehicle dimensions/costing and are joined into continuous geometry/guidance. This can introduce detours and does not certify legal truck access or optimal routing. No individual highway itinerary is hardcoded as a replacement routing engine.

Browser routing now posts to `/api/route` (Netlify Function adapter), a fixed Valhalla upstream with bounded body/waypoints, validated truck dimensions and timeout. It stores no GPS and uses no privileged keys. Legacy static hosting falls back to direct requests only when the endpoint is absent. Public routing remains best-effort/fair-use; a commercially licensed provider is still required for dependable production capacity.

Controls now follow the reference's left/right arrangement. Actual GPS speed is in the upper badge, mapped current limit below, with an approaching yellow sign only under the existing reliable-data/300 m rules. Unknown limits remain unknown. Original shaded SVG car and semi-trailer graphics provide a 3D-style presentation. GPS camera framing places the vehicle lower, outside the right-docked watchlist. Landscape tablet watchlist occupies half the width at lower right; portrait retains the bottom sheet. Rows/text are larger and a right-hand collapse control is available. This layout interprets the requested half-screen/right positioning; the reference's photographic satellite scene is not simulated.

Executed live browser truck routes from Hearst: Winnipeg ~1,359 km/3 section requests; Vancouver ~3,841 km/17 requests, continuous Canada-only geometry and no browser errors. GPS was emulated, not physical iPad GPS. `npm run verify` passes 56 tests, including gateway validation, camera framing, proactive segmentation and timeout recovery.

Reproduce the opt-in long-route checks with `BASE_URL=http://127.0.0.1:3041 node tests/integration/long-route.browser.cjs` after starting the local server on that port. These calls use the real upstream and should not be repeatedly load-tested.

Current correction checklist:
- [x] Recoverable pre-change Git backup.
- [x] Same-origin routing gateway and bounded long-trip segmentation.
- [x] Live long-distance truck checks (Hearst–Winnipeg/Vancouver).
- [x] Speed hierarchy, original dimensional vehicle SVGs, lower GPS framing.
- [x] Left/right control arrangement and right-docked tablet watchlist.
- [x] Unit/syntax/build checks (56 unit tests).
- [ ] Physical iPad/iPhone Safari, voice audibility and real-road GPS verification.
- [ ] Public unauthenticated preview access (Netlify account still returns 401).

Eight individual real route checks (car/truck × Canada/US/UK/Germany), weather availability, signed-out report protection and selected-route retention after network failure were observed in the road-test run. The browser process was stopped after these recorded cases to release resources; this is not claimed as a completed full-suite run. No two-user backend report test was rerun during this frontend correction.

The final truck UI browser run completed successfully at 1180×820, 390×844 and 844×390, including speed hierarchy, lower camera framing, sheet gestures, menus, route restoration and zero page errors. Updated screenshots are in `docs/screenshots`. The screenshot GPS sample can become stale during lengthy tests, correctly displaying a fresh-fix warning rather than live guidance.
