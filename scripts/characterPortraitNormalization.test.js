import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  CHARACTER_PORTRAIT_ASSETS,
  COSTUME_PORTRAIT_ASSETS,
  DENIA_CANDY_PORTRAIT_ASSET
} from "../src/shared/characterPortraitAssetCatalog.js";
import {
  PORTRAIT_CANVAS_SIZE,
  PORTRAIT_MARGIN,
  PORTRAIT_SAFE_SIZE,
  alphaBounds,
  normalizePortraitBuffer,
  portraitUrlToFilePath,
  validateNormalizedPortrait
} from "./characterPortraitNormalization.mjs";
import {
  discoverConfiguredPortraitAssets,
  processConfiguredPortraitAssets
} from "./normalize-character-portraits.mjs";

describe("character portrait normalization", () => {
  it("trims alpha, preserves aspect ratio, and anchors the subject bottom-center", async () => {
    const source = await testPortrait({ width: 240, height: 300, left: 20, top: 30, subjectWidth: 100, subjectHeight: 200 });
    const normalized = await normalizePortraitBuffer(source);
    const validation = await validateNormalizedPortrait(normalized.buffer);

    expect(validation.ok).toBe(true);
    expect(validation.metadata).toMatchObject({
      format: "webp",
      width: PORTRAIT_CANVAS_SIZE,
      height: PORTRAIT_CANVAS_SIZE,
      hasAlpha: true
    });
    expect(validation.bounds).toMatchObject({
      width: Math.round(PORTRAIT_SAFE_SIZE / 2),
      height: PORTRAIT_SAFE_SIZE,
      bottom: PORTRAIT_CANVAS_SIZE - PORTRAIT_MARGIN - 1
    });
  });

  it("is pixel- and byte-idempotent after the first normalization", async () => {
    const source = await testPortrait({ width: 300, height: 200, left: 40, top: 20, subjectWidth: 180, subjectHeight: 100 });
    const first = await normalizePortraitBuffer(source);
    const second = await normalizePortraitBuffer(first.buffer);

    expect(second.buffer.equals(first.buffer)).toBe(true);
  });

  it("preserves animated WebP frames, timing, loop, and one shared placement", async () => {
    const source = await testAnimatedPortrait();
    const normalized = await normalizePortraitBuffer(source);
    const validation = await validateNormalizedPortrait(normalized.buffer, {
      requireAnimation: true
    });

    expect(validation.ok).toBe(true);
    expect(validation.animation).toMatchObject({
      pages: 2,
      pageHeight: PORTRAIT_CANVAS_SIZE,
      delay: [40, 80],
      loop: 2
    });
    expect(normalized.animation).toEqual({
      pages: 2,
      delay: [40, 80],
      loop: 2
    });
    expect(Math.max(validation.bounds.width, validation.bounds.height)).toBe(PORTRAIT_SAFE_SIZE);

    const second = await normalizePortraitBuffer(normalized.buffer);
    expect(second.buffer.equals(normalized.buffer)).toBe(true);
  });

  it("rejects a static portrait when its asset contract requires animation", async () => {
    const source = await testPortrait({
      width: 200,
      height: 240,
      left: 40,
      top: 30,
      subjectWidth: 100,
      subjectHeight: 180
    });
    const normalized = await normalizePortraitBuffer(source);
    const validation = await validateNormalizedPortrait(normalized.buffer, {
      requireAnimation: true
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain("expected an animated portrait with at least 2 frames");
  });

  it("rejects opaque, empty, and non-normalized assets", async () => {
    const opaque = await sharp({
      create: { width: 20, height: 20, channels: 3, background: "#f00" }
    }).png().toBuffer();
    const empty = await sharp({
      create: { width: 20, height: 20, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).png().toBuffer();
    const ordinary = await testPortrait({ width: 100, height: 100, left: 10, top: 10, subjectWidth: 80, subjectHeight: 80 });

    await expect(alphaBounds(opaque)).rejects.toThrow("alpha channel");
    await expect(alphaBounds(empty)).rejects.toThrow("no visible pixels");
    await expect(validateNormalizedPortrait(ordinary)).resolves.toMatchObject({ ok: false });
  });

  it("discovers local, remote, fallback, and candy portraits without duplicates", () => {
    const assets = discoverConfiguredPortraitAssets({
      characters: [
        { slug: "one", portraitUrl: "/assets/characters/one.webp" },
        { slug: "remote", portraitUrl: "https://example.com/remote.webp" }
      ],
      fallbackCharacters: {
        one: { id: "one", portrait: "/assets/characters/one.webp" }
      },
      costumes: [{
        id: "costume-one",
        portraitUrl: "/assets/costumes/one.webp",
        candyEffectPortraitUrl: "/assets/costumes/one-candy.webp"
      }],
      baseCandyPortraitUrl: "/assets/characters/base-candy.webp"
    });

    expect(assets.map((asset) => asset.url)).toEqual([
      "/assets/characters/base-candy.webp",
      "/assets/characters/one.webp",
      "/assets/costumes/one-candy.webp",
      "/assets/costumes/one.webp",
      "https://example.com/remote.webp"
    ]);
    expect(assets.find((asset) => asset.url.endsWith("/one.webp")).owners).toHaveLength(2);
  });

  it("covers every committed built-in character, costume, and candy portrait", () => {
    const assets = discoverConfiguredPortraitAssets();
    const urls = new Set(assets.map((asset) => asset.url));
    const expectedUrls = [
      ...Object.values(CHARACTER_PORTRAIT_ASSETS).map((asset) => asset.url),
      ...Object.values(COSTUME_PORTRAIT_ASSETS).map((asset) => asset.url),
      DENIA_CANDY_PORTRAIT_ASSET.url
    ];

    expect(assets).toHaveLength(expectedUrls.length);
    expect(urls).toEqual(new Set(expectedUrls));
    expect(expectedUrls.every((url) => url.endsWith(".webp"))).toBe(true);
    expect(assets.find((asset) => asset.url === DENIA_CANDY_PORTRAIT_ASSET.url))
      .toMatchObject({ requiresAnimation: true });
  });

  it("keeps the committed Denia candy portrait at its authored animation timing", async () => {
    const publicRoot = path.join(process.cwd(), "public");
    const assetPath = portraitUrlToFilePath(DENIA_CANDY_PORTRAIT_ASSET.url, publicRoot);
    const validation = await validateNormalizedPortrait(await fs.readFile(assetPath), {
      requireAnimation: true
    });

    expect(validation.ok).toBe(true);
    expect(validation.animation).toMatchObject({
      pages: 16,
      pageHeight: PORTRAIT_CANVAS_SIZE,
      loop: 0
    });
    expect(validation.animation.delay).toEqual(Array(16).fill(70));
  });

  it("skips remote URLs without trying to read or write them", async () => {
    const logs = [];
    const results = await processConfiguredPortraitAssets({
      mode: "check",
      publicRoot: path.join(os.tmpdir(), "missing-portrait-root"),
      assets: [{ url: "https://example.com/portrait.webp", owners: ["test"], legacySourceUrl: "" }],
      log: (message) => logs.push(message)
    });

    expect(results).toEqual([expect.objectContaining({ status: "skipped-remote" })]);
    expect(logs).toEqual(["SKIP remote https://example.com/portrait.webp"]);
  });

  it("reports a missing local source without aborting the remaining batch", async () => {
    const publicRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sigrikago-portrait-missing-"));
    const results = await processConfiguredPortraitAssets({
      mode: "write",
      publicRoot,
      assets: [{
        url: "/assets/characters/missing.webp",
        owners: ["test"],
        legacySourceUrl: "/assets/legacy/missing.png"
      }],
      log: () => {}
    });

    expect(results).toEqual([
      expect.objectContaining({
        status: "invalid",
        errors: ["No source file found for /assets/characters/missing.webp"]
      })
    ]);
  });

  it("writes and validates repository portraits from a legacy source", async () => {
    const publicRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sigrikago-portrait-"));
    const legacyUrl = "/assets/legacy/source.png";
    const outputUrl = "/assets/characters/output.webp";
    const legacyPath = portraitUrlToFilePath(legacyUrl, publicRoot);
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.writeFile(legacyPath, await testPortrait({
      width: 120,
      height: 150,
      left: 10,
      top: 20,
      subjectWidth: 80,
      subjectHeight: 110
    }));

    const assets = [{ url: outputUrl, owners: ["test"], legacySourceUrl: legacyUrl }];
    const writeResults = await processConfiguredPortraitAssets({
      mode: "write",
      publicRoot,
      assets,
      log: () => {}
    });
    const checkResults = await processConfiguredPortraitAssets({
      mode: "check",
      publicRoot,
      assets,
      log: () => {}
    });

    expect(writeResults).toEqual([expect.objectContaining({ status: "valid" })]);
    expect(checkResults).toEqual([expect.objectContaining({ status: "valid" })]);
  });

  it("rebuilds a required animation from its legacy source when the output is static", async () => {
    const publicRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sigrikago-portrait-animation-"));
    const legacyUrl = "/assets/legacy/animated.webp";
    const outputUrl = "/assets/characters/animated.webp";
    const legacyPath = portraitUrlToFilePath(legacyUrl, publicRoot);
    const outputPath = portraitUrlToFilePath(outputUrl, publicRoot);
    await fs.mkdir(path.dirname(legacyPath), { recursive: true });
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(legacyPath, await testAnimatedPortrait());
    await fs.writeFile(outputPath, (await normalizePortraitBuffer(await testPortrait({
      width: 100,
      height: 100,
      left: 10,
      top: 10,
      subjectWidth: 80,
      subjectHeight: 80
    }))).buffer);

    const assets = [{
      url: outputUrl,
      owners: ["test"],
      legacySourceUrl: legacyUrl,
      requiresAnimation: true
    }];
    const results = await processConfiguredPortraitAssets({
      mode: "write",
      publicRoot,
      assets,
      log: () => {}
    });
    const output = await fs.readFile(outputPath);
    const validation = await validateNormalizedPortrait(output, { requireAnimation: true });

    expect(results).toEqual([expect.objectContaining({ status: "valid" })]);
    expect(validation.animation).toMatchObject({
      pages: 2,
      delay: [40, 80],
      loop: 2
    });
  });
});

async function testPortrait({ width, height, left, top, subjectWidth, subjectHeight }) {
  const subject = await sharp({
    create: {
      width: subjectWidth,
      height: subjectHeight,
      channels: 4,
      background: { r: 235, g: 94, b: 121, alpha: 1 }
    }
  }).png().toBuffer();
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: subject, left, top }])
    .png()
    .toBuffer();
}

async function testAnimatedPortrait() {
  const frames = await Promise.all([
    testPortrait({
      width: 120,
      height: 140,
      left: 20,
      top: 20,
      subjectWidth: 60,
      subjectHeight: 100
    }),
    testPortrait({
      width: 120,
      height: 140,
      left: 28,
      top: 15,
      subjectWidth: 60,
      subjectHeight: 100
    })
  ]);
  return sharp(frames, { join: { animated: true } })
    .webp({ quality: 90, alphaQuality: 100, delay: [40, 80], loop: 2 })
    .toBuffer();
}
