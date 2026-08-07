# Corrupted Sigrika Chibi Candidates

Mode: GPT Image 2 Skill Mode B (host-native image generation)

## Shared reference roles

* Image 1 — identity reference: original full-body Sigrika; preserve orange segmented braids, white pointed headpiece, face, and recognizable white/lavender/gold outfit construction.
* Image 2 — identity and abstraction reference: current Sigrika chibi; preserve its exact big-head/small-body simplification and recognizable hair silhouette.
* Images 3-6 — project style references: use only for the shared chibi proportions, clean dark outline, rounded compact limbs, large glossy eyes, soft cel shading, restrained highlights, and simplified costume detail density. Do not copy their identities or accessories.

## Shared structured prompt

```json
{
  "type": "single-character chibi game portrait candidate",
  "goal": "create one production-ready corrupted Sigrika chibi standing illustration that belongs to the same visual family as the current SigrikaGo character portraits",
  "use_case": "stylized-concept",
  "character": {
    "identity": "Sigrika from Image 1 and Image 2",
    "fixed_features": [
      "warm orange hair arranged into multiple segmented braids and large side masses",
      "white pointed mechanical-floral headpiece with muted gold accents",
      "recognizable white, lavender, dark navy and gold outfit construction from the identity reference",
      "very large vivid crimson-red irises with sharp controlled highlights"
    ],
    "corruption_treatment": "darken the existing outfit and ornaments with charcoal, cold gray and deep muted violet while retaining the original construction; add only a few restrained thin blood-red data-fracture accents; subtly desaturate skin and hair shadows without turning the orange hair black",
    "expression": "cold, calm, emotionally distant and quietly threatening; closed neutral mouth; lowered inner brows; no smile"
  },
  "style": {
    "proportions": "approximately two heads tall, oversized rounded head, tiny compact torso, very short rounded arms and legs",
    "rendering": "polished 2D anime chibi game asset, clean dark outer contour, smooth cel shading, small controlled gradients, crisp silhouette, readable simplified costume panels",
    "eyes": "large gem-like crimson eyes; both eyes clearly open and equally red",
    "mood": "restrained corrupted archive anomaly, elegant rather than horror-gore"
  },
  "composition": {
    "format": "one single full-body character, square 1:1 canvas",
    "placement": "centered with generous padding; entire headpiece, hair, hands and feet visible",
    "camera": "straight-on game portrait view with only a slight three-quarter turn where the pose calls for it"
  },
  "background": "perfectly flat solid #00ff00 chroma-key background, one uniform color with no shadows, gradients, texture, reflections, floor plane or lighting variation",
  "constraints": {
    "must_keep": [
      "same character identity in Images 1-2",
      "same visual family and detail density as Images 2-6",
      "red eyes",
      "cold expression",
      "crisp edges separated from background"
    ],
    "avoid": [
      "smile, blush-heavy cute expression, crying, screaming, manic grin or exaggerated anger",
      "photorealism, semi-realistic body proportions, 3D render, pixel art or painterly texture",
      "weapons, wings, horns, animal ears, pets, extra characters or floating props",
      "black hair or a completely redesigned outfit",
      "gore, blood splashes, excessive red glow or busy glitch overlays",
      "cast shadow, contact shadow, reflection, text, logo or watermark",
      "using #00ff00 anywhere on the character"
    ]
  }
}
```

## Candidate A — Crossed-arm verdict

Add to the shared prompt:

```json
{
  "pose": "standing squarely with both tiny arms folded across the chest, chin slightly lowered, eyes looking straight forward from beneath the brows; balanced closed silhouette",
  "pose_read": "silent judgment and absolute control"
}
```

## Candidate B — One-hand halt

Add to the shared prompt:

```json
{
  "pose": "slight three-quarter stance, one small open palm raised at chest height in a precise stop gesture, the other hand resting close to the side; hair masses fan subtly outward",
  "pose_read": "cold command without shouting"
}
```

## Candidate C — Hands-behind-back stare

Add to the shared prompt:

```json
{
  "pose": "hands held behind the back, upper body leaning forward only a little, chin tucked while crimson eyes look upward directly at the viewer; feet close and stable",
  "pose_read": "quiet scrutiny and unsettling composure"
}
```

## Candidate D — Sideward dismissal

Add to the shared prompt:

```json
{
  "pose": "body turned slightly sideways, head turned back toward the viewer, one arm lowered with relaxed fingers and the other hand touching the opposite sleeve; asymmetrical but compact silhouette",
  "pose_read": "aloof dismissal and controlled menace"
}
```
