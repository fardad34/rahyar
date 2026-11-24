# Installed Dariush voice and lower road label — 22 November 2026

User evidence: Chrome on iPadOS 27.0.1, with Persian/Dariush visible in system accessibility settings. This establishes the system voice selection, not its enumeration/availability to Web Speech. The previous message to install a voice was therefore insufficient.

## Changed behavior

- Recognize an exposed Dariush device voice even if browser language metadata is unhelpful; always request canonical `fa-IR` for Persian.
- If the browser inventory omits Persian, Test Voice now actually requests system `fa-IR` synthesis without specifying a voice. Previously it returned before requesting any speech. This is a bounded user-triggered test, not a claim that the browser supports the voice.
- A completed unlisted-system trial offers “فارسی را درست شنیدم”. Automatic Persian navigation through that unlisted voice requires explicit listener confirmation, retained only for this open app session. Engine start/end alone do not prove correct pronunciation or audible Persian. A language-unavailable/error clears that confirmation and shows the actual error code. No unrelated voice is explicitly selected as a fallback; an OS-selected fallback must not be confirmed unless it really speaks Persian.
- Missing inventory guidance now distinguishes installed system voices from browser visibility and refers to the browser rather than assuming Safari.
- Correct the road slot from a fixed-but-too-high 120 px offset to 24 px plus safe area on wider screens, below the normal vehicle marker. Narrow portrait screens retain 120 px clearance above the full-width collapsed trip sheet. Neither value follows the sheet state or map. Semantic road aliases separated by semicolon/middle dot begin on a new line, with a fixed-height two-line clamp; long bilingual names no longer depend only on incidental width to break. This supersedes the 120 px wider-screen placement in FIXED_ROAD_SLOT_20261122.md.

## Executed verification

118 automated tests passed, zero failed; syntax and production-style build passed. Browser checks passed road text/center/bottom placement across collapsed/half/full states and pan at 1280×889, 1180×820, 390×844 and 844×390. Browser UI tests with explicitly emulated audio/voice APIs passed Persian alias selection, system trial, listener confirmation, interrupted-radio restoration, explicit Pause and missing inventory disclosure. Unit tests cover unhelpful Dariush metadata and rejection of confirmed system speech.

Physical Chrome/iPad Persian output, speech quality and device audio focus remain unverified. No claim of installed/enumerated Dariush on the test machine, no synthetic production backend responses, no paid speech provider, no change to main/production/Supabase data.

Verified private rollback backup: `before-dariush-road-label.bundle`, source `40d36dc563abb44b5cc28942f02ad21fc8ec76c2`. Feature branch and PR #2 only.
