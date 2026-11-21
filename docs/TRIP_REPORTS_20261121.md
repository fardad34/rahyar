# Trip history, protected sharing and navigation follow-up — 21 November 2026

Development continues in PR #2 on `feature/navigation-redesign-20261118T130316Z`. No main merge, production publish/unlock, hosting visibility change, paid service or duplicate project is involved.

## Delivered behavior

- **Administrator:** a passwordless owner account/invitation was created in the existing Auth project. A private email allowlist and verified Auth identity control the claim; editable user metadata cannot grant a role. The account is pending email verification. The browser receives no service key. Admin access covers app functions and opted-in debugging reports, not other users' non-consenting private journeys or provider billing/quota overrides.
- **Reports in Settings/menu:** each new live trip records original origin/address (reverse lookup where available, explicit GPS fallback otherwise), destination/address, original provider route, measured GPS track, completed/cancelled state, timestamps, vehicle/profile, route-change/avoidance metadata and build reference. GPS noise, implausible jumps and stale fixes are rejected. Missing GPS intervals are marked as gaps and are not converted into invented road travel.
- **Viewing/export:** proposed and driven geometry are distinct colors in the report, and can be overlaid on the existing live map. JSON exports are suitable for developer review; native Print/Save PDF includes vector route/track diagrams and dual km/mi measurements. The printable diagram is schematic, without a basemap. Single/all exports and a registered-user share collection are available. Very large per-link collections are explicitly rejected at the 3 MB payload limit; JSON/PDF or separate links remain alternatives.
- **Retention:** no artificial trip-count retention cap. IndexedDB history is date-indexed and displayed in pages of 25. Signed-in completed/cancelled journeys sync privately to Supabase, with pending-record indexing and retry. Cloud history is fetched by page/date. Guest journeys remain local unless the user explicitly imports them into an account. Browser/server storage quotas, memory for large exports and Safari eviction still apply; storage usage is shown. This is not a promise of infinite free storage.
- **Privacy/access:** reports are private by default. Individual or future-trip consent enables admin debugging review. Shares require a random link ID, authenticated non-anonymous recipient, verified email and a saved international-format phone number. Phone is **not SMS verified**, as requested. Links can be revoked. Link enumeration and private cross-user reads are blocked by RLS. The same-origin share endpoint forwards the caller's JWT/publishable key and link header; it does not bypass RLS.
- **Route selection:** at most three actual provider routes are drawn in different colors with distance/time labels on the map; tap a line/label to select, with confirmation for an active trip. No alternative-distance/ETA selector is shown in menus/panels. Active-trip progress remains in the existing bottom sheet. The fallback 2D map also draws selectable polylines. Routes are not invented when the provider returns fewer than three.
- **Driver changes/closures:** a map point can be marked as driver-reported closed or truck-prohibited. Up to 12 current, 24-hour avoidance points are sent to Valhalla as actual `exclude_locations`, along with unchanged truck dimensions/costing. Truck-specific avoidances do not affect car requests. These are personal avoidance preferences, not official road data or a fifth public report category.
- **Rerouting:** reliable off-route fixes calculate from the current position while preserving the old line until success. Off-route recalculation no longer favors continuity with a previously selected alternative over the driver's actual deviation. Stale cached fixes cannot trigger a reroute. Exact exit-40/53 road behavior remains unverified without the original track/current restriction data.
- **Memory:** completed, sufficiently recorded, endpoint/profile-matching journeys can offer a previous corridor on the map. It is recalculated against the current vehicle/provider/avoidances before use. Gaps/incomplete/cancelled tracks are not learned as complete routes. No previous drive is represented as legally certified truck access.
- **Map places:** explicit map selection works during navigation after confirmation, with label/favorite controls, saved-address/map-label navigation and user-owned avoidance controls. Existing saved places and report features remain.
- **Resilience:** selected alternatives are saved alongside the selected route in primary storage. A compact fallback preserves the selected line if IndexedDB fails. Context loss falls back to 2D without ending GPS; missing active-route sources/layers can be rehydrated. This is not a guarantee of uninterrupted iOS background GPS or a completed two-hour physical Safari soak test.

## Database changes

Additive migrations (history aligned with the existing remote project):

- `20261121150136_trip_journal_admin_sharing.sql`: private invitation schema, admin roles, private phone contacts, trip journals, protected share snapshots and RLS/grants.
- `20261121151106_harden_journal_admin_claim.sql`: privileged claim implementation is private; exposed RPC is security-invoker and only forwards the authenticated caller. Default PUBLIC/anon execution is revoked.

Existing inventory/profiles/reports remain 212 stations, 2 synthetic profiles, 24 synthetic observations and no saved records at verification. No existing records were overwritten. Live SQL tests run in a transaction ending in rollback, using only existing synthetic identities; their temporary admin/contact/share/journal rows do not remain.

The security advisor reports no new RLS/definer warnings after hardening. The pre-existing leaked-password-protection warning remains; no subscription upgrade was enabled.

## Verification actually executed

- Unit/syntax regression suite: 79 tests after all additions (reroute, journal evidence, avoidance validation, shared endpoint/adapter, boundary regression and existing tests).
- Existing responsive navigation UI passed at 1180×820, 390×844 and 844×390; lifecycle regression passed tab/IndexedDB failure and upgrade preservation; six-language/control menu suite passed.
- Journal browser suite used real provider/map data and emulated GPS: three real route options, tap selection, suggested/actual tracks, valid JSON, a real `%PDF` artifact, viewing both paths on the map, cancellation/date persistence and no page errors.
- Simulated graphics-context loss and removal of route sources/layers recovered while preserving GPS/geometry. This is a controlled browser test, not a physical GPU or two-hour road test.
- Map-place suite passed labeling/favoriting, vehicle-specific avoidance storage, navigation from the saved-address menu, shared-link registration entry and no page errors.
- Live PostgreSQL RLS suite (`tests/integration/journal.rls.sql`) passed owner isolation, denied admin self-escalation/owner forgery, link/contact access, revocation and admin debug-consent filtering; all test writes rolled back.
- Real Vancouver–Calgary truck-route diagnostic: ~973.9 km total; BC/Alberta crossing ~783.1 km from the chosen Vancouver origin, near Kicking Horse Pass. Sampled real geometry is a boundary regression fixture. This does **not** reproduce the user's unprovided Vancouver–Winnipeg screenshot/origin/distance.

## Remaining verification and limits

- Owner must confirm the invited email, sign in and save a phone number. Role is not granted before verification.
- Separate real-browser/account email/phone/share roundtrip remains manual; SQL authorization and endpoint/entry flows are tested, but not presented as a completed two-device registration test.
- Exact BC-border complaint needs its origin/reported number; exit 40/53 and a two-hour physical Safari/GPS/audio test need real-road/device evidence.
- Complete official speed/camera/milestone/road-legality coverage is still unavailable. Ordinary road classes are not marked truck-legal.
- Detailed report/status copy remains partly English; main new menu labels follow the existing six-language selector.
- Current Netlify account protection returns unauthenticated HTTP 401. The preview can be deployed but public recipients cannot reach it without the hosting restriction being resolved. App registration does not bypass Netlify login. Production visibility has not been changed.
- Supabase Free database quotas and Auth email delivery/rate limits apply. No paid SMS, subscription, storage project or routing/AI provider has been activated.

## Backup and rollback

Pre-change Git bundle: `/workspace/work/backups/trip-journal-20261121/before.bundle`, original baseline/main/history included. Existing public data was exported privately to `public-data.json` in that directory (0600), parsed and hashed; credential fields were excluded. Existing schema is retained in the original migrations/Git backup. This is **not** a full backup of managed Auth secrets/sessions, Netlify settings or device-local media; those secrets were not exported.

Revert only the preview to reviewed `2b3b717` to roll back frontend/API behavior. The new tables can remain without breaking the previous application. Preserve any newly collected journeys/shares; do not drop tables or delete the owner account during rollback. Any access revocation/data migration should be reviewed separately. Never force-push/merge main or unlock production as a recovery shortcut.

## Running the checks locally

Run `npm ci`, `npm run verify`, then `PORT=3046 npm run dev` with the existing publishable-only `.env.local` configuration. In another terminal:

```sh
BASE_URL=http://127.0.0.1:3046 node tests/integration/trip-journal.browser.cjs
BASE_URL=http://127.0.0.1:3046 node tests/integration/map-places.browser.cjs
BASE_URL=http://127.0.0.1:3046 npm run test:ui
```

These opt-in browser suites use real public routing/map services and emulated GPS; they are not provider load tests. `journal.rls.sql` is a rollback-only operator test requiring the existing synthetic staging identities and privileged SQL access; do not run it as an untrusted browser API. A journey already in progress when recording is first introduced is marked partial; unobserved earlier GPS cannot be reconstructed. Primary trip storage retains the original departure timestamp through app restoration.
