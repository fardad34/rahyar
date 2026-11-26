# Safari road-test follow-up

This continues PR #2 on the same development branch/Netlify preview. Production/main, access settings, subscriptions and Supabase are unchanged.

## Changes

1. Navigation menu labels, feature-dialog headings and main control labels follow the existing six-language Interface language selector in Settings > Display & app. Update app defaults to English, rather than permanently mixing English/Persian. Detailed technical/provider/status copy is still partly English; this is not full localization of every application string.
2. Landscape follow camera places the vehicle at 56% of viewport width and 80% height, matching the position marked in the supplied screenshot. Road text follows below the vehicle. Search framing keeps it outside the planner.
3. Remove the U-shaped route-alternatives shortcut from the map; retain real alternative-route selection in the menu. Controls form one right-hand column. On a small phone the rail scrolls to avoid disappearing beneath the trip sheet.
4. Original shaded radio SVG, with the existing functional Play/Pause control beside it. Playback uses SVG shapes instead of emoji and keeps the existing media engine; station selection is required before Play is enabled.
5. Planner car/truck cards use centered larger illustrations and accessible labels, without visible captions. A red X ends the current trip; it is disabled when no trip is present.
6. Full city table now has bounded fonts, fixed available width and visible weather conditions, consistent with the compact next-three rows. Forecast failures remain explicit, rather than being removed or fabricated.
7. Active-trip intent persists across tab/process sessions until explicit Pause/End (or location permission denial). Full route/profile/guidance remains in IndexedDB, with a bounded compact localStorage fallback. The fallback retains the complete route line and removes duplicate per-step geometry/intersection graphs. Progress is checkpointed every 15 seconds and on background/pagehide. An IndexedDB read timeout can restore from the fallback. Storage failure is reported; no claim that browser eviction or separate Safari/in-app browser storage contexts are solved. WebKit may suspend background GPS/audio; actual device testing is required.
8. Mapped signals/cameras/junctions query the active map rather than the hidden fallback and work at highway navigation zoom >=11 (Explore remains >=14). Junction lookup includes trunk/motorway roads. A kilometre badge shows `km —` when no mapped nearby milestone has a distance. This is an explicit unknown, not a synthetic road kilometre. Provider failure/incomplete results are identified in the map-layer data status. Live Overpass checks during this task failed (main returned non-JSON, secondary timed out); reliable live inventory is therefore **not verified**.
9. Recent history is visible when planning. Existing last destination can migrate into empty recent history, while explicit Clear is respected. Durable trip and destination storage are tested on a new tab with IndexedDB deliberately unavailable. Automatically selected destinations remain distinct from manually named Saved places.
10. **Blocked:** verified truck-permitted blue roads. Existing public OSM/Valhalla services cannot certify all applicable dimensions, axle, cargo and country restrictions for visible roads. No ordinary road-classification layer is colored as legally truck-permitted. The limitation is stated in Map appearance; no decorative toggle is added. A properly licensed, sufficiently complete restriction dataset/provider is needed. Purple routing is preserved.

## Verification

- `npm run verify`: 67 unit/regression tests passed, including durable trip intent and explicit End behavior.
- Real-route lifecycle browser suite: 30 destinations, GPS timeout/background return, upgrade without recalculating the selected route, new tab with blocked IndexedDB, exact route-line restoration, End and no page errors.
- Menu browser suite: all six selected languages change Update app/menu text; icon-only vehicle cards, red End control, radio/playback placement, single-column controls and alternatives in menu.
- Navigation UI suite covers iPad/iPhone sizes, gestures and full-table typography. No physical Safari/real-road or audio audibility claim.
- Build produces updated app bundle/offline manifest. No database mutation or migrations.

## Recovery

Pre-change `/workspace/work/backups/safari-ui-20261118/before.bundle` includes baseline/main and `a1673ec` development history. Restore into a separate checkout and verify with `git fsck --full`. Roll back only the preview to reviewed `a1673ec`; never unlock production or merge main without approval. Git backups do not cover cloud database/account settings, which are not changed in this task.

The current Netlify account still forces login. An expired login or a different in-app browser can block the URL even when local route persistence works. Update app preserves valid authentication; it cannot bypass the hosting login. Production visibility has not been authorized for change.
