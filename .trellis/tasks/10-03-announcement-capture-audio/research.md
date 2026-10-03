# Investigation

## Capture challenge audio (implemented)
- Confirmed cause: `ResultModal` returned early from both result effects whenever `isChallenge` was true. Normal completed challenges also have null winner color, so removing those guards alone would produce a draw voice/no effect sound.
- Added shared completion predicate requiring finished phase, exactly 100 moves, completion reason, no invalid result and authoritative `practice.result`. Both audio resolvers celebrate participating players independently of ordinary winner color; existing playback settings and per-channel duplicate guards stay in place.
- Focused DOM coverage includes settlement pending -> complete, both channels, settings, rerenders, invalid/incomplete/stale result and spectator silence.

## Announcement first-open error (pending reproduction)
- All four announcement routes catch domain errors and respond with JSON. Startup awaits schema initialization before admitting traffic; domain payloads use serializable primitives/dates.
- Client format error is emitted when response Content-Type does not include `application/json`; server request parsing uses a distinct `请求 JSON 格式错误` message. The user quote may be approximate.
- Verified bodyless POST with application/json header using real Express JSON parser, production JSON syntax error middleware and actual fetch: first and second request both return HTTP 200 application/json with empty body parsed as `{}`. This does not reproduce the reported failure.
- Parent verified unauthenticated live development list request returns the expected HTTP 401 application/json.
- No speculative gateway retries or format-error suppression added. Need exact error wording, whether running local development or deployed build, failing request URL/status/content-type/body from the first open. Browser control runtime unavailable in this session.
- Audio acceptance complete; announcement acceptance remains pending.
