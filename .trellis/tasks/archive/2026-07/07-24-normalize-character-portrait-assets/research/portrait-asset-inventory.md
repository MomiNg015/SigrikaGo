# Portrait asset inventory

## Catalog scope

The committed admin defaults currently reference:

- 10 default character portraits.
- 5 costume portraits.
- No committed costume-specific candy-effect portraits yet.

All 15 current paths are local `/assets/...` files. The catalog/admin contracts also allow future local asset URLs and HTTP(S) URLs.

## Measured alpha geometry

Measurements use the first non-zero alpha pixel on each side.

| Asset | Canvas | Alpha bounds | Visible size | Visible fill X/Y |
|---|---:|---:|---:|---:|
| `sigrika_centered.webp` | 640×640 | 63,53–577,587 | 514×534 | 80.3% / 83.4% |
| `Danea_centered.webp` | 640×640 | 70,39–571,601 | 501×562 | 78.3% / 87.8% |
| `Aemeath_centered.webp` | 640×640 | 115,28–541,584 | 426×556 | 66.6% / 86.9% |
| `characters/lynae_centered.webp` | 640×640 | 63,47–576,592 | 513×545 | 80.2% / 85.2% |
| `characters/mornye.png` | 640×640 | 72,25–567,615 | 495×590 | 77.3% / 92.2% |
| `characters/chisa.png` | 640×640 | 58,47–580,592 | 522×545 | 81.6% / 85.2% |
| `characters/changli.png` | 640×640 | 47,52–592,587 | 545×535 | 85.2% / 83.6% |
| `characters/qiuyuan.png` | 640×640 | 78,47–561,592 | 483×545 | 75.5% / 85.2% |
| `nabomo.webp` | 640×640 | 85,20–555,619 | 470×599 | 73.4% / 93.6% |
| `baconbits.webp` | 640×640 | 20,75–620,564 | 600×489 | 93.8% / 76.4% |
| `costumes/sigrika-01.webp` | 756×900 | full canvas | 756×900 | 100% / 100% |
| `costumes/denia-01.webp` | 780×900 | full canvas | 780×900 | 100% / 100% |
| `costumes/denia-02.webp` | 848×900 | full canvas | 848×900 | 100% / 100% |
| `costumes/nabomo-01.webp` | 719×900 | full canvas | 719×900 | 100% / 100% |
| `costumes/nabomo-02.webp` | 711×900 | full canvas | 711×900 | 100% / 100% |

## Current mismatch mechanism

Wardrobe images share `width: 100%`, a fixed image-row height, and `object-fit: contain`. Default cards render the character portrait without framing. Costume cards apply per-row framing; committed defaults are 83% for Sigrika, 88% for both Denia costumes, and 94% for both Nabomo costumes.

This means two correction systems coexist:

1. Arbitrary transparent margins embedded in default portrait canvases.
2. Manual runtime scale metadata on costume portraits.

Trimming only one group or changing CSS alone cannot make all consumers consistent.

## Existing tooling gap

`scripts/pngTrim.mjs`:

- Supports only 8-bit RGBA PNG.
- Crops to alpha bounds with optional padding.
- Does not decode or encode WebP.
- Does not normalize the longest edge, visible height/area, output format, or anchor.
- Does not discover targets from the character/costume catalog.

A durable solution needs catalog-driven discovery, PNG/WebP support, deterministic output, validation, and idempotence.

