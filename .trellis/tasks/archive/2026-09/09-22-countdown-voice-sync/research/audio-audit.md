# Countdown voice audit (2026-09-22)

Decoded all 90 static countdown clips with FFmpeg to mono float PCM at 48 kHz. Absolute amplitude threshold: 0.01 (-40 dBFS); preserve 10 ms pre-roll. This measures signal onset, not perceptual vowel onset. Do not use vowel-relative thresholds to trim quiet consonants.

| Character | Clips | Onset min-max (ms) | Skipped silence min-max (ms) | Clip length min-max (ms) |
|---|---:|---:|---:|---:|
| aemeath | 10 | 0.6-16.5 | 0.0-6.5 | 264.8-418.4 |
| changli | 10 | 0.0-17.4 | 0.0-7.4 | 426.7-789.2 |
| chisa | 10 | 0.1-20.2 | 0.0-10.2 | 275.7-666.8 |
| denia | 10 | 0.1-21.5 | 0.0-11.5 | 299.2-609.3 |
| lynae | 10 | 3.5-19.0 | 0.0-9.0 | 362.8-794.1 |
| mornye | 10 | 0.0-9.4 | 0.0-0.0 | 290.4-577.4 |
| nabomo | 10 | 0.4-20.2 | 0.0-10.2 | 258.2-631.5 |
| qiuyuan | 10 | 32.1-80.2 | 22.1-70.2 | 310.8-718.7 |
| sigrika | 10 | 0.1-12.6 | 0.0-2.6 | 289.0-554.6 |

All trimmed clips finish within a one-second slot at original speed. Runtime scans all channels, takes the earliest signal, caches offset per decoded buffer, and does not rewrite source assets.

## Common timing path

- Existing useRoomAudioEffects played on every network-delivered integer clock snapshot; useRoomBoardView had no interpolation. Packet jitter therefore directly changed both screen and voice cadence.
- New countdown-only local timeline accepts up to 300 ms packet jitter, predicts at most one tick past confirmation, clamps at one second, and resets on room/turn/history/period/phase changes. Both visual player clocks and announcements consume the same room projection.
- Existing uncached play path fetched/decoded separately from in-flight preload and could complete after a newer request. Shared cache, latest-request cancellation and a 200 ms countdown start deadline prevent late catch-up.
- Quiet consonants may precede the perceived vowel by 100+ ms; this natural pronunciation is intentionally preserved. Browser TTS and media fallback cannot promise decoded-buffer onset precision.

## Per-clip signal measurements

| File | Onset ms | Offset ms | Duration ms |
|---|---:|---:|---:|
| aemeath_countdown_1.ogg | 0.65 | 0.00 | 264.77 |
| aemeath_countdown_10.ogg | 3.27 | 0.00 | 412.88 |
| aemeath_countdown_2.ogg | 1.04 | 0.00 | 325.12 |
| aemeath_countdown_3.ogg | 7.77 | 0.00 | 347.33 |
| aemeath_countdown_4.ogg | 16.52 | 6.52 | 418.42 |
| aemeath_countdown_5.ogg | 1.85 | 0.00 | 297.33 |
| aemeath_countdown_6.ogg | 5.65 | 0.00 | 338.21 |
| aemeath_countdown_7.ogg | 2.19 | 0.00 | 329.44 |
| aemeath_countdown_8.ogg | 2.77 | 0.00 | 276.06 |
| aemeath_countdown_9.ogg | 2.75 | 0.00 | 370.23 |
| changli_countdown_1.ogg | 17.44 | 7.44 | 557.75 |
| changli_countdown_10.ogg | 10.52 | 0.52 | 741.60 |
| changli_countdown_2.ogg | 1.40 | 0.00 | 627.35 |
| changli_countdown_3.ogg | 9.42 | 0.00 | 613.98 |
| changli_countdown_4.ogg | 2.21 | 0.00 | 789.19 |
| changli_countdown_5.ogg | 0.04 | 0.00 | 654.60 |
| changli_countdown_6.ogg | 2.33 | 0.00 | 599.17 |
| changli_countdown_7.ogg | 10.52 | 0.52 | 544.54 |
| changli_countdown_8.ogg | 14.69 | 4.69 | 426.73 |
| changli_countdown_9.ogg | 7.46 | 0.00 | 675.23 |
| chisa_countdown_1.ogg | 2.96 | 0.00 | 398.04 |
| chisa_countdown_10.ogg | 16.44 | 6.44 | 666.83 |
| chisa_countdown_2.ogg | 1.98 | 0.00 | 488.27 |
| chisa_countdown_3.ogg | 9.54 | 0.00 | 581.98 |
| chisa_countdown_4.ogg | 20.19 | 10.19 | 646.67 |
| chisa_countdown_5.ogg | 0.15 | 0.00 | 482.92 |
| chisa_countdown_6.ogg | 8.81 | 0.00 | 409.21 |
| chisa_countdown_7.ogg | 13.38 | 3.37 | 547.12 |
| chisa_countdown_8.ogg | 8.65 | 0.00 | 275.71 |
| chisa_countdown_9.ogg | 8.08 | 0.00 | 564.54 |
| denia_countdown_1.ogg | 5.15 | 0.00 | 299.19 |
| denia_countdown_10.ogg | 18.19 | 8.19 | 609.33 |
| denia_countdown_2.ogg | 0.12 | 0.00 | 361.15 |
| denia_countdown_3.ogg | 11.10 | 1.10 | 514.27 |
| denia_countdown_4.ogg | 2.23 | 0.00 | 515.10 |
| denia_countdown_5.ogg | 2.85 | 0.00 | 406.73 |
| denia_countdown_6.ogg | 21.48 | 11.48 | 482.48 |
| denia_countdown_7.ogg | 0.27 | 0.00 | 590.67 |
| denia_countdown_8.ogg | 2.35 | 0.00 | 423.75 |
| denia_countdown_9.ogg | 3.02 | 0.00 | 518.48 |
| lynae_countdown_1.ogg | 17.92 | 7.92 | 362.75 |
| lynae_countdown_10.ogg | 19.00 | 9.00 | 590.67 |
| lynae_countdown_2.ogg | 4.27 | 0.00 | 624.67 |
| lynae_countdown_3.ogg | 15.58 | 5.58 | 487.90 |
| lynae_countdown_4.ogg | 9.52 | 0.00 | 794.06 |
| lynae_countdown_5.ogg | 8.48 | 0.00 | 530.19 |
| lynae_countdown_6.ogg | 7.06 | 0.00 | 471.67 |
| lynae_countdown_7.ogg | 4.12 | 0.00 | 565.56 |
| lynae_countdown_8.ogg | 10.50 | 0.50 | 429.62 |
| lynae_countdown_9.ogg | 3.48 | 0.00 | 506.81 |
| mornye_countdown_1.ogg | 0.44 | 0.00 | 290.44 |
| mornye_countdown_10.ogg | 9.42 | 0.00 | 577.35 |
| mornye_countdown_2.ogg | 2.88 | 0.00 | 337.33 |
| mornye_countdown_3.ogg | 7.88 | 0.00 | 451.42 |
| mornye_countdown_4.ogg | 3.19 | 0.00 | 456.08 |
| mornye_countdown_5.ogg | 6.73 | 0.00 | 393.33 |
| mornye_countdown_6.ogg | 6.38 | 0.00 | 406.25 |
| mornye_countdown_7.ogg | 2.10 | 0.00 | 418.71 |
| mornye_countdown_8.ogg | 1.42 | 0.00 | 329.60 |
| mornye_countdown_9.ogg | 0.00 | 0.00 | 450.10 |
| nabomo_countdown_1.ogg | 3.33 | 0.00 | 258.23 |
| nabomo_countdown_10.ogg | 20.19 | 10.19 | 621.33 |
| nabomo_countdown_2.ogg | 2.98 | 0.00 | 407.94 |
| nabomo_countdown_3.ogg | 6.10 | 0.00 | 452.04 |
| nabomo_countdown_4.ogg | 7.42 | 0.00 | 479.23 |
| nabomo_countdown_5.ogg | 2.88 | 0.00 | 448.00 |
| nabomo_countdown_6.ogg | 11.85 | 1.85 | 436.58 |
| nabomo_countdown_7.ogg | 0.35 | 0.00 | 420.50 |
| nabomo_countdown_8.ogg | 0.77 | 0.00 | 457.60 |
| nabomo_countdown_9.ogg | 4.46 | 0.00 | 631.52 |
| qiuyuan_countdown_1.ogg | 33.56 | 23.56 | 508.19 |
| qiuyuan_countdown_10.ogg | 72.31 | 62.31 | 656.90 |
| qiuyuan_countdown_2.ogg | 68.88 | 58.88 | 345.65 |
| qiuyuan_countdown_3.ogg | 41.33 | 31.33 | 450.12 |
| qiuyuan_countdown_4.ogg | 42.50 | 32.50 | 473.35 |
| qiuyuan_countdown_5.ogg | 37.33 | 27.33 | 310.81 |
| qiuyuan_countdown_6.ogg | 32.06 | 22.06 | 392.08 |
| qiuyuan_countdown_7.ogg | 74.92 | 64.92 | 625.33 |
| qiuyuan_countdown_8.ogg | 80.25 | 70.25 | 614.67 |
| qiuyuan_countdown_9.ogg | 69.56 | 59.56 | 718.67 |
| sigrika_countdown_1.ogg | 12.62 | 2.63 | 347.62 |
| sigrika_countdown_10.ogg | 5.35 | 0.00 | 554.60 |
| sigrika_countdown_2.ogg | 1.12 | 0.00 | 288.98 |
| sigrika_countdown_3.ogg | 12.42 | 2.42 | 430.81 |
| sigrika_countdown_4.ogg | 7.46 | 0.00 | 442.71 |
| sigrika_countdown_5.ogg | 0.12 | 0.00 | 335.02 |
| sigrika_countdown_6.ogg | 2.06 | 0.00 | 378.58 |
| sigrika_countdown_7.ogg | 1.27 | 0.00 | 430.17 |
| sigrika_countdown_8.ogg | 0.25 | 0.00 | 317.73 |
| sigrika_countdown_9.ogg | 0.19 | 0.00 | 479.75 |
