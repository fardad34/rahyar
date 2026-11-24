# Audio/layout completion and overall review — 23 November 2026

Scope: finish the pending development update on existing PR #2. Review preceded the resumed code changes: current diff/history, navigation shell and CSS cascade, camera/sheet relationships, route-label blockers, speech/media lifecycle, trip persistence, service worker/offline manifest, local server, Netlify build guard and existing tests were inspected. This is not a claim of a new country-by-country routing/data certification or a live database audit.

## Findings and disposition

| Finding | Completed change / remaining boundary |
| --- | --- |
| Persian/Dariush selected in iPad settings but unavailable in both browsers | Ship actual fixed Persian MP3 prompts; use Web Audio, independent of system/browser voice inventory. Device-native voices remain selectable. |
| Unlisted-system trial repeatedly failed on the user's device | Replace that trial/confirmation path with bundled Persian basic; do not claim arbitrary Persian TTS works. |
| Road label used hardcoded full-screen center/offset and fixed-size card | Measure the free interval between docked trip sheet and milestone; center a text-sized card within it, with a two-line maximum. |
| Expanded full-width sheet leaves no lower map gap on narrow screens | Hide the lower-priority road label until that sheet collapses. It does not float upward or cover the sheet. |
| A road name containing “square/exit” could be mistaken for a voice action by loose phrase matching | Match known maneuver prefixes; keep unknown text unsupported instead of substituting a different instruction. |
| Cancelling timed-out/stopped audio could race an ended callback | Resolve cancellation before stopping the source; one terminal callback, released media focus and cleared timer. |
| Startup observer continued watching all later DOM changes after setup | Disconnect after the original controls have been moved successfully. |
| Development server lacked MP3 MIME; README named an older branch/API count | Add `audio/mpeg`; correct the branch and local setup description. |
| Layered legacy CSS and shared globals remain | Limit new overrides to the road slot and keep original integrations. Broader module/CSS consolidation is future work; not described as completed. |
| Netlify account protection | Preserved. Deploy Preview can remain restricted (unauthenticated 401); no visibility/unlock/production change is authorized by this update. |

## Persian basic: actual supported behavior

Nine bundled synthetic eSpeak NG Persian prompts: enable/test, left, right, continue, exit, roundabout, approaching destination, arrived, and speed-change advisory. About 196 KiB total. Browser fetch/decode/start/end runs without a Persian `speechSynthesis` voice. Independent navigation volume uses a Web Audio gain; existing media-focus restoration preserves explicit Pause/source changes. Playback starts after the normal Test Voice gesture; blocked audio/network/decoder failures are reported and do not mark a cue delivered.

**Limits:** synthetic voice quality; no arbitrary road names, exit numbers, numeric speed limits or arbitrary text; no Persian voice cloning, paid provider or remote TTS. The generic speed advisory is only requested by the existing mapped-change trigger; it invents no limit. Selecting an actually available native Persian voice retains the existing fuller spoken text. Real Chrome/Safari/iPad speaker/Bluetooth output still needs device testing. Successful audio start/end events are not a claim of physical audibility.

Generation source: `scripts/generate-persian-prompts.py` and `dist/audio/fa/manifest.json` contain the exact authored phrases. Optional build-time tools: eSpeak NG 1.51 and ffmpeg. They are not bundled as runtime binaries; only generated audio ships. No package or cloud service was added. Existing consent-based offline manifest generation automatically includes the audio/player assets; no offline maps/rerouting claim is added.

## Layout behavior

On docked iPad/landscape layouts the road slot's left edge is the trip sheet's right edge + 12 px; its right edge stays at least 12 px before the visible milestone. A compact card centers within that free interval. Short text shrinks in both width and height. Alias/bilingual text uses the existing semantic line break and at most two lines, with a reserved slot keeping its top edge stable. Panning/vehicle motion/sheet expansion does not move the slot upward. Expanded full-width portrait panels hide the label; collapsed panels retain the original above-sheet clearance. This supersedes the older full-screen-center and fixed-card-size notes.

## Executed checks

- `npm run verify`: **123 passed, zero failed**; syntax/JSON checks passed.
- Production-style preview build: `CONTEXT=deploy-preview BRANCH=feature/navigation-redesign-20261118T130316Z node scripts/netlify-build.cjs` passed. Main/production build guard preserved.
- `road-slot.browser.cjs`: 1280×889, 1180×820, 390×844, 844×390; actual one/two-line sizing, no docked-sheet/milestone overlap, narrow-screen hiding, all three sheet states and map panning passed. Uses synthetic road text/marker, not a real GPS trip.
- `speech-media.browser.cjs`: real bundled audio request, decoding and Web Audio start/completion passed with no browser Persian voice or speech-synthesis request. All nine MP3s decoded with nonzero signal. Existing voice/media interruption and explicit Pause checks passed (system speech/interruption emulated).
- Existing `road-audio.browser.cjs`: map controls, persisted independent volumes/test buttons and panning passed; system speech is explicitly emulated.
- Existing `navigation-ui.browser.cjs`: real route/map, responsive 1180×820, 390×844, 844×390, gestures, maneuver/speed visibility, trip/vehicle reload with GPS intent and no page errors passed. GPS is emulated, not physical road testing. Weather can correctly show unavailable when the provider has no response.
- Screenshots inspected: real responsive navigation capture and isolated label-layout capture. The isolated capture does not verify live map/GPS.

No new Supabase writes/migrations or live multi-user tests were run because this change does not alter backend/report storage. Existing unit/security regressions remain included. Full native speech on the user's device, exhaustive long-distance alternative coverage, verified truck-legal blue roads, complete milestone/camera/official alert coverage, licensed offline basemaps, generative AI and CarPlay remain incomplete/unverified as documented in project context.

## Safety and recovery

Feature branch `feature/navigation-redesign-20261118T130316Z`, PR #2 only. Verified private full-history pre-change backup: `before-bundled-persian.bundle`, rollback source `4695dacc83b9f920c15a7d59741e5ed44c6c619e`. No main merge/force push, production unlock, visibility change, data overwrite, paid service or duplicate project. Revert this development commit and rebuild its Deploy Preview to roll back; leave main and production deployment untouched. Git backup does not back up browser media or external databases/settings.
