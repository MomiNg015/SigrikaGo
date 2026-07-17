import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeRgbaPng } from "../../../../scripts/pngTrim.mjs";

const BYTES_PER_PIXEL = 4;

export function validateNameplateAsset(buffer, rawOptions = {}) {
  const options = normalizeOptions(rawOptions);
  let image;
  try {
    image = decodeRgbaPng(buffer);
  } catch (error) {
    return {
      ok: false,
      image: null,
      alphaBounds: null,
      margins: null,
      safeArea: null,
      errors: [{ code: "png_decode", message: error.message }]
    };
  }

  const errors = [];
  if (options.width !== null && image.width !== options.width) {
    errors.push(failure("width", `Expected width ${options.width}px, got ${image.width}px`, image.width, options.width));
  }
  if (options.height !== null && image.height !== options.height) {
    errors.push(failure("height", `Expected height ${options.height}px, got ${image.height}px`, image.height, options.height));
  }
  if (options.ratio !== null) {
    const actualRatio = image.width / image.height;
    if (Math.abs(actualRatio - options.ratio) > options.ratioTolerance) {
      errors.push(failure("ratio", `Expected ratio ${options.ratio}, got ${round(actualRatio)}`, round(actualRatio), options.ratio));
    }
  }

  const alphaBounds = findAlphaBounds(image, options.alphaThreshold);
  const cornersTransparent = cornerAlphas(image).every((alpha) => alpha <= options.alphaThreshold);
  if (!cornersTransparent) {
    errors.push(failure("corners", "All four canvas corners must be transparent", cornerAlphas(image), `<= ${options.alphaThreshold}`));
  }

  if (!alphaBounds) {
    errors.push(failure("empty_alpha", "PNG has no visible pixels above the Alpha threshold", null, `> ${options.alphaThreshold}`));
  }

  const margins = alphaBounds ? {
    left: alphaBounds.left,
    top: alphaBounds.top,
    right: image.width - 1 - alphaBounds.right,
    bottom: image.height - 1 - alphaBounds.bottom
  } : null;

  if (margins) {
    for (const side of ["left", "right", "top", "bottom"]) {
      const minimum = options[`min${capitalize(side)}`];
      if (margins[side] < minimum) {
        errors.push(failure(`margin_${side}`, `Alpha ${side} margin must be at least ${minimum}px, got ${margins[side]}px`, margins[side], minimum));
      }
    }

    if (options.minVisibleHeightRatio > 0) {
      const visibleHeightRatio = (alphaBounds.bottom - alphaBounds.top + 1) / image.height;
      if (visibleHeightRatio < options.minVisibleHeightRatio) {
        errors.push(failure(
          "visible_height_ratio",
          `Visible Alpha height ratio must be at least ${options.minVisibleHeightRatio}, got ${round(visibleHeightRatio)}`,
          round(visibleHeightRatio),
          options.minVisibleHeightRatio
        ));
      }
    }
  }

  const safeArea = buildSafeArea(image.width, options, errors);
  return {
    ok: errors.length === 0,
    image: {
      width: image.width,
      height: image.height,
      ratio: round(image.width / image.height),
      encoding: "rgba8"
    },
    alphaBounds,
    margins,
    safeArea,
    cornersTransparent,
    alphaThreshold: options.alphaThreshold,
    errors
  };
}

function findAlphaBounds({ width, height, pixels }, threshold) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * BYTES_PER_PIXEL + 3];
      if (alpha <= threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right >= left && bottom >= top ? { left, top, right, bottom } : null;
}

function cornerAlphas({ width, height, pixels }) {
  return [
    alphaAt(pixels, width, 0, 0),
    alphaAt(pixels, width, width - 1, 0),
    alphaAt(pixels, width, 0, height - 1),
    alphaAt(pixels, width, width - 1, height - 1)
  ];
}

function alphaAt(pixels, width, x, y) {
  return pixels[(y * width + x) * BYTES_PER_PIXEL + 3];
}

function buildSafeArea(width, options, errors) {
  if (options.safeLeft === null && options.safeRight === null) return null;
  if (options.safeLeft === null || options.safeRight === null) {
    errors.push(failure("safe_area_pair", "Provide both --safe-left and --safe-right", null, "paired bounds"));
    return null;
  }
  if (options.safeLeft < 0 || options.safeRight > width || options.safeRight <= options.safeLeft) {
    errors.push(failure(
      "safe_area_bounds",
      `Safe area must satisfy 0 <= left < right <= ${width}`,
      { left: options.safeLeft, right: options.safeRight },
      { min: 0, max: width }
    ));
    return null;
  }
  const safeWidth = options.safeRight - options.safeLeft;
  const ratio = safeWidth / width;
  if (ratio < options.minSafeRatio) {
    errors.push(failure(
      "safe_area_ratio",
      `Safe area ratio must be at least ${options.minSafeRatio}, got ${round(ratio)}`,
      round(ratio),
      options.minSafeRatio
    ));
  }
  return { left: options.safeLeft, right: options.safeRight, width: safeWidth, ratio: round(ratio) };
}

function normalizeOptions(options) {
  return {
    width: optionalNumber(options.width),
    height: optionalNumber(options.height),
    ratio: optionalNumber(options.ratio),
    ratioTolerance: numberOr(options.ratioTolerance, 0.0001),
    alphaThreshold: numberOr(options.alphaThreshold, 0),
    minLeft: numberOr(options.minLeft, 0),
    minRight: numberOr(options.minRight, 0),
    minTop: numberOr(options.minTop, 0),
    minBottom: numberOr(options.minBottom, 0),
    safeLeft: optionalNumber(options.safeLeft),
    safeRight: optionalNumber(options.safeRight),
    minSafeRatio: numberOr(options.minSafeRatio, 0),
    minVisibleHeightRatio: numberOr(options.minVisibleHeightRatio, 0)
  };
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function failure(code, message, actual, expected) {
  return { code, message, actual, expected };
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}

function round(value) {
  return Math.round(value * 1000000) / 1000000;
}

function parseCli(argv) {
  const options = {};
  let inputPath = null;
  let jsonPath = null;
  const keys = {
    "--width": "width",
    "--height": "height",
    "--ratio": "ratio",
    "--ratio-tolerance": "ratioTolerance",
    "--alpha-threshold": "alphaThreshold",
    "--min-left": "minLeft",
    "--min-right": "minRight",
    "--min-top": "minTop",
    "--min-bottom": "minBottom",
    "--safe-left": "safeLeft",
    "--safe-right": "safeRight",
    "--min-safe-ratio": "minSafeRatio",
    "--min-visible-height-ratio": "minVisibleHeightRatio"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--json") {
      jsonPath = argv[++index];
      if (!jsonPath) throw new Error("--json requires a path");
    } else if (keys[value]) {
      const rawNumber = argv[++index];
      const parsedNumber = Number(rawNumber);
      if (!rawNumber || !Number.isFinite(parsedNumber)) throw new Error(`${value} requires a finite number`);
      options[keys[value]] = parsedNumber;
    } else if (!value.startsWith("-") && !inputPath) {
      inputPath = value;
    } else {
      throw new Error(`Unknown or incomplete argument: ${value}`);
    }
  }
  return { inputPath, jsonPath, options };
}

async function main() {
  let parsed;
  try {
    parsed = parseCli(process.argv.slice(2));
    if (!parsed.inputPath) throw new Error("Missing PNG path");
  } catch (error) {
    console.error(error.message);
    console.error("Usage: node validate_nameplate_asset.mjs <asset.png> [--width N --height N --min-left N --min-right N --min-top N --min-bottom N --safe-left N --safe-right N --min-safe-ratio N --json report.json]");
    process.exitCode = 2;
    return;
  }

  const absoluteInput = path.resolve(parsed.inputPath);
  const report = {
    file: absoluteInput,
    ...validateNameplateAsset(fs.readFileSync(absoluteInput), parsed.options)
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (parsed.jsonPath) {
    const absoluteJson = path.resolve(parsed.jsonPath);
    fs.mkdirSync(path.dirname(absoluteJson), { recursive: true });
    fs.writeFileSync(absoluteJson, output);
  }
  process.stdout.write(output);
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
