# Portrait normalization approaches

## Constraint

Cropping arbitrary transparent margins and then saving variable tight rectangles is not enough for every consumer:

- `object-fit: contain` will still make tall, wide, and prop-heavy silhouettes occupy different fractions of a square/portrait slot.
- Forcing every tight crop to the same width and height would distort aspect ratios.
- A uniform final canvas necessarily reintroduces some transparency, but it can be deterministic and intentional rather than inherited from source files.

The durable pipeline therefore has two distinct phases:

1. Trim to the alpha/content bounds.
2. Normalize the trimmed subject into a documented safe region and anchor on a canonical transparent canvas.

## Tooling options

### A. Repository Node script with `sharp` (recommended)

- Discover local targets from committed character/costume catalog metadata.
- Decode PNG and WebP, inspect alpha, trim, resize, extend onto a canonical canvas, and output lossless WebP.
- Provide `--check`, `--write`, manifest output, idempotence tests, and catalog coverage.
- `sharp` supports PNG/WebP inputs, alpha-aware trim, aspect-preserving resize, transparent extend/contain, and lossless WebP output.
- Trade-off: adds a native/prebuilt dev dependency and cross-platform lockfile responsibility.

Official references:

- https://sharp.pixelplumbing.com/api-resize/
- https://sharp.pixelplumbing.com/api-output/
- https://sharp.pixelplumbing.com/install/

### B. Python/Pillow maintenance script

- The current machine already has Pillow and can process PNG/WebP.
- Similar algorithm and output are possible with less implementation work.
- Trade-off: project installation currently declares Node dependencies, not Python/Pillow; CI and other developer machines would need an undocumented extra runtime unless setup is expanded.

### C. One-time asset conversion plus metadata-only verification

- Process current images once, commit them, and keep only a lightweight dimension/path validator.
- Trade-off: future assets can regress because the repository has no supported normalizer; this does not satisfy the “one-and-done” maintenance goal.

## Visual normalization options

### 1. Canonical safe box, bottom-center anchor (recommended)

- Trim first.
- Fit the complete visible subject inside a shared square safe box while preserving aspect ratio.
- Place on a shared square transparent canvas, horizontally centered and bottom-aligned.
- Keep a small uniform safety margin for antialiasing and shadows.
- Allow a manifest override only for exceptional prop-heavy or horizontal silhouettes.

This gives every consumer the same canvas and anchor while preserving full artwork.

### 2. Equal alpha-area target

- Scale each trimmed image so the number of visible/opaque pixels approaches a shared target area.
- Add width/height caps and then place on a shared canvas.
- This better equalizes “visual mass”, but pale/translucent effects, long thin props, and different drawing density make the metric unstable and harder to explain.

### 3. Tight crops only

- Trim and resample the longest edge to a fixed pixel count.
- Simple and compact, but runtime `contain` still produces different visual sizes based on aspect ratio. It does not fully solve the reported wardrobe mismatch.

## Recommended contract

- Use approach A for reproducible PNG/WebP processing.
- Use visual option 1 with a canonical square canvas and bottom-center safe box.
- Keep `portraitScalePercent/offset` as an explicit artistic exception only; reset normalized current costumes to `100/0/0`.
- Include future local `candyEffectPortraitUrl` assets in the same discovery and normalization process.
- Fail `--check` for remote URLs with an informational skip unless the project later adds an upload/import pipeline.

