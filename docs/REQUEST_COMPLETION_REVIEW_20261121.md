# Request-by-request completion review — 21 November 2026

This is the current checklist, not a declaration that every comprehensive-update requirement is finished. Production/main and hosting visibility remain unchanged. Work continues on the existing development branch/PR #2. Before this follow-up, a complete Git bundle was saved as `before-review-fixes.bundle` in the private backup directory. See `TRIP_REPORTS_20261121.md` for database backups and their gaps.

## Latest eleven requests

| Request | Actual implementation | Remaining verification / constraint |
| --- | --- | --- |
| Owner administrator | Verified-identity/private invitation allowlist, no client role escalation; owner invited | Owner email confirmation required. No quota/billing bypass. |
| Per-trip origin/destination, proposed/driven paths, complete/cancel, km/mi, individual/all exports, date history | IndexedDB plus private account sync, map overlay, JSON and native Print/PDF | No artificial record-count cap; actual browser/Free database/3 MB share limits apply. Unobserved GPS cannot be reconstructed. PDF map is schematic. |
| Driver deviations and prohibited/closed roads | Current-GPS off-route recalculation, truck dimensions and real provider exclusions; old line remains until success | Exact exit 40/53 road trace unverified. User avoidance is not official legal data. |
| Up to three colored touch-selectable routes | Direct provider alternatives; follow-up retains provider alternatives across segmented and user-waypoint journeys | Not guaranteed three. Alternatives replace one provider-routed section at a time, not an exhaustive search of all possible corridors or their combinations. No additional requests to manufacture three. |
| Remember a previously driven corridor | Completed, sufficiently tracked, endpoint/profile-matching routes offered and recalculated | Requires usable recorded history. Never certifies legality. |
| Alternative km/time only on map | Colored map labels/selectable paths, old metrics selector hidden | Active selected-trip progress stays in the bottom sheet. |
| Map labels/favorites | Label/favorite editor and saved-place controls | Device local; not a claim of automatic account-backed label sync. |
| Choose destination on map | Explore/direct and explicit map-pick interactions; active destination confirmation | Mobile physical tap testing remains manual. |
| Navigate saved addresses from menu | Saved-address/label menu routes to selected destination | Existing stored addresses preserved. |
| Maintain trip across app switching | Durable intent, route/profile/progress/alternatives, GPS reattachment, context-loss fallback | Browser cannot guarantee background GPS. Physical two-hour Safari soak remains open. |
| Registered email/phone sharing and server diagnostics | Protected revocable share links, verified-email+saved-phone gate, private sync, explicit debug consent and admin inbox | No SMS verification (owner choice); real two-account mail/callback/share roundtrip pending; Netlify outer login can block recipients. No automatic developer access to private trips. |

## Earlier UI/road-test feedback

| Request | Status |
| --- | --- |
| Fullscreen map, navy/purple identity, bottom expandable panel on iPhone/iPad | Implemented; responsive/gesture browser checks exist. Not claimed pixel-identical to the reference illustration. |
| Left inset city watch sheet, compact readable rows with weather, right single-column controls | Implemented; weather remains unknown/unavailable if provider has no result. |
| 3D-style original vehicle/radio artwork, vehicle text removed, no redundant 3D/U control, minus sign, red End, radio play/pause | Implemented; no proprietary Google assets. |
| Vehicle/road label positioned away from screen center and recenter behavior | Implemented with camera safe-area calculations; physical-device confirmation still needed. |
| Actual speed above verified posted sign; upcoming yellow sign only within 300 m | Implemented with source-dependent data; no invented default limit. |
| 30 recent destinations, five favorite shortcuts, Home/Work, persistent vehicle | Implemented, device storage; recovery/history checks cover reload. |
| Clubhouse station and other requested radio entries | Preserved original media, added supplied station; third-party availability/autoplay/Safari audio not guaranteed. |
| Update app in chosen language, preserve session on upgrade | Implemented; report action translations extended to six UI languages in this follow-up. Technical statuses/privacy/details are still partly English. |
| Road kilometre marker | Shows only nearby actual mapped milestone; `km —` means unavailable. Not computed from trip distance. Comprehensive highway chainage data absent. |
| Signals, junctions, speed/red-light cameras | Actual OSM/Overpass symbols with incomplete-source disclosure and retry. Complete official coverage absent. |
| Truck-permitted blue road layer | NOT delivered: no verified, vehicle-specific legal-road coverage source. Ordinary road classes are deliberately not painted as truck-legal. |
| BC→AB distance error | Boundary regression and real Vancouver→Calgary diagnostic added. Original Vancouver→Winnipeg complaint not reproduced. |
| Route line vanished after two hours | Missing-layer repair, 30-second health check, 2D graphics fallback and storage recovery implemented. No physical two-hour proof. |

## Comprehensive-update requirements outside the latest eleven

| Area | Current status and blocker |
| --- | --- |
| Backup/recovery | Git bundle restore/integrity and baseline checks; public application data snapshot. Not full managed Auth/hosting/device-media backups. Additive migrations retained. |
| Hosting | Existing Netlify preview only; production publish remains locked. Account-level login last returned 401 without auth. Cannot remove all-site protection under the owner's earlier restriction on production visibility. |
| Supabase/Auth/security | Existing project, versioned additive RLS migrations, private users/reports/shares, no privileged browser key. SQL two-identity authorization passed previously; new account/device realtime roundtrip not repeated here. |
| Shared driver reports | Four primary icon-only types, central realtime/poll recovery, direction/route/bounds filtering, timestamps/expiry/offline queue/basic flags. Credibility moderation is basic, not a full abuse-resistant trust system. |
| Weigh stations/Wasi South | Registry/provenance and aliases retained; unverified status Unknown. No official Open/Closed feed available. Driver observations remain distinct. |
| Truck routing/long distance | Valhalla dimensions, hazmat/axles, bounded segmentation and section-join validation. No paid engine, full country/restriction certification or guarantee of optimal corridor. |
| Canada/US/UK/Europe | Routing-region safeguards exist; provider/OSM coverage varies. No completed per-country verification of every restriction, toll, tunnel, axle rule or legal-road layer. |
| Highway 11/17, via Calgary, BC1→17→91 | Existing waypoint/corridor controls retained; routes must be returned by actual provider. Exact junction/legal road behavior not road-tested everywhere. |
| Weather/cities/borders/facilities | Existing route-relative city/facility/border and Open-Meteo integration retained. Provider failures/data gaps exposed. User-selected cities preserved. |
| Voice | Voice/language/test/volume and radio coexistence handling implemented; actual iOS audibility and all six languages unverified. |
| Ask Rahyar | Secure deterministic live-data lookup; not a generative LLM assistant. Paid AI and reliable browser wake word not enabled. |
| Offline | Prepared route/instructions/app caching and storage controls; NOT downloadable Basic/Detailed basemaps, satellite or offline rerouting. Licensed offline data/engine needed. |
| Official alerts/traffic | Existing optional traffic/tools preserved; comprehensive Ontario/Québec/US official feed ingestion pending access/source integration. |
| Existing media/reviews/settings | Preserved; carrier reviews/device media remain local. Full settings/status localization and automatic all-feature account sync incomplete. |
| CarPlay | Future native-iOS/entitlement path documented; no fake CarPlay button. |
| Costs | No paid service activated; existing Free resource limits apply. Infinite history, guaranteed routing SLA and SMS are not free-tier promises. |

## Follow-up verification

- New regressions verify retained long-route alternatives, every original waypoint leg, total distance/time, bounded request count, rejected disconnected alternative snaps, and no fabricated alternatives when only one exists.
- Public routing entry regression checks actual truck parameters and requests two alternatives per original leg.
- Six-language report-action switching is tested in the browser without recreating the account form.
- See the delivery message for final executed counts and actual browser outcomes. Simulated GPS/graphics tests are not physical-device road tests.

## Recovery

Return only the development preview to commit `8a1c9fe4b9b5b107a204b40c43261e34df81618d` to undo this follow-up. No database changes are part of this follow-up. Never force-push main, unlock production publishing, drop collected trip data or change production access as a rollback shortcut.

### Executed follow-up results

- `npm run verify`: **82 passed, 0 failed**; syntax/JSON checks passed. `npm run build` passed.
- Real provider diagnostic, Golden→Medicine Hat: 2 distinct truck routes returned. Calgary via-point journey: 2 distinct full truck routes retained, both original waypoint legs intact, 2 requests.
- Real provider diagnostic, Vancouver→Medicine Hat: **3 distinct continuous truck routes**, 7 requests, segmented with original endpoint leg/dimensions and Canada-only filtering preserved. This is evidence for the general algorithm, not certification of every possible road or the user's exact road trip.
- Journal browser suite passed real map alternatives/touch selection, simulated graphics recovery, proposed/actual tracks, private JSON, real PDF, cancellation persistence and no page errors.
- Lifecycle suite passed 30 recent destinations across reload, GPS timeout/background/foreground, media controls, menu upgrade, new tab/IndexedDB failure fallback, End Trip/no automatic restart and no page errors.
- Six-language menu/report action browser suite passed.
- Initial external-service-dependent browser attempts timed out because the local server did not use this environment's outbound proxy. Retests used `NODE_USE_ENV_PROXY=1 PORT=3049 npm run dev`; no routing response was mocked to turn the failure into a pass. This flag is only needed in environments requiring an outbound proxy.
- Responsive UI suite finally passed at 1180×820, 390×844 and 844×390, including sheet gestures, speed/maneuver visibility, menu interactions and active-trip reload. An earlier proxy-corrected live startup also timed out before the successful rerun; public geocoding/routing availability is intermittent and no SLA is claimed. Startup failure diagnostics were added without relaxing assertions.

## Route-label behavior correction

The selected-route km/time label is temporary: it expires 60 seconds after a new route is selected. Routine map redraws, source recovery and setting the same selected route do not restart the minute. Selecting a different route starts a new minute. The route line, current-road name and active-trip bottom summary are retained.

Alternative labels are anchored only on a visible branch at least 24 screen pixels away from the selected route, avoiding the turn/planning/trip panels. If the distinguishing branch is outside the viewport, no alternative label is put on the common road above the truck; the alternative line remains selectable. The 2D fallback uses the same label rules.

Regression tests cover expiration, redraw preservation, route reselection, common-road rejection and offscreen rejection. A real-provider/map browser test with emulated GPS and a controlled clock confirmed expiration after one minute without ending GPS or deleting route geometry. Physical Safari testing is still manual.

Label follow-up validation: `npm run verify` passed **85 tests, 0 failures**; production-style build passed. The focused real-map/provider browser test confirmed the one-minute timeout and preservation of the active GPS/route. Tests explicitly cover both MapLibre and Leaflet fallback behavior.
