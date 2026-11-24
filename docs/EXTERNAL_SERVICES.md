# External APIs and dependencies

This reference describes the supplied source, not a guarantee of current provider availability, quotas, licensing, or data completeness. All application requests go directly from the user's browser; there is no API proxy/backend. The local Node server serves files only. Pinned npm dependencies are @supabase/supabase-js 2.119.0 and Leaflet 1.9.4; dev tooling uses esbuild 0.28.2, Supabase CLI 3.2.0 and @playwright/test 1.65.1. Lockfile integrity is committed.

## Runtime libraries and assets

| Dependency | Version/source | Use and license location |
| --- | --- | --- |
| Leaflet | 1.9.4; `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` and `leaflet.css` | 2D map; BSD-2-Clause upstream, https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE; copied from the pinned npm package into generated dist/vendor/leaflet at build time, including LICENSE |
| Leaflet Rotate | 0.2.8; `dist/vendor/leaflet-rotate-0.2.8.js` | Map rotation; GPL-3.0 text in `dist/vendor/leaflet-rotate-LICENSE.txt` |
| MapLibre GL JS | 4.7.1; bundled JS/CSS in `dist/vendor/` | WebGL map; BSD-3-Clause text in `dist/vendor/maplibre-LICENSE.txt` |
| Google Fonts | DM Sans and Manrope; `fonts.googleapis.com`, with font delivery via `fonts.gstatic.com` | Remote fonts; https://fonts.google.com/specimen/DM+Sans/license and https://fonts.google.com/specimen/Manrope/license |
| Browser platform | Browser-provided | Geolocation, Fetch/AbortController, IndexedDB/localStorage, WebGL, Web Audio/speech synthesis, HTML audio, fullscreen, screen wake lock, crypto UUID, observers |
| Node.js/npm | Node 24 LTS baseline | Development only; built-in HTTP, filesystem, process and test APIs. Built-in server/test APIs plus the pinned tooling listed above |

Preserve vendor notices and map/data attribution. Leaflet Rotate's GPL license is relevant to distribution of this commercial project; the setup makes no licensing changes or legal conclusion.

## APIs and map services

| Provider / endpoints | Calling files | Purpose and data sent | Credentials / behavior |
| --- | --- | --- | --- |
| Valhalla: `https://valhalla1.openstreetmap.de/route?json=...` | `truck-routing.js` | GET route query includes endpoints, waypoints, heading when available, and truck dimensions/weight/axles/hazmat or automobile costing; `X-Client-Id` is the site hostname | No key in source. Public service; routes may fail or exceed distance limits. Truck failures do not fall back to car costing |
| Valhalla: `https://valhalla1.openstreetmap.de/trace_attributes` | `driving-hud.js` | POST route trace/shape for speed context | No key; dependent on source coverage/service availability |
| Open-Meteo: `https://api.open-meteo.com/v1/forecast` | `app.js` | GET coordinates and forecast parameters for estimated arrival-time weather | No key configured; failures leave distance/ETA available. Check current commercial-use terms before production reliance |
| ArcGIS World Geocoding: `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` | `place-search.js` | GET typed address, supported-country filter, requested address fields; `forStorage=false` | No token configured; address results fall back to Photon when necessary |
| ArcGIS World Geocoding: same base + `/reverseGeocode` | `map-pin.js` | GET selected map-pin coordinates | No token configured; Photon fallback |
| Photon: `https://photon.komoot.io/api/` and `/reverse` | `place-search.js`, `map-pin.js`, `road-context.js` | GET search text, location/bounding box/category parameters; address/city/facility lookup | No key; public service, partial results and rate limits possible |
| Overpass: `https://overpass-api.de/api/interpreter` | `app.js`, `road-context.js`, `road-map-markers.js` | POST OSM queries with route corridor or local map extents for boundaries, facilities, signals/cameras | No key; inventory is retained when enrichment fails |
| Overpass fallback: `https://overpass.private.coffee/api/interpreter` | `road-map-markers.js` | Alternate local road-marker query | Used by road-marker lookup; not a universal fallback for every Overpass request |
| OpenFreeMap: `https://tiles.openfreemap.org/styles/liberty` or `/dark` | `map-3d.js` | Map style; browser follows style references for tiles, glyphs and sprites, revealing viewed map areas | No key; OSM/OpenMapTiles attribution; 2D fallback on unavailable graphics/tiles |
| OSM raster: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | `map-3d.js` | 2D tile coordinates | No key; retain attribution and follow https://operations.osmfoundation.org/policies/tiles/ |
| Esri World Imagery: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | `map-3d.js` | Satellite tile coordinates | No token configured; existing imagery credits are displayed |
| TomTom: `https://api.tomtom.com/maps/orbis/traffic/flow/raster/tile/{z}/{x}/{y}` | `traffic.js` | Tile coordinates, API key, API version, tile size and style parameters | Optional user-provided key through traffic settings. Disabled until valid connection; local daily/monthly request budgets are not provider billing guarantees |

Provider references: https://valhalla.github.io/valhalla/ · https://open-meteo.com/en/docs · https://developers.arcgis.com/rest/geocode/ · https://photon.komoot.io/ · https://wiki.openstreetmap.org/wiki/Overpass_API · https://openfreemap.org/ · https://developer.tomtom.com/traffic-api/documentation/traffic-flow/flow-tiles

`network.js` wraps JSON fetches with HTTP error handling and timeouts. Individual callers choose timeout/fallback behavior. There is no server-side retry queue, API credential vault, or guaranteed commercial service contract included.

## Media streams

`road-media.js` includes these existing presets. The browser sends playback requests directly to the stream host, which may redirect to other CDN hosts. No stream credentials are configured. Codec/HLS support, availability and rights are provider/browser dependent; no HLS JavaScript library is bundled.

| Preset | URL |
| --- | --- |
| Iran International | `https://radio.iraninternational.app/iintl_c` |
| Radio Farda | `https://stream.radiojar.com/cp13r2cpn3quv` |
| Radio Javan TV audio | `https://rjtvhls.wns.live/hls/stream.m3u8` |
| Clubhouse stream | `https://clubhouse-mini.tail4a3417.ts.net/hls/master.m3u8` |
| CHUM 104.5 | `https://playerservices.streamtheworld.com/api/livestream-redirect/CHUMFMAAC_SC` |
| Z100 New York | `https://stream.revma.ihrhls.com/zc1469/hls.m3u8` |
| KIIS FM Los Angeles | `https://stream.revma.ihrhls.com/zc185/hls.m3u8` |

Users may add HTTPS streams or local audio files. Local files are stored in the browser's IndexedDB and played with object URLs, not uploaded to an application backend.

## Bundled datasets and outbound reference links

- `cities-na.json`, `cities-eu.json`: city catalogs; inspect embedded `source`, `license`, and related metadata for provenance.
- `regions-na.json`, `regions-eu.json`: region boundaries, country/units context; embedded source/license metadata.
- `ca-municipalities.json`, `bc-municipalities.json`: municipal boundaries; inspect file metadata and the existing provenance documentation.
- `facility-catalog.js` and `facility-catalog.json`: bundled inventory, with JSON fallback. Per-record provenance and `sources` metadata are preserved. See [FACILITY_DATA.md](../FACILITY_DATA.md) for coverage gaps, dated snapshots, public/government scale distinctions, and Petro-Pass/Alberta corrections. Generation scripts were not supplied; avoid editing one representation without checking the other.
- Road/weather resources in `index.html` link to Ontario 511, Québec 511, Alberta 511, DriveBC, FHWA, Environment Canada and NWS. These are external reference pages, not integrated live incident feeds.
- Trucker Path is an independent checking link, not a connected feed. No credentials, real-time station status feed, or reusable Trucker Path data source is included.
- Canadian truck reference dimensions link to `https://comt.ca/english/programs/trucking/MOU%20Summary%202025.pdf`; this is a reference document, not a routing API. Presets are examples requiring actual loaded vehicle verification.

## Credentials and browser storage

There is no `.env` loader. TomTom is the only external API key exposed through an existing application settings flow; it is necessarily browser-visible. The key uses sessionStorage by default or localStorage when remembering is selected (`rahyar.tomtom-key`). Do not commit a real key or assume a browser-held key is secret. Provider-side key restrictions should be evaluated separately.

LocalStorage holds truck profiles, last destination, saved places, watch cities, themes/vehicle choice, notice acceptance, speech/wake preferences, facility caches, traffic settings/usage, driver notes, carrier ratings, and station observations. Driver notes expire after two hours; station observations after twenty minutes. Media playlists/files use IndexedDB database `rahyar.media`. Clearing browser data removes local state; changing host/port creates a different origin. There is no account synchronization or central reports database.

Routes/searches and tile requests disclose the coordinates/text/map extents needed by the respective provider, along with normal browser network metadata. Existing notice text is in `site-notice-text.js`. No new telemetry or services are introduced by the development setup.

## New shared backend and local endpoints

Supabase project `pdipokhucdzttziyzoiw` (ca-central-1) provides email/password Auth, PostgREST and Postgres Changes WebSocket subscriptions. Only publishable browser credentials are used. RLS, column grants, timestamp/provenance guards and ownership policies enforce access. API requests contain account sessions and report data; never log tokens or submitted questions. Session tokens are managed by the official client in browser storage.

- `/api/config`: public URL/publishable-key configuration; refuses secret-key formats. No privileged key exists in this setup.
- `/api/health`: bounded upstream health probe and sanitized dependency status, without key/token output.
- `/api/ask`: verifies the user's access token with Supabase Auth, limits input/context size, returns deterministic loaded-data answers. No model key, inference provider or paid usage is enabled. It does not prove legality or alter destinations.

Reports are shared among signed-in accounts, with timestamps, driver provenance and pseudonymous account identifiers. Private settings upload/download is explicit. Offline caches exclude API requests, tokens and external tiles; route packages and media use separate IndexedDB databases. Existing source/data attributions remain in place.

Long-distance routing can now issue multiple bounded truck-aware section requests against the same public Valhalla endpoint. See ROUTING_AND_DATA_FINDINGS.md for real measured results, request budget and remaining limitations.
