# Review handover — not a completed production release

## Source and recovery

- Repository: https://github.com/fardad34/rahyar (private).
- Feature branch: `feature/comprehensive-staging-20261117T052834Z`.
- Main was and remains `2086b7381466f40d6ce6dc4f5728aa49cc699c83`.
- Original baseline: `baseline-original` → `b636409067dcee9c8d07c4a0d62ef2d1fbd3e1a6`.
- Additional backup: `backup/pre-comprehensive-20261117T052834Z`. This is an annotated tag, preserved by policy; administrators could delete it. A full Git bundle was restored independently and passed `git fsck` before changes.
- See [RECOVERY.md](RECOVERY.md) for exact clone/bundle/source rollback instructions. Do not force-push/reset main or destructively drop application data to roll back.
- All original files remain; geographic/facility data, vendor files, media code, icons and fixtures are preserved. Intentional application/test changes are reviewable in Git. No credentials are tracked.

## Database migrations

Existing Supabase project: `pdipokhucdzttziyzoiw`, ca-central-1, Free plan. Preflight found zero application tables/migrations/users/buckets/objects, so no pre-existing application records required an export. No managed auth/storage schema definition was replaced. Temporary test accounts were used only to verify real authentication/report delivery.

Applied versions (local filenames match server history):

1. `20261117053202_rahyar_shared_driver_reports.sql`: profiles, private saved records, shared reports, flags, RLS/column grants, report timestamp/source/idempotency/rate-limit guard and Realtime publication.
2. `20261117053320_rahyar_verified_station_registry.sql`: all 212 original government stations, read-only registry and report proximity/heading validation.
3. `20261117055727_guard_anonymous_and_storage_limits.sql`: anonymous-account write guard and per-owner saved-record limit with server timestamps.
4. `20261117062213_valid_global_gps_bounds.sql`: valid coordinate bounds including Hawaii and Alaska's dateline islands.

`supabase/verify.sql` passed its RLS/privilege/publication/registry assertions. Migration application succeeded against the existing hosted project; a separate local-stack replay was attempted, but container initialization did not complete before any containers were created and was stopped. It is not counted as a passing replay. Local CLI config is included for rerunning on a working stack. No paid database branch/project was created. Future production migrations need a fresh encrypted data backup and recovery test because the database may then contain actual users.

Reports are visible only while fresh and moderation-visible; expired rows are retained pending a reviewed retention job/admin cleanup. Flags are owner-scoped; an administrator reviews them and can set `moderation='hidden'` or `'review'` through secure dashboard/database access. No client can moderate itself or forge official provenance. This is basic moderation, not a full abuse/trust platform.

## What is verified

- **45 unit/regression results pass**, including every original test file. Existing fork-wording/night-brightness expectations were updated to the requested behavior; no fixture/test file was removed.
- All JavaScript syntax and JSON/manifest parsing pass.
- Real Supabase checks: cross-account persistence/read, single observation Unknown, two matching drivers Open, conflicting latest evidence Unknown, retry deduplication, stale/far/forged submissions rejected, private settings isolation/impersonation denial and signed-out report denial.
- Two isolated Chromium contexts: real account sign-in; session B receives session A's police report over a real Supabase WebSocket; exactly four categories; offline queue persists then delivers to B on reconnection; health endpoint; authenticated data assistant with confirmed map action and no LLM claim.
- Chromium planning checks: vehicle cards/first truck settings, six themes/language choices, bounded history, no horizontal overflow at 390/768/1024/1440 px, app reload offline, persistent route/profile/instructions and non-live preview.
- Public live truck routing: Toronto–Winnipeg 2,174.299 km / 4 routed sections, Toronto–Vancouver 4,829.611 km / 14 sections. Canada-only checks passed. All sections use the loaded truck dimensions; internal waypoint/step accounting is tested.
- Current retest: two isolated signed-in Chromium sessions used projected Wasi South identity; real Supabase WebSockets delivered one-driver Unknown, two-driver Open, conflict Unknown and two-driver Closed, with timestamps/source and opposite-heading exclusion. Synthetic reports were hidden afterward; visible synthetic count is zero. Physical iOS remains untested.
- Runtime npm audit: no reported vulnerabilities at the recorded check.

Tests use emulated GPS, original recorded route fixtures, synthetic test identities and Chromium. They do **not** prove physical iPad/iPhone Safari behavior, speech audibility, real-world road legality, every corridor alternative, full email-delivery signup, or live government operating status. Public routing is not an official legality guarantee or global route optimum.

## Vercel staging status and blockers

Existing project `rahyar` / `prj_VWcZXiqXvf9CJLRqCsgr73fRqAlV` / team `team_PuUJOIzmcLUiNoqlGAdgDzLR` is configured for Node 24, framework Other, repository root, `npm ci`, `npm run build`, output `dist` and yul1 APIs. Existing Vercel Authentication protection remains enabled. Development/preview variables are scoped appropriately; no production variables were provisioned. No deployment or custom-domain assignment has occurred.

**Staging URL: unavailable — deployment not performed.** See [STAGING_ACCESS.md](STAGING_ACCESS.md) for exact investigation evidence, current Free hosting alternatives and iPad owner steps. Optional Netlify adapters reuse all three existing API handlers and block main/production builds; local adapter/build checks pass, but deployed bundling/protection has not been verified.

Two prerequisites remain:

1. Vercel reports no connected GitHub namespaces. Connect the intended GitHub account and authorize `fardad34/rahyar` for the existing Vercel project; do not create a duplicate project.
2. The team is Hobby. Vercel's [terms](https://vercel.com/legal/terms) state: “You shall only use the Services under a Hobby plan for your personal or non-commercial use.” Rahyar is described as commercial. Resolve eligibility/free arrangement before deployment; no subscription upgrade or paid feature has been activated.

`vercel.json` disables automatic Git deployments, including main. After access/eligibility are resolved, create a **preview** from the reviewed feature SHA in the existing project, verify protection is still on, run health/auth/two-user/device checks against that URL and record deployment ID/SHA. Do not use `--prod`, promotion, production aliases, custom domains or public production replacement. The previous chatgpt.site application is untouched.

## Remaining work and limits

- Wasi South/North are confirmed existing Ontario 511 records; spelling lookup and dashboard key mismatch are fixed. Official inventory has no operational status. Physical route relevance and official live status remain unverified.
- Long-distance segmentation is working in the tested corridors, but global optimization, all alternatives, North Bay live maneuvers and road/device navigation need more verification.
- AI inference is not connected. Ask Rahyar is explicitly deterministic data lookup; physical speech recognition, hands-free wake word and verified zero-cost LLM entitlement remain pending. No paid AI activation.
- Offline maps are route/app data only: no detailed basemap tiles, satellite imagery or offline rerouting. Wi-Fi detection/storage persistence cannot be guaranteed in Safari; eviction remains possible.
- No verified blue truck-road layer or new official live incident feed is claimed; suitable data/credentials/licensing are missing.
- Interface translation covers core controls/notices, not every detailed message. All six voice engines and radio/speech coexistence need physical iOS testing.
- Cloud saved-record infrastructure supports vehicle/favorite/history/trip/preferences/feedback/bug/carrier-review/AI-usage kinds, but UI synchronization currently covers an explicit private settings bundle, not complete trip/media/account workflows. Dedicated feedback/moderation tools and automatic retention remain pending.
- Supabase warns that leaked-password protection is disabled: [remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No paid protection/plan was enabled. Email confirmation/delivery and authorized redirect URLs need staging verification.
- Existing public data/stop inventories are partial and dated; no completeness/live status is inferred.

## Costs and access control

Selected configuration is **$0 in newly activated subscriptions/services**: existing Supabase Free, existing Vercel Hobby (not deployed), public routing/weather/geocoding, optional existing user-supplied TomTom key, local browser storage and zero LLM usage. Free quotas can pause/rate-limit services; this is not an uptime guarantee. Vercel commercial eligibility is unresolved. Netlify credit-based Free advertises a $0 hard-limit plan permitting commercial projects, with owner-only Private previews; owner authorization and actual deployment remain pending. This is a staging alternative, not a production cost promise. No payment details, upgrade, paid branching, premium password protection, paid model, domain or extra project was activated.

Only publishable Supabase credentials reach the browser. Privileged keys are absent. Owner RLS protects private settings/profiles; shared reports are intentionally readable by signed-in accounts, with UI/server query geographic filters rather than per-driver geofenced authorization. User IDs act as pseudonymous report source identifiers; emails/profile data are not shared with reports. Client writes cannot set source/expiry/moderation. Sessions are handled by the official SDK and checked server-side for assistant access. Offline caches exclude APIs/tokens/external tiles. Logs use sanitized error categories and do not record submitted questions or tokens.

## Manual device and production approval checklist

Before approving a production release, test on physical iPad Safari, iPhone Safari and desktop: signup/email confirmation/login/logout/session expiry; two independent drivers reporting the same/opposite directions; stale/conflicting/flagged stations; GPS loss/reconnect; queue replay; route alternatives and long-trip segment transitions; old route visibility on failure; saved-route reload/revalidation; all available device voices/Test Voice/volume/radio interaction; mic permission denial; background/foreground behavior; mobile controls/RTL/high contrast; offline reload/cache deletion/eviction; and API/provider failures. Confirm public data licenses and production backups/isolation/retention.

Production requires an explicit instruction naming the reviewed commit and target project, with resolved host eligibility, production-scoped credentials and passing release/device checks. A staging review or source push is not production approval.

## Test-data cleanup status

Temporary local test-credential files were removed after verification. Supabase's confirmation for deleting the two synthetic test accounts expired, so account deletion was not completed. Their shared reports were instead reversibly set to `moderation='hidden'`; a database query verified **zero visible test reports**. They cannot supply live station-status evidence. Renew the scoped Supabase confirmation to revoke/remove those synthetic accounts and associated records; do not delete real users or unrelated reports.
