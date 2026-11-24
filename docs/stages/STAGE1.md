# Stage 1 — offline and whitespace cleanup (24 November 2026)

Base: development commit 93eb100; production/main unchanged. Full-history backup `before-three-stages-20261124.bundle` is stored privately outside the repository.

The current app already had package.json/build tooling, local Leaflet, 123 tests, saved-route preparation and a service worker. The existing PREPARE message, explicit route download, upgrade and delete controls are preserved. New shell registration is automatic; visited tile caching is bounded to 600 and is not a regional/offline map package or offline rerouting. Public provider availability, licensing, browser eviction and fresh restrictions remain limitations. No remote live service or private same-origin API is intercepted. The API exclusion is an intentional privacy constraint beyond the requested generic same-origin rule.

Install rejects missing required HTML assets and login/non-app HTML, then skipWaiting. Versioned shell/data/CDN/tile caches activate only after install; older rahyar-sw caches are removed. Required source references use reload; icons and all trailer files are best effort. Network-first shell/home fallback waits at most four seconds when cached, without aborting late network updates. Cross-origin caching requires readable CORS responses. The existing prepared app cache can still be removed without deleting media/favorites.

Nine specified application files changed only in whitespace. See `stage1-whitespace-proof.json`: original and resulting whitespace-stripped SHA256 are identical. Acorn tokenization (Node 24 bundled parser, tooling only) avoids strings/regex/comments/for semicolons and template-containing lines. No parser dependency was added. Changed scripts have updated query versions; offline.js loads immediately before app.js. Netlify no-cache headers cover worker and HTML.

Executed: 129 tests passed, zero failed; JS/JSON checks and build passed. The browser test checks real worker install/cache contents, then offline HTML/CSS/app-shell reload and recovery banner. See final delivery for executed browser outcome. GPS/truck-road behavior is not tested by a shell-cache test.

Six-device checklist (each device separately): open online and accept notice; wait for cache preparation; reload once online; enable airplane mode and reopen; confirm UI/banner and previously prepared route; restore network and confirm recovery; record device/browser/version and any missing asset. Do not infer fresh truck legality from cached roads.
