# Road-test feedback update — 18 November 2026

Work continues on `feature/navigation-redesign-20261118T130316Z`, PR #2 and the same Netlify Deploy Preview. Main, production deployment/visibility/publishing lock, Supabase schema/data and paid-service settings are unchanged.

## Implemented

- Direct vehicle-aware routing is attempted before distance-limit segmentation. Artificial catalog cities are no longer forced on every long leg. When segmentation really is needed, internal city excursions can be replaced only by shorter, connected routes returned by the same truck/car router. User-selected via points are preserved. This is not proof of legal access or globally optimal routing; public OSM/Valhalla restrictions remain incomplete.
- Landscape watchlist is at lower left with a small edge margin, larger names, weather beneath distance, a right-hand collapse control and three city rows. Vehicle framing centers in the remaining right-hand map area, low in the viewport. Available current-road text follows below the vehicle.
- Independent 3D shortcut removed; layer menu retains 2D/3D. All map controls are on the right. Zoom minus uses an explicit SVG stroke, avoiding duplicate gradient references in hidden dialogs.
- Temporary GPS errors do not stop the trip. Visibility/page restoration reconnects the watch without clearing the selected route. Session intent distinguishes active trips from explicit Pause/End. Same-tab reload resumes an active saved route; a new session without active intent remains review-only. iOS can still suspend web GPS/audio in the background; uninterrupted background execution is not promised.
- Last 30 selected destinations remain in local storage with an IndexedDB mirror, with an explicit menu entry for recent/favorite destinations. This is device/origin storage, not guaranteed cloud synchronization; Safari/private-mode eviction can remove it.
- A nearby mapped kilometre/mile marker is shown only when an OSM milestone has an explicit distance and GPS is within 100 metres. No value is inferred from trip progress, a station ID or road length. Continuous chainage between markers and complete coverage are **not implemented**.
- Traffic signals, mapped cameras, motorway junctions and shared-node road junctions use custom SVGs. Grade-separated geometric crossings alone are not treated as junctions. Data is from OpenStreetMap/Overpass, advisory and incomplete. Markers require useful zoom; provider failure leaves them unavailable rather than inventing data. This is not a complete official camera inventory.
- Quick media dialog shows lists and Play/Pause only. Library editing stays under Media settings. “کلاب نبرد اندیشه‌ها” uses the HLS stream referenced by the supplied `/listen` page. That page and stream manifest returned HTTP 200; actual audio audibility/codec behavior on physical Safari remains manual.
- Menu action **به‌روزرسانی برنامه · Update app** checks that the next page is Rahyar, checkpoints the trip, updates the service worker and reloads the same origin. It does not clear cookies, auth, local settings or saved destinations. A network failure or hosting-login response leaves the running trip open. It cannot bypass expired Netlify account authentication.

## Verification

- `npm run verify`: **66 passed, 0 failed**, including topology/milestone parsing, left watchlist camera, artificial-stop bypass, trip lifecycle and upgrade failure safety.
- `npm run build`: shared browser bundle and offline manifest built successfully.
- Planning/offline browser suite passed: 30 destinations, six themes/languages, responsive overflow and prepared offline reload.
- Final navigation UI browser suite: tested sheet gestures/keyboard, menus, route visibility, speed hierarchy and same-tab active-trip restoration at iPad/iPhone dimensions. Updated screenshots are in `docs/screenshots`.
- `BASE_URL=http://127.0.0.1:3042 node tests/integration/feedback.browser.cjs`: passed real Greenstone–Winnipeg truck routing under 1,100 km, 30-destination reload, temporary GPS failure, background/foreground, quick media, menu upgrade preserving exact route without a new routing request, End Trip and no page errors.
- Live router diagnostic: Hearst–Winnipeg ~1,351 km; Hearst–Vancouver ~3,639 km (previous forced segmentation was ~3,841 km). Continuous truck-costed Canadian geometry, with the existing profile and bounded request budget. No physical road/legal-access claim.
- Physical iPad/iPhone Safari, real background GPS/audio, speed-camera completeness and road-marker chainage remain manual/coverage limitations. No database/report mutation tests were performed in this frontend update.

## Backup and release safety

`/workspace/work/backups/feedback-update-20261118/before.bundle` includes the complete pre-change Git history and original baseline, verified by `git bundle verify`. Restore to a separate checkout (`git clone /path/to/before.bundle restored-rahyar`) before choosing a recovery branch. This is not a backup of external Supabase or Netlify account settings; no changes to those data/settings are needed here. Roll back only the preview by redeploying reviewed `1b5143b`; do not merge or unlock main.

The existing Netlify account enforces login on both production and previews. Public unauthenticated access remains blocked unless separately authorized/configured. The update button preserves an existing valid login, but does not remove this account-level restriction. Do not change production visibility as part of this update.
