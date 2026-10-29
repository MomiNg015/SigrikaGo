# Findings
- Home CSS references desktop/mobile panel art and student-ID assets absent from RUNTIME_IMAGE_ASSETS.home; home header GIF also missed the registry.
- IRIS already calls the correct dedicated sound and its Ogg is tracked. Loader timeouts were counted as completion, then retried after entry.
- Voice URLs were fetched as bytes, but playback uses a separate decoded AudioBuffer cache. Cold playback fetched/decoded at event time; contexts created during preload lacked gesture unlock.
- Tutorial setup used only a three-second timer while portraits warmed in the background.
- Corrective contract: required readiness rejects after an in-screen retry; no home reveal or battle ready acknowledgement after rejection. Actual voice decoder is part of readiness. Tutorial waits for assets and the minimum duration.
- Real Chrome checks cover 1440/390/320px, continue exclusion, pointer-transparent target cutouts, delayed home art with cold audio, and tutorial readiness beyond three seconds.
