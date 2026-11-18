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
