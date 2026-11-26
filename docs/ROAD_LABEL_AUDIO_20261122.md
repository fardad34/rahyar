# Fixed road-name slot and Safari audio follow-up — 22 November 2026

Development-only change on the existing PR #2 branch. No production/main publish, access-setting change, paid service or database mutation.

## Road label and map credit

- Removed the one-second JavaScript positioning of the current-road pill from the projected vehicle coordinate.
- Road name uses a centered fixed CSS slot near the bottom of the usable map, above the trip sheet. Panning/GPS-marker movement does not reposition it. Expanding the sheet adjusts the safe map area, not the road text length.
- The slot has a fixed height and at most two lines. Long text wraps/clamps within that slot rather than increasing its height/upward extent. Current-road data/source remains unchanged.
- Standalone map-render/browse status is hidden in the navigation redesign. Provider attribution uses the built-in compact information control, retaining source/license links; required map attribution is not deleted.

## Audio implementation and diagnosed failures

- Map speaker icon, map-layers menu and main menu open **Voice & alert sound**. Existing settings also link there. Existing language, installed-voice, voice-volume and Test Voice controls are reused, with their event handlers intact.
- Warning sound can be Clear chime, Bell or Pulse. Warning volume and speech volume are independent and persisted. Test warning sound unlocks/resumes Web Audio from its user gesture. Volume zero actually mutes the tones.
- The original fixed warning gain was 0.13. Configurable warning gain now peaks at `0.5 × warning volume`, default 0.85 volume (0.425 peak); tone duration increased to 0.25 seconds. Device/Bluetooth volume still limits actual audibility; the web app cannot increase iOS hardware volume.
- Voice guidance defaults on only when no previous preference exists. A saved mute preference is preserved and can be changed in the audio menu.
- Resume speech before speaking; resume audio/speech on foreground return and user gestures. Keep a strong utterance reference during playback for Safari.
- Previously a navigation cue was marked delivered when queued, even if speech failed. A pending cue is now deduplicated while queued and marked delivered only on the speech engine's start event. Errors release it for retry. Playback failures and missing voices are reported rather than claimed successful.
- When the English voice list has not loaded, the device default English voice may be requested without assigning a fabricated voice object. Non-English languages still require an installed matching device voice; no six-language audibility claim or paid TTS service is introduced.
- Existing turn/exit speech, verified mapped speed advisories, microphone/media functionality and radio-volume restoration remain.

## Verification and limits

- Unit/regression tests verify empty-English-list fallback, actual start-event delivery tracking, retry after blocked speech, independent configurable warning tones/volume and true mute, plus existing voice/media tests.
- Browser UI test uses the actual map and Web Audio controls, with a clearly emulated speech engine to verify event wiring and persistence. It checks panning, fixed-height two-line road text, compact attribution, menu access, separate sliders, both Test buttons and reload persistence.
- Browser engine event simulation is not proof that an iPad speaker, Bluetooth output or every installed language works. Physical iPad/iPhone Safari audibility remains a manual check: open the speaker icon, enable Voice guidance, choose an installed English voice, set both volumes, tap Test Voice/Test warning sound and confirm the device output.
- Existing hosting protection may still return 401 before app loading. This change does not remove Netlify account protection or alter production access.

## Recovery

Pre-change Git bundle is in the existing private backup folder as `before-road-audio.bundle`. Return only the preview to `78d970bc5ccd7b47d912b15574e5415f56258800` to roll back this follow-up. Existing trip history, database tables and production remain untouched.

Final verification: `npm run verify` passed **88 tests, 0 failed**; build passed. Focused road/audio browser controls, the six-language/menu regression and responsive navigation suite (1180×820, 390×844, 844×390) passed with no page errors. Responsive suite also verified same-tab trip/GPS restoration. Speech-engine wiring in the focused suite is emulated; actual physical Safari sound is explicitly not claimed.
