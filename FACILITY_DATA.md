# Facility inventory

The app loads the same inventory as an ordered JavaScript asset before the application, with JSON as a fallback. Network enrichment failure must preserve the inventory and must not label a successful empty inventory query as an unavailable source.

Photon category filters use one OR list of dotted categories, for example `include=osm.highway.services,osm.highway.rest_area`. Repeating `include` intersects categories; colon-separated OSM tags are not category names.

Snapshot retrieved November 8, 2026: 3,201 locations. Sources: FHWA/BTS US inventory (2019), Pilot Company public directory, Ontario 511 public inspection and rest-area layers, BC CVSE station map, Esso Commercial Cardlocks directory dated October 30, 2026, BVD public site directory, and Petro-Pass names/coordinates in OpenStreetMap via Photon. All sources retain per-record provenance. Snapshot counts do not imply complete geographic coverage or current opening status. Canadian government station data is strongest in Ontario and BC; other provinces remain incomplete.

Commercial diesel is an independent capability. A cardlock without documented truck parking is not labelled as a truck stop. BVD CAT Scale amenities are public commercial scales, not government inspections. Fuel-card acceptance is not inferred.

Validation: full scan on an actual OSRM Winnipeg–Kenora route retained Prawda Travel Centre, two rest areas and Rush Bay Truck Inspection Station with online enrichment deliberately unavailable. Rechecked GPS freshness, warning threshold/deduplication, miles conversion and route-border calculation.

November 8 correction: government weigh/inspection rows require explicit government provenance. CAT/BVD and public self-weigh scales have a separate opt-in category and never populate the government alert. Map pins respect these filters. Route enrichment now searches Petro-Pass by name in each corridor section as well as generic categories; numbered address results preserve the user-entered address and postal code. The 93 bundled OSM Petro-Pass records remain partial. The official Petro-Canada locator returned a location-search error during verification, so no complete official directory update is claimed.

November 8 follow-up: removed all 24 commercial/public scale records and their UI category. Added 41 Alberta Sheriff Highway Patrol VIS/MIS locations using published government coordinates; offices excluded. Petro-Pass inventory now has 99 named or address-verified cardlocks. Missing Highway 1 entries at Moose Jaw, Chaplin, Swift Current and Medicine Hat Box Springs are verified against Petro-Canada / Mazenc operator addresses, with OSM coordinates or the operator’s explicit map point. These pass an actual OSRM Regina–Medicine Hat–Calgary route regression. Brand checkboxes filter the list, map pins, nearest fuel/stop summaries.

Trucker Path: public weigh-station search and Fleet API documentation were reviewed. Public Regina/SK search returned zero results. No reusable Trucker Path data feed or credentials are available in this project. The UI links to Trucker Path for independent checking and explicitly says it is not connected; government inventory is not attributed to Trucker Path. No live status is inferred.

3D: MapLibre GL JS 4.7.1, 60-degree perspective, heading-up camera, route overlay and OSM building extrusion where available, with 2D toggle and fallback. Cloud-browser WebGL was disabled, so browser QA verified the 2D fallback and filters; 3D camera/route/browse behavior was verified with a map adapter test. Actual GPU rendering needs confirmation on a WebGL-capable user device.
