# Map/search recovery — 24 November 2026

User reports blank map and search not activating the map on iPad. No screenshot upload is required to reproduce the failure class. The exact user's iOS/network cause is not independently verified.

## Reproduced failures

1. With real OpenFreeMap style metadata and only vector tile requests deliberately blocked, the old app reported `navigationReady=true`, hid Leaflet and showed an empty vector surface. **25 real raster tiles had already loaded underneath.** This reproduces a blank map without involving the service worker.
2. The navigation shell's blanket body-child CSS hid the new offline banner. The previous test checked its text but not visibility. Both CSS and regression assertion are corrected; the status banner cannot intercept touch controls.
3. With GPS denied, destination selection did not provide a useful camera/pin preview. GPS error text was confined to the planning/settings panels and the main message was cleared.

## Corrected behavior

- Keep genuine Leaflet streets visible while the vector basemap is loading. Style/metadata success is not map-data readiness. Only a loaded tile from the actual vector street source (or selected imagery source) can reveal the vector view. Relief raster and journey GeoJSON do not count as loaded streets.
- The event gate is verified against the vendored MapLibre 4.7.1 event shape: its actual loaded-tile event can omit `sourceDataType`. A unit test protects this rather than assuming a different engine's event fields.
- First-load failure retains a centered 2D map; a failed new viewport after panning also falls back when its primary source errors and the viewport lacks rendered base features. No route/profile/session reset is used. The existing Map layers → 2D/3D control performs a real retry, tested through the UI after unblocking the provider.
- Destination search can show a selected place/pin on both map engines without inventing GPS or a route. The planning sheet closes to reveal that preview. Active-route cameras are not moved by the preview helper. Calculating from the current position still requires actual GPS permission; denial is visibly reported on the main screen.
- A generated online recovery entry (`road-test.html`) bypasses an older worker’s home-page HTML fallback without clearing storage or changing origin; replaceState returns the displayed URL to home, so later normal offline reload remains supported. This is an update-recovery link, not a new UI feature.
- Existing shell/data/tile caching remains enabled; no speculative assertion that caching caused the user's device failure, no additional feature or cloud project, no production/DB change.

## Executed verification

143 unit/regression tests passed, zero failed; syntax and production-style build passed.

Real-provider browser checks:
- blocked vector tiles → real raster streets remain visible;
- real local-catalog destination search with GPS denied → correct preview/pin and visible permission error;
- offline banner is actually visible;
- healthy vector view → failed new viewport → correctly centered real 2D fallback → existing Map layers Retry restores real 3D tiles;
- normal route/map, bottom-sheet gestures, 1180×820 / 390×844 / 844×390 layouts, route/profile reload with GPS intent, no page errors;
- actual worker install, explicit offline PREPARE, offline HTML/CSS/app reload and reconnection banner.

Provider failures are deliberately injected only in tests. No fake production basemap or routing response was introduced. GPS is emulated/denied in tests. Physical iPad Safari/Chrome, mobile-carrier connectivity and real-road behavior remain unverified; successful Chromium checks are not device certification.

## Recovery

Development PR #5 only. Pre-change private full-history backup: `before-map-recovery-20261124.bundle`. Source rollback point: `98c350ec3111509341dcddf988fdbbcddeb5ef62`. Previous pre-three-stage preview remains available at deploy-preview-2 (93eb100). No main merge, production publishing unlock, access-policy change, paid service or Supabase write.
