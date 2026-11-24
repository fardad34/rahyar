# Meaningful alternatives and learned driver preference — 22 November 2026

This follow-up addresses the Vancouver→Winnipeg/Calgary clarification in the existing development branch/PR #2. No main merge, production publish, hosting-access change, database migration or paid provider is included.

## Implemented

- Preserve alternatives for provider-routed city-bypass bridges when those bridges are merged into a continuous long route. Previously those local alternatives could disappear during artificial split-stop cleanup.
- Prefer distinct corridor geometry over simply taking the two fastest minor variants when assembling long-route alternatives. Every displayed shape and every replacement section still comes from the vehicle router. Original user waypoint legs, distance, duration and maneuvers remain accounted for.
- If a two-endpoint request returns too few choices, bounded generic discovery asks the **same router** for routes avoiding a small set of central edges in the existing corridor. Soft motorway preference may change; vehicle dimensions, axle/hazmat and user exclusions remain intact. These exclusions are search constraints, not fabricated road-closure reports or new public observations.
- Optional discovery makes at most two extra requests per direct lookup; segmented trips share the existing 48-request budget and reserve at most four extra lookups overall. Optional requests time out at 10 seconds. Rate-limit/lookup failure retains existing genuine routes. No Calgary coordinates or road numbers are hardcoded in application routing logic.
- An explicit route selection records distinguishing corridor anchors immediately, without waiting for completed-trip GPS history. Nearby shared-road anchor insertions are not represented as different routes. Up to four anchors cover separate distinguishing spans of the selected route.
- On the next similar trip, the stored choice is recalculated against current vehicle dimensions, exclusions and provider restrictions. If successful it becomes option 1, marked **Preferred** on the map, while other genuine alternatives remain selectable. Revalidation failure falls back to ordinary available routes, not stale saved geometry.
- Remembering a choice does not change destination or manufacture extra stops. Internal preferred anchors are requested as through points where supported; intermediate internal arrival/departure announcements are suppressed. Explicit new user waypoints take precedence over automatic preference.
- Preferences match direction, nearby origin/destination and the exact vehicle profile. They are private to the current device/account scope, with a maximum of 100 preference records. Settings → **Forget route preferences** removes them without deleting trip reports or destinations. This is not automatic cross-device preference synchronization.

## What is not claimed

- Three is a maximum display count, not a promise that every origin/destination has three supported routes.
- Three different shapes across a long trip do not prove three different ways through every city.
- Live Calgary diagnostics returned three genuine routes, but they did **not** verify the precise set of full northern ring, city center and southern ring/22X crossings. Some returned variants still share the central-city crossing. This specific urban-corridor coverage remains incomplete and must not be marked finished.
- The public provider's data/restrictions are incomplete; no route is labeled certified truck-legal. Revalidation uses actual costing/restrictions, not a car-route appearance change.
- A previously driven/selected path is not a permanent road-legality certificate. New closures and changed profiles may prevent reuse.

## Verification

- Unit checks cover immediate corridor learning, directional endpoint/profile matching, corrupt-record rejection, non-destination through anchors, same-road deduplication, retained merged city-bridge alternatives, preserved truck dimensions/exclusions, optional-failure recovery and bounded discovery.
- Real-provider browser test verifies a selected route survives reload/cancellation, is recalculated first on the next similar trip, sends truck dimensions/through anchors and retains selectable other routes. GPS is emulated and no application database records are written.
- Real Vancouver→Winnipeg and Calgary crossing diagnostics use provider shapes rather than mocked backend data. Final executed counts/results are reported in the delivery message. No physical road test or complete Calgary north/south/22X verification is claimed.

## Recovery

Pre-change complete-history Git bundle: private backup directory `before-corridor-memory.bundle`. Roll back only the preview to `0c933e22af74a3e5ad9972035b18cb60477d87ac`; leave trip reports and existing Supabase data untouched. Device preferences can be removed separately with the settings action. Never force-push main or unlock production to recover.

### Executed results

- `npm run verify`: **96 passed, 0 failed**, including all existing tests; syntax and build passed.
- Vancouver→Winnipeg real-provider diagnostic: **3 distinct complete truck routes**, **16 requests**, original endpoint leg/current dimensions and Canada-only geometry checks passed.
- Calgary crossing diagnostic: **3 genuine routes**, **2 requests** in the final local test. Road references included 16 Avenue NW and Stoney Trail NE. Two options still crossed the central meridian at approximately the same latitude; this is why full north/center/south–22X coverage is explicitly not claimed.
- Memory browser test passed immediate route-choice learning, cancellation/reload, fresh vehicle-specific default revalidation and continued alternate selection. One earlier live attempt timed out; a rerun passed. External-provider availability remains a limitation.
- Responsive navigation suite passed 1180×820, 390×844, 844×390, sheet controls and active-trip reload with no browser page errors. No physical Safari/road test is claimed.

Corridor anchors preserve a route preference, not an immutable turn-by-turn polyline. Current restrictions, point snapping and provider changes can alter the recalculated path; unavailable prior corridors are not forced.
