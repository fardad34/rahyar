# Speech and media focus — 22 November 2026

## Fixed behavior

Previously, speech restored only the media element volume. If Safari paused the element while taking speech audio focus, playback stayed paused. Media now exposes a navigation-focus hold that captures playback intent and source revision. Ending/erroring/cancelling/timing out the current speech restores volume and makes one delayed resume attempt for the same previously playing source. Explicit in-app Pause, replaced sources, ended media and initially paused media are not restarted. Overlapping instructions and another instruction during the audio-focus release interval retain the original intent. No source reload or playback-position reset is used. A rejected autoplay attempt stops retrying and shows the existing Tap Play recovery message.

This coordinates the in-app HTML audio player only. It cannot control a different browser tab or external radio application. Device audio-focus behavior and autoplay permissions vary; actual iPad Safari/Bluetooth testing remains required. Native/OS controls may not expose the reason for a media pause to JavaScript; the explicit-pause regression covers Rahyar's own controls.

## Persian speech status

Persian texts already exist, but the reported device exposes no matching voice to Safari. Normalize voice locale case, underscores and Persian `fas`/`per` aliases; refresh the inventory on returning to the app, `voiceschanged`, and Test Voice. An empty selector now explains the missing voice instead of silently appearing blank. Persian help explains the optional iPad Settings → Accessibility → Spoken Content / Read & Speak → Voices download path and requests retesting after return. It does **not** promise that downloading a voice makes it available to the browser.

Apple lists Farsi for VoiceOver/Live Speech/Spoken Content: https://www.apple.com/ae/ios/feature-availability/ . Those accessibility capabilities do not establish Web Speech API availability on this user's iPad. Guidance on selecting downloaded spoken-content voices: https://support.apple.com/en-ie/guide/iphone/iph96b214f0/ios . No unrelated language is substituted for Persian, no unsupported Persian playback is claimed and no paid speech service is activated. Persian audio remains unverified on the actual device; the iPadOS version has been requested.

## Executed checks

- 116 automated unit/regression tests passed, zero failed; syntax and production-style build passed.
- Real application UI browser check with explicitly emulated speech inventory/audio-focus events passed: Persian alias selection, interrupted radio resumption, respecting user Pause, and absent-voice disclosure.
- Tests also cover source replacement, already paused/ended media, bounded autoplay denial, overlapping speech/cancellation and the focus-release interval.
- These tests do not establish device audibility or a working Persian voice on the user's device.

## Safety

Existing feature branch and PR #2 only. Verified private full-history backup: `before-speech-media.bundle`; rollback source `ff2e177ed01bd8ebbcff678245c179ce5c33e355`. Main, production publishing lock and Supabase data unchanged.
