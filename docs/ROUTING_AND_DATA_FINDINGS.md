# Routing and road-data verification

## Public routing provider

The application uses `https://valhalla1.openstreetmap.de/route`, with real `truck` costing and the user's dimensions/weight/axles/hazmat, or `auto` costing for passenger vehicles. On this update's live check, Toronto (43.6532,-79.3832) to Winnipeg (49.895,-97.138) with a 4.15 m / 2.6 m / 23 m / 39.5 t / 9 t axle / 5 axle profile returned HTTP 400:

```json
{"code":"DistanceExceeded","message":"Path distance exceeds the max distance limit."}
```

The limitation is enforced by the provider, not merely a display error. This branch adds a bounded segmentation path. Split candidates come from the existing city catalog, not hardcoded individual routes. Every section and any snapped join is routed with the actual vehicle profile; disconnected joins fail explicitly. The original requested waypoint legs are retained, internal arrival/departure instructions become non-announced notifications without losing their distance/duration, and total geometry/distance/ETA remain continuous. No car overview is substituted for a truck route. Existing geometry stays visible during ordinary recalculation.

Live Canada-only checks with the loaded truck profile returned:

| Journey | Distance | Duration from provider | Routed sections | Requests including initial rejected long request |
| --- | --- | --- | --- | --- |
| Toronto–Winnipeg | 2,174.299 km | 98,112.683 s | 4 | 8 |
| Toronto–Vancouver | 4,829.611 km | 209,283.293 s | 14 | 28 |

This is a connected provider-routed corridor, not proof of truck legality or a globally optimal route. Source restrictions may be incomplete; fixed city split points can create a detour. Segmented responses currently expose one composite route. The 48-section-request budget and depth bound produce clear failure states rather than unbounded public-provider traffic. Per-section alternatives/global optimization and every highway preference still require additional live/device checks. HTTP rate limits or failures remain visible and do not erase the previous route.
Existing Highway 11/17, Calgary-via and BC 1→17→91 options remain present. Fork guidance now retains the provider's left/right modifier even when the road reference is unchanged. This addresses a generic omitted-direction problem; it does not establish the correctness of the North Bay junction's live geometry. That junction still requires a real provider result and device navigation test.

## Wasi South (also searched as Wassi)

Correction to the earlier inspection: **both stations already exist in the original dataset**. The initial absence finding searched only “Wassi” and was wrong. Ontario 511's public inventory was checked on 2026-11-17:

| Official record | ID | Highway/direction | Longitude, latitude | Location |
| --- | --- | --- | --- | --- |
| Wasi South Truck Inspection Station | 20 | 11 / Southbound | -79.359774, 46.171362 | 1.0 km south of Rivers Rd West |
| Wasi North Truck Inspection Station | 21 | 11 / Northbound | -79.35838799, 46.162617 | 1.7 km north of 8th Concession Rd |

Sources: [Ontario 511 inventory](https://511on.ca/list/inspectionstations), [South tooltip](https://511on.ca/tooltip/InspectionStations/20?lang=en&noCss=true), [North tooltip](https://511on.ca/tooltip/InspectionStations/21?lang=en&noCss=true), and public map layer `https://511on.ca/map/mapIcons/InspectionStations`. Coordinates agree with the existing dataset; no station row or migration was added. The documented [inspection API](https://511on.ca/help/endpoint/inspectionstations) requires a developer key and is limited to 10 calls/60 seconds. Its published fields describe inventory, **not Open/Closed operation**. Inventory “last updated” is not a status timestamp.

Two defects are fixed: local facility search accepts Wasi/Wassi and returns the existing station; dashboard facility projection adds OSM aliases that previously changed its serialized identity relative to the raw database registry. Canonical keys now ignore derived aliases when provider IDs exist, keeping all 212 original registry keys unchanged. A regression checks every registered station. A real two-browser test uses the projected Wasi South record and verifies cross-user Open/Closed/Unknown transitions and opposite-heading exclusion.

Actual Highway 11 route-offset selection still needs road/device testing; synthetic GPS is not proof of access from the roadway. Live official operating status remains unavailable. Use Unknown unless fresh matched driver observations support an explicitly non-official driver status. Never substitute Windsor South or assume a government inventory entry means Open.

## Station observation semantics

- All 212 original government inventory records are registered centrally; commercial/private scales are not registered.
- Submitted observation coordinates must be within 1.5 km of the registered station, GPS accuracy at most 100 m, travel direction present, and capture time within 20 minutes. Server time and source are enforced.
- Two distinct accounts agreeing within a 60° heading tolerance and 20 minutes produce **Drivers report Open/Closed · Not official**. A single observation, conflict, expiry or missing matching direction produces **Unknown**, with the latest unverified observation shown separately.
- This is driver corroboration, not government verification. Two accounts can collude; basic rate limits and moderation are not a complete anti-abuse system.
- Future official road alerts/blue truck-permitted roads require licensed verified sources and vehicle-aware restrictions. Ordinary road classification is not enough. No blue legality layer has been fabricated.
