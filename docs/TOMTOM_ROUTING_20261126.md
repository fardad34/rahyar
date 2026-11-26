# TomTom routing preview — 26 November 2026

## Scope

Existing navigation UI, Valhalla/custom endpoint, truck profiles, map/rendering, journal, speech and database remain. Only the development preview gains a TomTom routing adapter. No production build/merge/unlock, Supabase change, paid subscription or cloud project is authorized or performed.

TomTom is selected by default when the existing device Traffic setup key exists and no explicit provider/custom endpoint is selected. Explicit provider selection persists. Without a key the existing Valhalla provider stays available; selecting TomTom explicitly without a key gives a clear error. There is no silent fallback when TomTom rejects/times out.

## Credentials and free-tier limits

No TomTom credential exists in configured server environment variables at implementation time. The existing device-only key `rahyar.tomtom-key` is reused, never committed or exposed by config APIs. The browser passes it in a same-origin request header, not its request URL; the fixed server adapter uses TomTom's documented key query parameter upstream. No request URL, credential or GPS logging is added. Existing localStorage has no special protection against same-origin XSS; do not treat it as a secret vault.

Each device blocks after 1,000 routing attempts per UTC month. Attempts count before the network, including failed ones. Storage failure stops the request. This is a conservative local safety guard, **not a cross-device/account billing cap**: storage resets, concurrent tabs and other apps/devices can bypass a local counter. Six browsers staying within this cap would issue at most 6,000 attempts, but other key/account usage is unknown. Keep the TomTom account on its no-payment free plan; never promise this local counter alone prevents account charges. No billing/upgrade API is called.

Official pricing page checked 26 November 2026 advertises 20,000 monthly Routing requests, no card for start-building: https://docs.tomtom.com/pricing . Actual account entitlements and commercial/navigation licensing remain to be confirmed in the owner's TomTom account. Paid overage price was not independently verified.

## Adapter behavior and limitations

- Fixed `https://api.tomtom.com/routing/1/calculateRoute/…/json` POST, bounded validated input, no arbitrary URL or server-owned key exposed to public callers.
- `travelMode=truck` uses unchanged height/width/length in metres, gross/axle weights converted from tonnes to kg, axle count and commercial flag. Car uses `travelMode=car`. The adapter never lowers truck dimensions.
- Up to two alternatives requested, so at most three total native provider routes. TomTom may return fewer; no invented alternative geometry. Avoidance points become small explicit avoid rectangles; existing Canada-only result checks and segmentation stay active. Native TomTom alternatives skip Valhalla-oriented extra diversification probes to reduce request use.
- The existing generic hazmat boolean does not specify TomTom's region-specific cargo classes. Hazmat=true is blocked with an explanation; do not guess a legal cargo classification. Explicit Valhalla selection is retained.
- Native provider summary, legs, road numbers, exits and maneuvers are normalized for the existing UI. Each step retains intervening native geometry, including guidance points on segments; unsafe/incomplete alignment or absent guidance is rejected. No straight-line substitute.
- Provider failure responses are sanitized and displayed; keys never appear in errors. Unknown future maneuver codes may need further mapping. Real low-bridge, lane, seasonal restrictions and region coverage are not certified by this integration.
- TomTom routing attribution is shown on both map renderers when a TomTom route is activated; existing basemap attribution remains.

Official API and guidance documentation:
https://docs.tomtom.com/routing-api/documentation/tomtom-maps/v1/calculate-route
https://docs.tomtom.com/routing-api/documentation/tomtom-maps/v1/guidance-instructions

## Validation

151 automated tests passed, including weight conversion/profile preservation, exclusions, native step/leg geometry and waypoint offsets, exit/ramp/U-turn mapping, missing keys, hazmat refusal, sanitized provider denial without fallback, monthly guard and explicit provider choice. Syntax/build passed.

Chromium contract test: settings choice persists, absent key explains setup, key goes in header, mocked 403 is visible with one request/no fallback. This is deliberately a mocked denial contract, **not a successful real TomTom route**.

Live TomTom routes in Canada/USA/UK/Europe, long trips, alternative quality and commercial account entitlement **cannot be verified without the owner's Routing-enabled key**. Physical iPad/iPhone/vehicle GPS and microphone remain untested. No fake backend response ships in production code.

A broader real-provider UI regression run initially failed because the development Node server was started without its required environment proxy; it was restarted with NODE_USE_ENV_PROXY=1. The rerun passed real Valhalla routing/maps, bottom-sheet gestures, maneuver/speed visibility at 1180×820, 390×844 and 844×390, saved trip/profile reload with GPS intent, and no page errors. These are existing-provider regressions, not live TomTom verification.

## Owner setup

Open https://my.tomtom.com/ and use the existing project/API key with Routing API access. Do not add billing/payment information or start a paid trial. Save the key inside Rahyar Traffic setup (never in a chat or Git). In Settings → Routing provider choose TomTom. A traffic-enabled key alone may still be refused for routing or due to domain restrictions; report the sanitized error, not the key.

## Rollback

Source before this change: ced108a496a64a6be7e44ec0ed1e1ae92ab2809c. Full-history private bundle: `/workspace/work/backups/before-tomtom-routing-20261126.bundle`. Explicitly select Valhalla in settings to stop TomTom requests without losing the active trip or clearing destinations. Code rollback is a reviewed feature-branch revert/redeployment only, never unlock production.
