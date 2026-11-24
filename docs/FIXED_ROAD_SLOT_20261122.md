# Fixed road label follow-up — 22 November 2026

The previous viewport-fixed label still used `--nav-sheet-height` for its bottom offset. Expanding the watch list therefore raised the road name. The previous regression tested panning and text height but missed sheet-state transitions.

The road label now keeps a constant 120 CSS-pixel bottom offset plus the device safe-area inset. Its horizontal center remains the viewport center. Neither sheet state nor camera position changes this anchor. Its reserved height is unchanged for short and long names; long names wrap to at most two visible lines without raising the top edge. Explicit wrapping/display rules prevent old driving-mode rules from restoring a single-line label. Road text content and all route/GPS logic are unchanged.

Verification: 109 unit/regression tests passed, zero failed; syntax and build passed. `BASE_URL=http://127.0.0.1:3055 node tests/integration/road-slot.browser.cjs` verifies actual wrapped text rectangles, fixed top edge, center and bottom offset across collapsed/half/full sheets and map panning at 1280×889, 1180×820, 390×844 and 844×390. Its synthetic text fixture freezes periodic guidance refresh because it has no real trip. This is layout verification, not physical Safari/road testing.

Backup: private full-history `before-fixed-road-slot.bundle`, verified before changes. Rollback source: `ad426965656219b4a3f61f9b495e4b441d8f9d91`. Feature branch/PR #2 only; main, production publishing lock and Supabase data unchanged.

Persian speech is a separate unresolved device/provider capability issue. This CSS change does not install a Persian voice or claim Persian speech works. The reported unavailable Persian device voice still needs a genuine supported speech engine; no paid provider has been activated.
