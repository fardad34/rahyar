# Stage 3 — reliability, data and security (24 November 2026)

Based on Stage 2. Production/main and Supabase data are untouched. This release retains the existing static/shared-global frontend and the existing small build/reporting client.

## Routing and actual verification

Automatic vehicle-aware segmentation/stitching already existed. Fixes reserve request budget for real snapped-road connectors and avoid repeating failed identical section requests. Progress messages remain, intermediate internal stops are not trip destinations, original user waypoints remain, and no straight unverified connector or car geometry substitutes for a truck section.

Real Sydney **Nova Scotia, Canada** → Vancouver test: truck height **3.8 m**, width 2.6 m, length 23 m, gross 39.5 t, axle load 9 t, five axles, no hazmat. **6,484,506.989 m**, 283,546.957 seconds, 52,789 native shape points, seven joined pieces after cleanup, one original leg, **35 requests**, Canada-only geometry check passed. This is provider output, not physical-road/legality/ETA certification or driving-hours scheduling.

The initial **4.15 m height** case failed: request budget was exhausted before optimization; after optimization the provider returned NoRoute. Independent short Sydney probes also returned NoRoute for that profile; changing only height to 3.8 m succeeded, whereas lowering only width/length/weight/axle-load did not. This confirms a provider/profile sensitivity, **not the exact location, truth or legal status of a low bridge**. Actual vehicle dimensions are never lowered automatically. The test supports a `TEST_TRUCK_HEIGHT` parameter so results cannot silently imply all heights pass. The failure is retained in the report rather than counted as success.

Settings → Routing provider supports an explicitly saved HTTPS Valhalla endpoint (loopback HTTP only for local development). Custom requests carry actual dimensions directly to that server and require CORS. No URL/key is passed to the backend gateway; no SSRF proxy was introduced. No credentials/query keys/fragments are accepted. An unavailable custom endpoint never silently falls back to public Valhalla. Current geometry remains visible until a valid replacement is ready. Public-server rate/distance/availability/data limits are documented.

The prairie-specific Canada-only waypoint fallback was **not generalized** without broader road tests. Generic segmented Canada-only routing was exercised from NS to BC at the stated profile; that is not exhaustive country/corridor coverage.

## Dependencies and data

- Leaflet was already self-hosted at 1.9.4; retain its BSD license/assets. No runtime unpkg dependency remains.
- DM Sans and Manrope now use ten local font files; original URLs and SIL OFL licenses accompany them under vendor/fonts. No runtime Google Fonts connection. Optional font/audio shell precaching preserves offline resources.
- Canonical facility data is now only in JSON; the former duplicated ~1,015,118-byte JS payload is a ~784-byte demand loader. All **3,227 existing facilities** and source metadata remain; no facility was invented/added/deleted. Search, route facilities and nearby shared-station reports await the same retryable demand load.
- Before/after startup measurement (no GPS grant, no active route) covers only city/region/facility resource files, **not all app/map/font traffic**: **13,838,609 → 5,177 bytes**. Reports are committed alongside this document.
- With fresh Toronto GPS and no active route: **11,499,159 bytes** in those datasets, including 8,575,476-byte NA boundaries and 2,918,506-byte NA city catalog. Accurate region/nearby-city features still require this data. Europe is not also downloaded. Boundaries and cities load per continent; worldwide address search can still load both city catalogs. No precision reduction was applied.
- Municipal datasets were already route-demand-loaded; retain that behavior. Full original JSON datasets remain. Further spatial partitioning is future work, not claimed complete.
- Build offline manifest now excludes Netlify control files `_headers`/`_redirects`, which would not be usable app resources on Netlify. The existing PREPARE/delete workflow remains tested.

## Truthful road-data capabilities

| Capability | Actual status |
| --- | --- |
| Truck dimensions/weight/axles/hazmat | Sent to the actual vehicle router; not proof of complete legal restriction coverage. |
| Low-bridge clearance | No independent verified clearance inventory/layer or reliable bridge-specific warning in road-context/route-guidance/media. A provider profile rejection is not a verified bridge fact. |
| Speed limits | Existing mapped/provider segment values, GPS actual speed and available upcoming-change warnings. Missing limits remain Unknown; no invented country-default value. Accuracy/freshness is not official certification. |
| Lane guidance | No completed lane-level guidance UI/data pipeline in the inspected files. Turn/exit instructions do not imply lane guidance. |
| Seasonal weight restrictions | No complete sourced seasonal-restriction ingestion/alerts. Ordinary gross/axle costing is not a seasonal advisory service. |
| Facilities and station status | Existing source inventory retained. Central driver reports remain observational; unverifiable status remains Unknown. No new coverage claims. |
| Radio/media | Existing media player retained; not a road-legality data source. |

## Security review

Reviewed every non-vendor innerHTML/insertAdjacentHTML use and adjacent Leaflet/MapLibre popup/tooltip sinks: search/Overpass/saved/imported labels generally use textContent, input.value or DOM popup nodes. Static SVG/templates and whitelisted weather/report/vehicle icons are not supplied with outside HTML. One real unsafe sink was found: saved map-name strings passed to Leaflet bindTooltip. It now receives an inert text DOM node, covered with an HTML-event-handler payload test. No claim of an independent penetration test.

Known map-link parsing now rejects look-alike Google hostnames rather than trusting a broad suffix pattern. No arbitrary pasted URL is fetched.

TomTom key behavior is preserved: password input; sessionStorage by default, localStorage only with the user's Remember option; not synced into cloud preferences, commits or server logs. Browser storage is not encrypted and first-party script/XSS could read it, so provider-side origin/API restrictions remain advisable. No key value was printed or copied. Traffic city data is no longer eagerly loaded when no traffic key is configured. Live traffic/API requests remain outside service-worker caches. No paid service/billing activation.

Existing leaflet-rotate remains **GPL-3.0**. Public distribution may create license obligations. The owner decides whether to retain it or authorize a separate replacement review; this report is not legal advice. No silent removal or relicense.

## Maintainability and executed checks

README/package.json tooling already existed and is preserved/updated. README documents tests, preview deployment, worker generations/query versions, local fonts/data and provider configuration. Proposed future migration of remaining frontend sources to src/modules/build is **not implemented**; it requires a separate review. Stage 1 whitespace hashes are checked against the immutable Stage 1 Git commit after intentional Stage 3 functional edits.

- **137 unit/regression tests passed, zero failed**; syntax/JSON and production-style preview build passed.
- Real worker install/local fonts, explicit PREPARE, offline HTML/CSS/app-shell reload and recovery passed.
- Real-route responsive navigation regression passed 1180×820, 390×844 and 844×390; gestures, map/maneuver/speed visibility, restored route/profile and active GPS intent; no page errors. GPS is emulated.
- Destination-input browser checks passed with explicitly emulated microphone/clipboard/GPS and unsupported fallback. Actual iOS mic/recognition is untested.
- Real long-route results and the failed taller-truck case are documented above. Custom endpoint logic was tested for exact profile/no silent fallback; no owner's private server was supplied or verified.
- No physical six-device, real GPS/road, browser-eviction longevity, all-country restriction, live backend multi-user or seasonal-data certification was performed. No database migrations/writes were required.

شش دستگاه: برای دستگاه‌های ۱ تا ۶، نسخهٔ مرورگر/ابعاد واقعی خودرو را ثبت کنید؛ برنامه را آنلاین و آفلاین باز کنید؛ فونت/تم/چرخش صفحه و حفظ سفر را بررسی کنید؛ هنگام توقف میکروفن و چسباندن و انتخاب روی نقشه را تست کنید؛ آدرس بلند را با ابعاد واقعی امتحان کنید و خطای سرویس را ثبت کنید؛ گزارش را با عکس و شمارهٔ نسخه بفرستید. نمونهٔ ۳٫۸ متر دلیل تغییر ابعاد واقعی خودرو نیست.
