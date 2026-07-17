import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { encodeRgbaPng } from "./pngTrim.mjs";
import { validateNameplateAsset } from "../.agents/skills/create-character-nameplate/scripts/validate_nameplate_asset.mjs";
import { prepareNameplatePreview } from "../.agents/skills/create-character-nameplate/scripts/prepare_nameplate_preview.mjs";

const SKILL_ROOT = path.resolve(".agents/skills/create-character-nameplate");
const TEMP_TASK = path.resolve(".trellis/tasks/__character-nameplate-skill-test");

afterEach(() => {
  fs.rmSync(TEMP_TASK, { recursive: true, force: true });
});

describe("create-character-nameplate Skill", () => {
  it("declares the project workflow, human gate, two modes, and safe data boundary", () => {
    const skill = fs.readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8");
    const metadata = fs.readFileSync(path.join(SKILL_ROOT, "agents/openai.yaml"), "utf8");

    expect(skill).toContain("name: create-character-nameplate");
    expect(skill).toContain("### Mandatory human gate");
    expect(skill).toContain("After presenting four concepts, stop");
    expect(skill).toContain("`new`");
    expect(skill).toContain("`refine`");
    expect(skill).toContain("out of scope unless the user explicitly requests");
    expect(skill).toContain("Animate only `transform` and `opacity`");
    expect(skill).toContain("prefers-reduced-motion");
    expect(metadata).toContain("$create-character-nameplate");
    expect(metadata).not.toContain("使用 -character-nameplate");
  });

  it("keeps the reusable references and templates complete but character-neutral", () => {
    const input = fs.readFileSync(path.join(SKILL_ROOT, "references/input-and-visual-language.md"), "utf8");
    const asset = fs.readFileSync(path.join(SKILL_ROOT, "references/asset-and-motion-contract.md"), "utf8");
    const qa = fs.readFileSync(path.join(SKILL_ROOT, "references/integration-and-qa.md"), "utf8");
    const owner = fs.readFileSync(path.join(SKILL_ROOT, "assets/templates/nameplate-owner.css"), "utf8");
    const motion = fs.readFileSync(path.join(SKILL_ROOT, "assets/templates/nameplate-motion.css"), "utf8");

    expect(input).toContain("Color-only variants are not four directions");
    expect(input).toContain("## Human selection gate");
    expect(asset).toContain("Persistent primary light");
    expect(asset).toContain("there is no light, only blinking");
    expect(qa).toContain("Home plaque");
    expect(qa).toContain("375x812");
    expect(owner).toContain('[data-nameplate-id="__ASSET_ID__"]');
    expect(owner).toContain("--user-nameplate-scale");
    expect(owner).toContain("pointer-events: none");
    expect(motion).toContain("@media (prefers-reduced-motion: reduce)");
    expect(motion).not.toMatch(/filter:|box-shadow:|width:|height:/);
    expect(`${owner}\n${motion}`).not.toContain("reward-sigrika-spark-100-wins-nameplate");
  });

  it("accepts a valid RGBA canvas and reports measured Alpha geometry", () => {
    const png = fixturePng({ width: 100, height: 20, left: 5, top: 2, right: 94, bottom: 17 });
    const report = validateNameplateAsset(png, {
      width: 100,
      height: 20,
      ratio: 5,
      minLeft: 5,
      minRight: 5,
      minTop: 2,
      minBottom: 2,
      safeLeft: 28,
      safeRight: 88,
      minSafeRatio: 0.5,
      minVisibleHeightRatio: 0.75
    });

    expect(report.ok).toBe(true);
    expect(report.image).toMatchObject({ width: 100, height: 20, ratio: 5, encoding: "rgba8" });
    expect(report.alphaBounds).toEqual({ left: 5, top: 2, right: 94, bottom: 17 });
    expect(report.margins).toEqual({ left: 5, top: 2, right: 5, bottom: 2 });
    expect(report.safeArea).toEqual({ left: 28, right: 88, width: 60, ratio: 0.6 });
  });

  it("rejects raster-edge clipping and an undersized declared username area", () => {
    const png = fixturePng({ width: 100, height: 20, left: 0, top: 2, right: 96, bottom: 17 });
    const report = validateNameplateAsset(png, {
      width: 100,
      height: 20,
      minLeft: 5,
      minRight: 5,
      minTop: 2,
      minBottom: 2,
      safeLeft: 40,
      safeRight: 70,
      minSafeRatio: 0.5
    });

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "margin_left",
      "margin_right",
      "safe_area_ratio"
    ]));
  });

  it("rejects wrong dimensions and a fully transparent asset", () => {
    const png = fixturePng({ width: 90, height: 20, left: 2, top: 2, right: 1, bottom: 1 });
    const report = validateNameplateAsset(png, { width: 100, height: 20 });

    expect(report.ok).toBe(false);
    expect(report.errors.map((error) => error.code)).toEqual(expect.arrayContaining(["width", "empty_alpha"]));
  });

  it("generates a task-local preview without registering a production route", () => {
    fs.mkdirSync(TEMP_TASK, { recursive: true });
    fs.writeFileSync(path.join(TEMP_TASK, "task.json"), JSON.stringify({ id: "test" }));

    const result = prepareNameplatePreview({
      taskDir: path.relative(process.cwd(), TEMP_TASK),
      assetId: "reward-example-nameplate",
      imageUrl: "/assets/achievements/example-nameplate.png"
    });
    const config = fs.readFileSync(path.join(result.previewDir, "src/preview-config.js"), "utf8");
    const imports = fs.readFileSync(path.join(result.previewDir, "src/generated-imports.css"), "utf8");
    const previewSource = fs.readFileSync(path.join(result.previewDir, "src/main.jsx"), "utf8");
    const routes = fs.readFileSync("src/app/AppRoutes.jsx", "utf8");

    expect(result.relativePreviewDir).toContain(".trellis/tasks/__character-nameplate-skill-test/nameplate-preview");
    expect(config).toContain("reward-example-nameplate");
    expect(imports).toContain('@import "/src/styles.css";');
    expect(previewSource).toContain('from "/src/shared/UserIdentity.jsx"');
    expect(previewSource).toContain("LegacyUsernameThatNeedsEllipsis");
    expect(routes).not.toContain("nameplate-preview");
  });

  it("declares fixed viewport and reduced-motion capture evidence", () => {
    const capture = fs.readFileSync(path.join(SKILL_ROOT, "scripts/capture_nameplate_preview.mjs"), "utf8");

    expect(capture).toContain('name: "desktop-1440x900"');
    expect(capture).toContain('name: "narrow-1024x768"');
    expect(capture).toContain('name: "phone-375x812"');
    expect(capture).toContain('["no-preference", "reduce"]');
    expect(capture).toContain("windowsHide: true");
    expect(capture).toContain("SYSTEM_BROWSER_CANDIDATES");
    expect(capture).toContain("playwright-chromium");
  });
});

function fixturePng({ width, height, left, top, right, bottom }) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const offset = (y * width + x) * 4;
      pixels[offset] = 120;
      pixels[offset + 1] = 70;
      pixels[offset + 2] = 190;
      pixels[offset + 3] = 255;
    }
  }
  return encodeRgbaPng({ width, height, pixels });
}
