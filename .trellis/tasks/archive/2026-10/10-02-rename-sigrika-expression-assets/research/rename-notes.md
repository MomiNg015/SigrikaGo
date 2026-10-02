# Rename constraints

Source package: C:/Users/Moming/.codex/visualizations/2026/10/02/01a0fb2f-41c4-7373-aade-6f8b09c8f56d/sprite-expressions.

The user identifies this character as Sigrika / 西格莉卡. The existing rig and manifest use orange_braid_character. Native exports are nine PNGs; the PSD and two previews use generic delivery filenames. Keep expression IDs and internal layers/sources stable. Rename delivery artifacts and synchronize their path references.

Upstream verify.py expects unprefixed native PNG filenames and masters/character-native.psd. The existing documented regeneration sequence runs upstream build/verify before make-delivery.cjs. Update that local delivery finisher to apply the Sigrika names after upstream verification, and provide separate post-rename integrity checks without rebuilding images.
