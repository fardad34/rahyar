# Nearby corridor discovery and Winnipeg north bypass — 22 November 2026

Development preview/PR #2 only. No production/main publish, hosting visibility change, Supabase write/migration or paid service was introduced. Pre-change full-history backup: private `before-local-corridors.bundle`; rollback preview reference: `0ddac6f5559a2bebb3f2831ef61194beaee4d142`.

## Diagnosed causes

1. Whole-trip alternatives could differ hundreds of kilometres later while all using the same urban bypass near the driver.
2. The real provider represented ~684 km of Trans-Canada Highway as one maneuver. A maneuver-boundary-only local search therefore found no safe nearby split.
3. A broad road search could correlate an intermediate point to the opposite carriageway and create a long return loop.
4. Full-trip label sampling could skip a short visible city branch. Retained navigation camera padding could also put that branch beneath the trip sheet in overview mode.

## Current implementation

- Main route loads independently; nearby option discovery runs in the background. It never activates a route or changes the driver's destination. A selection still requires the normal map interaction/confirmation.
- The upcoming window is about 110 km, bounded at 180 km, independent of city names or countries. Fresh on-route GPS, trip/revision checks, a five-minute/30-km automatic gate and manual retry limit protect against stale proposals and repeated calls. The gate survives same-tab reloads and clears when the trip ends.
- Existing vector-map road features can seed side candidates. When coverage is insufficient, bounded generic side searches use the **same Valhalla vehicle router** with documented road correlation filters. Virtual search points are not displayed as roads or facilities.
- Correlation filters preserve actual truck dimensions/axles/hazmat, constrain search radius/cutoff, exclude restricted candidate edges and avoid ramp anchors. A second routing pass refines a candidate to a forward-facing point on its actual provider-routed shape, avoiding opposite-carriageway return loops. No city/bypass coordinates are hardcoded in application logic.
- At most five optional routing requests are used per window (native prefix, two side searches, up to two refinements), separate from the existing bounded main-route calculation. Calls use the `local-corridor` purpose header for verification. Optional failures keep existing routes available; no fake backend route is substituted.
- Every proposed prefix is provider-routed with the selected vehicle. The existing suffix is retained only at connected native shape vertices with compatible approach direction. Unpassed user waypoints are not skipped. Intermediate internal arrivals are not treated as trip destinations.
- If splitting within a very long maneuver, an identical fresh native prefix calibrates the retained suffix cost where available. Otherwise remaining distance/time follows the existing maneuver travel profile and the label uses **≈** and a source tooltip; this is an ETA estimate rather than a claim of a fresh end-to-end provider response. Future closures/restriction changes still require normal rerouting.
- Nearby proposals are prioritized over alternatives that differ only far away, saved with trip state and remembered only when selected. Learned anchors focus on the local choice. A local proposal the driver has already left is refreshed instead of activating stale guidance.
- **Show route alternatives on map** now fits nearby geometry, clears retained follow-camera padding and respects the expanded trip sheet. Labels sample visible geometry and avoid the sheet/turn/road-name controls. Current-route label expiry remains unchanged.

## Representative evidence and scope

The reference trip is an emulated on-road location west of Winnipeg, near the reported area, to Nipigon. It is **not** the user's still-unprovided complete `522 Highway 11…` address or confirmed physical vehicle configuration.

Reference truck: 4.15 m height, 2.6 m width, 23 m length, 39.5 t gross, 9 t axle load, five axles, no hazmat.

- Existing south route: about **844.8 km / 549.3 minutes**.
- Provider-routed PTH 101 North option with the retained suffix profile: about **847.8 km / 547.3 minutes**.
- Native instructions include **PTH 101 North**. The northern option follows the northern bypass without the earlier search-point return loop.
- Initial long-route-only attempts failed to expose this option; those failures were not counted as passes. The corrected test verifies route/GPS preservation during discovery. The final delivery reports selection/reload and regression outcomes actually executed.

The mechanism is generic for supported Canada/US/UK/European road networks, but this test does not certify every urban corridor, truck restriction or country. No three-option guarantee, universal north/center/south coverage, traffic forecast or legal-access certification is claimed. Physical Safari/road testing and exact-address reproduction remain outstanding.

## Reproduction

```sh
NODE_USE_ENV_PROXY=1 PORT=3054 npm run dev
BASE_URL=http://127.0.0.1:3054 node tests/integration/upcoming-corridors.browser.cjs
npm run verify
```

The proxy flag is needed only in environments requiring outbound proxying. The opt-in browser test uses real provider responses and emulated GPS. For a targeted layout replay, `ROUTE_SNAPSHOT` can point to a saved real reference-route response; new local routing requests remain real. No backend response is mocked or written to Supabase.

## Executed verification

109 automated tests passed, zero failed; syntax and production-style build passed. Real-provider startup/discovery and map-label selection/reload passed. The final calibrated replay retained real local routing requests and passed with `baselineCalibrated=true`. Responsive browser checks at 1180×820, 390×844 and 844×390, plus lifecycle/history/media/upgrade regressions passed. These are browser emulations, not physical iPad GPS tests.
