import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CSS_BREAKPOINT_CONTRACT,
  CSS_DEBT_BASELINE,
  CSS_FORBIDDEN_BROAD_FALLBACKS,
  CSS_FINAL_MOBILE_SAFETY_SPLITS,
  CSS_FULL_REPO_CLEANUP_VERIFICATION_GATES,
  CSS_GAMEPLAY_ROOM_SPLITS,
  CSS_LAZY_ROUTE_STYLE_ENTRIES,
  CSS_LAYER_GROUPS,
  CSS_MOTION_CONTRACT,
  CSS_PROTECTED_SURFACES,
  CSS_REFACTOR_ROUNDS,
  CSS_ROUND3_SHARED_SPLITS,
  CSS_ROUND4_REGRESSION_CHECKS,
  CSS_SKILL_PRESENTATION_SPLITS,
  CSS_TAILWIND_MIGRATION_EXCLUSIONS,
  CSS_TAILWIND_MIGRATION_PHASES,
  CSS_THEME_OVERLAY_SPLITS,
  CSS_UTILITY_LAYER_DECISION,
  CSS_Z_INDEX_CONTRACT,
  inventoryFilesForGroup
} from "./cssLayerInventory.js";
import { readCssWithImports } from "./cssTestUtils.js";

const stylesDir = dirname(fileURLToPath(new URL("./base.css", import.meta.url)));
const projectRoot = dirname(dirname(stylesDir));
const rootStylesPath = fileURLToPath(new URL("../styles.css", import.meta.url));

function cssImports(source) {
  return [...source.matchAll(/@import\s+"([^"]+)"[^;]*;/g)].map((match) => match[1]);
}

function cssSourceFor(files) {
  return files.map((filePath) => readFileSync(join(stylesDir, filePath), "utf8")).join("\n");
}

function concreteCssAfterImports(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import\s+"[^"]+"[^;]*;\s*/g, "")
    .trim();
}

function cssMetricFiles() {
  function cssFilesUnder(dir) {
    return readdirSync(dir).flatMap((entry) => {
      const fullPath = join(dir, entry);

      if (statSync(fullPath).isDirectory()) return cssFilesUnder(fullPath);
      return entry.endsWith(".css") ? [fullPath] : [];
    });
  }

  return cssFilesUnder(stylesDir).map((filePath) => ({
    path: relative(stylesDir, filePath).replaceAll("\\", "/"),
    source: readFileSync(filePath, "utf8")
  }));
}

function cssDebtMetrics() {
  const files = cssMetricFiles();
  const importantFiles = files.filter(({ source }) => source.includes("!important"));
  const hardcodedHexMatches = files.flatMap(({ path, source }) =>
    [...source.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => ({ path, value: match[0] }))
  );
  const mediaFiles = files.filter(({ source }) => /@media\b/.test(source));
  const reducedMotionFiles = files.filter(({ source }) => source.includes("prefers-reduced-motion"));
  const highZIndexDeclarations = files.flatMap(({ path, source }) =>
    [...source.matchAll(/z-index:\s*(\d+)/g)]
      .map((match) => ({ path, value: Number(match[1]) }))
      .filter(({ value }) => value >= CSS_Z_INDEX_CONTRACT.highValueThreshold)
  );

  return {
    totalFiles: files.length,
    totalBytes: files.reduce((sum, { source }) => sum + Buffer.byteLength(source.replace(/\r\n/g, "\n"), "utf8"), 0),
    importantCount: files.reduce((sum, { source }) => sum + (source.match(/!important/g) ?? []).length, 0),
    importantFiles: importantFiles.length,
    hardcodedHexCount: hardcodedHexMatches.length,
    mediaFiles: mediaFiles.length,
    reducedMotionFiles: reducedMotionFiles.length,
    highZIndexFiles: new Set(highZIndexDeclarations.map(({ path }) => path)).size,
    highZIndexDeclarations
  };
}

function cssMediaQueries() {
  return cssMetricFiles().flatMap(({ path, source }) =>
    [...source.matchAll(/@media\s*([^{]+)\{/g)].map((match) => ({
      path,
      query: match[1].trim().replace(/\s+/g, " ")
    }))
  );
}

function expectedRelativeImports(split) {
  return split.files.map((filePath) => {
    const [, ...nestedPath] = filePath.split("/");
    const entryDirectory = split.entry.split("/").slice(0, -1);
    const relativeParts = nestedPath.slice(entryDirectory.length - 1);

    return `./${relativeParts.join("/")}`;
  });
}

describe("CSS layer inventory", () => {
  it("records the current CSS debt baseline as a non-growth contract", () => {
    const actual = cssDebtMetrics();
    const baselineKeys = [
      "totalFiles",
      "totalBytes",
      "importantCount",
      "importantFiles",
      "hardcodedHexCount",
      "mediaFiles",
      "reducedMotionFiles",
      "highZIndexFiles"
    ];

    expect(CSS_DEBT_BASELINE.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(CSS_DEBT_BASELINE.scope).toContain("src/styles");

    for (const key of baselineKeys) {
      expect(actual[key], key).toBeLessThanOrEqual(CSS_DEBT_BASELINE.metrics[key]);
    }

    expect(CSS_DEBT_BASELINE.guidance).toContain("non-growth");
    expect(CSS_DEBT_BASELINE.guidance).toContain("visual drift");
  });

  it("registers high z-index declarations and keeps future values on a named layer scale", () => {
    const actual = cssDebtMetrics();
    const registered = new Set(
      CSS_Z_INDEX_CONTRACT.legacyHighValues.map(({ file, value }) => `${file}:${value}`)
    );
    const unregistered = actual.highZIndexDeclarations
      .filter(({ path, value }) => !registered.has(`${path}:${value}`))
      .map(({ path, value }) => `${path}:${value}`);

    expect(CSS_Z_INDEX_CONTRACT.highValueThreshold).toBe(1000);
    expect(CSS_Z_INDEX_CONTRACT.layers.map((layer) => layer.name)).toEqual([
      "base",
      "raised",
      "floating",
      "modal",
      "system"
    ]);
    expect(CSS_Z_INDEX_CONTRACT.guidance).toContain("--room-floating-z");
    expect(unregistered).toEqual([]);
  });

  it("documents motion tokens and verifies reduced-motion coverage exists in each motion-heavy family", () => {
    const allFiles = new Set(cssMetricFiles().map(({ path }) => path));
    const missingTokenFragments = CSS_MOTION_CONTRACT.requiredTokenFragments.filter((fragment) => {
      const tokenSources = CSS_MOTION_CONTRACT.tokenFiles.map((filePath) =>
        readFileSync(join(stylesDir, filePath), "utf8")
      );
      return !tokenSources.some((source) => source.includes(fragment));
    });
    const missingReducedMotionFiles = CSS_MOTION_CONTRACT.reducedMotionFiles
      .filter((filePath) => !allFiles.has(filePath))
      .map((filePath) => `missing file: ${filePath}`);
    const missingReducedMotionFragments = CSS_MOTION_CONTRACT.reducedMotionFiles
      .filter((filePath) => allFiles.has(filePath))
      .filter((filePath) => !readFileSync(join(stylesDir, filePath), "utf8").includes("prefers-reduced-motion"))
      .map((filePath) => `missing prefers-reduced-motion: ${filePath}`);

    expect(CSS_MOTION_CONTRACT.durationRangeMs).toEqual({ micro: [100, 180], sheet: [180, 420] });
    expect(CSS_MOTION_CONTRACT.guidance).toContain("transform");
    expect(CSS_MOTION_CONTRACT.guidance).toContain("opacity");
    expect([...missingTokenFragments, ...missingReducedMotionFiles, ...missingReducedMotionFragments]).toEqual([]);
  });

  it("registers responsive breakpoint families used by current CSS media queries", () => {
    const queries = cssMediaQueries();
    const allowedFragments = CSS_BREAKPOINT_CONTRACT.allowedQueryFragments;
    const unexpectedQueries = queries
      .filter(({ query }) => !allowedFragments.some((fragment) => query.includes(fragment)))
      .map(({ path, query }) => `${path}: ${query}`);

    expect(CSS_BREAKPOINT_CONTRACT.guidance).toContain("desktop");
    expect(CSS_BREAKPOINT_CONTRACT.guidance).toContain("mobile");
    expect(CSS_BREAKPOINT_CONTRACT.viewportChecks).toEqual([
      "375px phone portrait",
      "small phone landscape",
      "narrow desktop",
      "regular desktop"
    ]);
    expect(unexpectedQueries).toEqual([]);
  });

  it("keeps every inventory file pointed at an existing CSS file", () => {
    const inventoryFiles = new Set([
      ...CSS_LAYER_GROUPS.flatMap((group) => group.entries),
      ...CSS_LAZY_ROUTE_STYLE_ENTRIES.map((entry) => entry.entry),
      ...CSS_PROTECTED_SURFACES.flatMap((surface) => surface.files)
    ]);
    const missingFiles = [...inventoryFiles].filter((filePath) => !existsSync(join(stylesDir, filePath)));

    expect(missingFiles).toEqual([]);
  });

  it("classifies every root stylesheet import into a refactor layer", () => {
    const rootImports = cssImports(readFileSync(rootStylesPath, "utf8"))
      .map((importPath) => importPath.replace("./styles/", ""));
    const classifiedRootEntries = new Set(CSS_LAYER_GROUPS.flatMap((group) => group.rootEntries));

    expect(rootImports.filter((importPath) => !classifiedRootEntries.has(importPath))).toEqual([]);
  });

  it("documents route-lazy CSS entries outside the initial root stylesheet", () => {
    const rootImports = cssImports(readFileSync(rootStylesPath, "utf8"))
      .map((importPath) => importPath.replace("./styles/", ""));

    for (const routeEntry of CSS_LAZY_ROUTE_STYLE_ENTRIES) {
      expect(rootImports).not.toContain(routeEntry.entry);
      expect(existsSync(join(stylesDir, routeEntry.entry))).toBe(true);
      expect(readFileSync(join(projectRoot, routeEntry.owner), "utf8")).toContain(
        `import "${routeEntry.importPath}";`
      );
      expect(routeEntry.reason).toContain("lazy");
    }
  });

  it("keeps the round-3 cleanup candidates out of gameplay and skill protected files", () => {
    const round3Candidates = new Set(inventoryFilesForGroup("reorganizable-shared-domains"));
    const protectedFiles = new Set([
      ...inventoryFilesForGroup("high-risk-gameplay-room"),
      ...inventoryFilesForGroup("skill-presentation-protected"),
      ...CSS_PROTECTED_SURFACES.flatMap((surface) => surface.files)
    ]);

    expect([...round3Candidates].filter((filePath) => protectedFiles.has(filePath))).toEqual([]);
    expect(round3Candidates.has("room.css")).toBe(false);
    expect(round3Candidates.has("mobile-room.css")).toBe(false);
    expect(round3Candidates.has("room-terminal.css")).toBe(false);
  });

  it("documents the required refactor rounds before visual cleanup", () => {
    expect(CSS_REFACTOR_ROUNDS.map((round) => round.round)).toEqual([2, 3, 4]);
    expect(CSS_REFACTOR_ROUNDS[0].focus).toContain("Inventory");
    expect(CSS_REFACTOR_ROUNDS[1].allowedWork).toContain("split import-only shared domains");
    expect(CSS_REFACTOR_ROUNDS[2].allowedWork).toContain("board skill presentation verification");
  });

  it("documents the low-intrusion Tailwind utility layer decision", () => {
    const rootImports = cssImports(readFileSync(rootStylesPath, "utf8"))
      .map((importPath) => importPath.replace("./styles/", ""));
    const tailwindSource = readFileSync(join(stylesDir, CSS_UTILITY_LAYER_DECISION.entry), "utf8");
    const tokenImport = CSS_UTILITY_LAYER_DECISION.localImports[0];
    const tokenSource = readFileSync(join(stylesDir, tokenImport.entry), "utf8");

    expect(CSS_UTILITY_LAYER_DECISION.vitePlugin).toBe("@tailwindcss/vite");
    expect(CSS_UTILITY_LAYER_DECISION.rootOrder).toEqual({ after: "hud-components.css", before: "themes.css" });
    expect(rootImports.indexOf(CSS_UTILITY_LAYER_DECISION.entry)).toBe(
      rootImports.indexOf(CSS_UTILITY_LAYER_DECISION.rootOrder.before) - 1
    );
    expect(rootImports[rootImports.indexOf(CSS_UTILITY_LAYER_DECISION.entry) - 1]).toBe(
      CSS_UTILITY_LAYER_DECISION.rootOrder.after
    );
    expect(cssImports(tailwindSource)).toEqual([
      "tailwindcss/theme.css",
      tokenImport.source,
      "tailwindcss/utilities.css"
    ]);

    for (const importRule of CSS_UTILITY_LAYER_DECISION.imports) {
      const sourceSuffix = importRule.scanSource ? ` source("${importRule.scanSource}")` : "";
      expect(tailwindSource).toContain(
        `@import "${importRule.source}" layer(${importRule.layer}) prefix(${importRule.prefix})${sourceSuffix};`
      );
    }

    for (const omittedImport of CSS_UTILITY_LAYER_DECISION.omittedImports) {
      expect(tailwindSource).not.toContain(omittedImport);
      expect(tokenSource).not.toContain(omittedImport);
    }

    expect(tailwindSource).toContain(`@import "${tokenImport.source}";`);
    expect(tokenImport.reason).toContain("Phase 1");
    expect(tokenSource).toContain("@theme inline");
    expect(tokenSource).not.toContain("@import");

    expect(CSS_UTILITY_LAYER_DECISION.phase2Pilots).toEqual([
      expect.objectContaining({
        surface: "AdminAudit table shell",
        file: "src/admin/AdminAudit.jsx",
        utilities: ["tw:max-w-full", "tw:overflow-x-auto"],
        replacedCss: "src/styles/admin/audit-feedback.css .audit-table-wrap"
      })
    ]);

    expect(CSS_UTILITY_LAYER_DECISION.phase3Primitives).toEqual([
      expect.objectContaining({
        primitive: "ScrollArea",
        file: "src/ui/primitives/ScrollArea.jsx",
        utilities: ["tw:max-w-full", "tw:overflow-x-auto"],
        firstConsumer: "src/admin/AdminAudit.jsx"
      }),
      expect.objectContaining({
        primitive: "AdminTableScroll",
        file: "src/admin/adminComponents.jsx",
        utilities: ["tw:max-w-full", "tw:overflow-x-auto"],
        firstConsumer: "src/admin/AdminAudit.jsx"
      }),
      expect.objectContaining({
        primitive: "Badge",
        file: "src/ui/primitives/Badge.jsx",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center"],
        firstConsumer: "src/admin/adminComponents.jsx"
      }),
      expect.objectContaining({
        primitive: "EmptyState",
        file: "src/ui/primitives/EmptyState.jsx",
        utilities: ["tw:text-center", "tw:px-3", "tw:py-6"],
        firstConsumer: "src/admin/adminComponents.jsx"
      }),
      expect.objectContaining({
        primitive: "Button",
        file: "src/ui/primitives/Button.jsx",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        firstConsumer: "src/admin/adminComponents.jsx"
      }),
      expect.objectContaining({
        primitive: "AdminActionButton",
        file: "src/admin/adminComponents.jsx",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        firstConsumer: "src/admin/AdminSiteSettings.jsx"
      })
    ]);
    expect(CSS_UTILITY_LAYER_DECISION.phase4Pilots).toEqual([
      expect.objectContaining({
        surface: "ConfirmModal action buttons",
        file: "src/modals/FeedbackModals.jsx",
        wrapper: "src/modals/modalComponents.jsx ModalActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["danger-action", "secondary-action"]
      }),
      expect.objectContaining({
        surface: "MessageBoardModal submit action",
        file: "src/modals/MessageBoardModal.jsx",
        wrapper: "src/modals/modalComponents.jsx ModalActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["primary-action"]
      }),
      expect.objectContaining({
        surface: "AnnouncementModal simple secondary actions",
        file: "src/modals/AnnouncementModal.jsx",
        wrapper: "src/modals/modalComponents.jsx ModalActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["secondary-action"]
      }),
      expect.objectContaining({
        surface: "PersonalizationModal save action",
        file: "src/modals/PersonalizationModal.jsx",
        wrapper: "src/modals/modalComponents.jsx ModalActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["primary-action"]
      }),
      expect.objectContaining({
        surface: "MailboxModal attachment claim action",
        file: "src/modals/MailboxModal.jsx",
        wrapper: "src/modals/modalComponents.jsx ModalActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["primary-action"]
      }),
      expect.objectContaining({
        surface: "FriendsOverlays duel-mode cancel action",
        file: "src/modals/friends/FriendsOverlays.jsx",
        wrapper: "src/modals/modalComponents.jsx ModalActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["secondary-action"]
      }),
      expect.objectContaining({
        surface: "UserProfileCard report submit action",
        file: "src/modals/UserProfileCard.jsx",
        wrapper: "src/modals/modalComponents.jsx ModalActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["danger-action"]
      })
    ]);
    expect(CSS_UTILITY_LAYER_DECISION.phase5Pilots).toEqual([
      expect.objectContaining({
        surface: "Home match-mode cancel action",
        file: "src/home/HomeScreen.jsx",
        wrapper: "src/home/homeComponents.jsx HomeActionButton",
        utilities: ["tw:inline-flex", "tw:items-center", "tw:justify-center", "tw:gap-2"],
        preservedVisualClasses: ["secondary-action"]
      })
    ]);
    expect(CSS_UTILITY_LAYER_DECISION.phase6Pilots).toEqual([
      expect.objectContaining({
        surface: "Bright School token scaffold",
        files: [
          "src/styles/tailwind/tokens.css",
          "src/styles/themes/bright-school/surface-contracts/final-root-surfaces.css",
          "src/styles/themes/bright-school/quality-base/refinement-foundation.css"
        ],
        contract: "Tailwind tokens map to Bright School paper, ink, accent, border, and shadow variables"
      })
    ]);
    expect(CSS_UTILITY_LAYER_DECISION.phase7Pilots).toEqual([
      expect.objectContaining({
        surface: "mobile-adaptive final guard inventory",
        files: ["src/styles/mobile-adaptive.css", "src/styles/cssLayerInventory.js"],
        contract: "Only register mobile safety reduction candidates; do not move final guard rules yet"
      })
    ]);
    expect(readFileSync(join(projectRoot, "src/ui/primitives/ScrollArea.jsx"), "utf8")).toContain(
      "tw:max-w-full"
    );
    expect(readFileSync(join(projectRoot, "src/admin/adminComponents.jsx"), "utf8")).toContain(
      "AdminTableScroll"
    );
    expect(readFileSync(join(projectRoot, "src/admin/adminComponents.jsx"), "utf8")).toContain("ScrollArea");
    expect(readFileSync(join(projectRoot, "src/admin/AdminAudit.jsx"), "utf8")).toContain("AdminTableScroll");
    expect(readFileSync(join(projectRoot, "src/admin/AdminAudit.jsx"), "utf8")).not.toContain("tw:max-w-full");
    expect(readFileSync(join(projectRoot, "src/admin/AdminAudit.jsx"), "utf8")).not.toContain("ScrollArea");
    expect(readFileSync(join(projectRoot, "src/ui/primitives/Badge.jsx"), "utf8")).toContain("tw:inline-flex");
    expect(readFileSync(join(projectRoot, "src/ui/primitives/EmptyState.jsx"), "utf8")).toContain(
      "tw:text-center"
    );
    expect(readFileSync(join(projectRoot, "src/ui/primitives/Button.jsx"), "utf8")).toContain("tw:gap-2");
    expect(readFileSync(join(projectRoot, "src/admin/adminComponents.jsx"), "utf8")).toContain(
      "AdminActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/admin/AdminSiteSettings.jsx"), "utf8")).toContain(
      "AdminActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/admin/AdminSiteSettings.jsx"), "utf8")).not.toContain(
      'className="primary-action"'
    );
    expect(readFileSync(join(projectRoot, "src/admin/AdminAchievements.jsx"), "utf8")).toContain(
      "AdminStatusPill"
    );
    expect(readFileSync(join(projectRoot, "src/admin/AdminAchievements.jsx"), "utf8")).not.toContain(
      "className={`admin-status-pill"
    );
    expect(readFileSync(join(projectRoot, "src/modals/modalComponents.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/modalComponents.jsx"), "utf8")).toContain(
      "Button"
    );
    expect(readFileSync(join(projectRoot, "src/modals/FeedbackModals.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/FeedbackModals.jsx"), "utf8")).not.toContain(
      'className="danger-action"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/FeedbackModals.jsx"), "utf8")).not.toContain(
      'className="secondary-action"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/MessageBoardModal.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/MessageBoardModal.jsx"), "utf8")).not.toContain(
      'className="primary-action"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/AnnouncementModal.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/AnnouncementModal.jsx"), "utf8")).toContain(
      'className="announcement-load-more"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/AnnouncementModal.jsx"), "utf8")).not.toContain(
      'className="secondary-action"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/AnnouncementModal.jsx"), "utf8")).not.toContain(
      'className="secondary-action announcement-load-more"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/PersonalizationModal.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/PersonalizationModal.jsx"), "utf8")).not.toContain(
      'className="primary-action"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/MailboxModal.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/MailboxModal.jsx"), "utf8")).not.toContain(
      'className="primary-action"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/friends/FriendsOverlays.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/friends/FriendsOverlays.jsx"), "utf8")).not.toContain(
      'className="secondary-action"'
    );
    expect(readFileSync(join(projectRoot, "src/modals/UserProfileCard.jsx"), "utf8")).toContain(
      "ModalActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/modals/UserProfileCard.jsx"), "utf8")).not.toContain(
      '<button className="danger-action" type="submit"'
    );
    expect(readFileSync(join(projectRoot, "src/home/homeComponents.jsx"), "utf8")).toContain(
      "HomeActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/home/homeComponents.jsx"), "utf8")).toContain(
      "Button"
    );
    expect(readFileSync(join(projectRoot, "src/home/HomeScreen.jsx"), "utf8")).toContain(
      "HomeActionButton"
    );
    expect(readFileSync(join(projectRoot, "src/home/HomeScreen.jsx"), "utf8")).not.toContain(
      'className="secondary-action"'
    );

    for (const token of CSS_UTILITY_LAYER_DECISION.semanticTokens) {
      expect(tokenSource).toContain(token);
    }

    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("tw:");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain('source("../")');
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("ScrollArea");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("AdminTableScroll");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("Badge");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("EmptyState");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("Button");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("AdminActionButton");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("ModalActionButton");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("HomeActionButton");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("Phase 6");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("Phase 7");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("Bright School tokens");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("mobile-adaptive final guard");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("staged long-term target");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("Bright School");
    expect(CSS_UTILITY_LAYER_DECISION.guidance.join("\n")).toContain("themes.css");
  });

  it("documents the phased Tailwind migration roadmap and protected exclusions", () => {
    expect(CSS_TAILWIND_MIGRATION_PHASES.map((phase) => phase.phase)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(CSS_TAILWIND_MIGRATION_PHASES[0].focus).toContain("token scaffold");
    expect(CSS_TAILWIND_MIGRATION_PHASES[0].allowedWork.join("\n")).toContain("semantic Tailwind token scaffold");
    expect(CSS_TAILWIND_MIGRATION_PHASES[1].allowedWork.join("\n")).toContain("admin");
    expect(CSS_TAILWIND_MIGRATION_PHASES[2].allowedWork.join("\n")).toContain("Button");
    expect(CSS_TAILWIND_MIGRATION_PHASES[3].allowedWork.join("\n")).toContain("settings");
    expect(CSS_TAILWIND_MIGRATION_PHASES[4].focus).toContain("Home");
    expect(CSS_TAILWIND_MIGRATION_PHASES[5].focus).toContain("Bright School");
    expect(CSS_TAILWIND_MIGRATION_PHASES[6].focus).toContain("Mobile safety");
    expect(CSS_TAILWIND_MIGRATION_PHASES[6].verification.join("\n")).toContain("npm run verify:battle-fixes");

    const exclusions = CSS_TAILWIND_MIGRATION_EXCLUSIONS.join("\n");
    expect(exclusions).toContain("Pixi");
    expect(exclusions).toContain("board point buttons");
    expect(exclusions).toContain("Tailwind preflight");
    expect(exclusions).toContain("tw prefix");
  });

  it("documents and enforces the Bright School broad fallback ban", () => {
    const missingFiles = CSS_FORBIDDEN_BROAD_FALLBACKS.files
      .filter((filePath) => !existsSync(join(stylesDir, filePath)))
      .map((filePath) => `missing file: ${filePath}`);
    const existingFiles = CSS_FORBIDDEN_BROAD_FALLBACKS.files.filter((filePath) => existsSync(join(stylesDir, filePath)));
    const source = existingFiles.map((filePath) => readCssWithImports(new URL(`./${filePath}`, import.meta.url))).join("\n");
    const forbiddenFragments = CSS_FORBIDDEN_BROAD_FALLBACKS.forbiddenFragments
      .filter((fragment) => source.includes(fragment))
      .map((fragment) => `forbidden fragment: ${fragment}`);

    expect(CSS_FORBIDDEN_BROAD_FALLBACKS.guidance).toContain("explicit owner selectors");
    expect([...missingFiles, ...forbiddenFragments]).toEqual([]);
  });

  it("documents the round-4 desktop, mobile, and skill regression gates", () => {
    const commands = CSS_ROUND4_REGRESSION_CHECKS.map((check) => check.command).join("\n");
    const coverage = CSS_ROUND4_REGRESSION_CHECKS.flatMap((check) => check.coverage).join("\n");

    expect(commands).toContain("src/styles/cssLayerInventory.test.js");
    expect(commands).toContain("npm run verify:battle-fixes");
    expect(commands).toContain("npm run verify:stability -- tests/stability/skill-effects.spec.js");
    expect(coverage).toContain("desktop Chromium");
    expect(coverage).toContain("mobile Chromium");
    expect(coverage).toContain("Pixi");
    expect(coverage).toContain("skill SFX");
  });

  it("documents final full-repo CSS cleanup verification gates", () => {
    const commands = CSS_FULL_REPO_CLEANUP_VERIFICATION_GATES.map((gate) => gate.command).join("\n");
    const requiredScopes = CSS_FULL_REPO_CLEANUP_VERIFICATION_GATES.flatMap((gate) => gate.requiredFor).join("\n");
    const coverage = CSS_FULL_REPO_CLEANUP_VERIFICATION_GATES.flatMap((gate) => gate.coverage).join("\n");

    expect(commands).toContain("src/styles/cssLayerInventory.test.js");
    expect(commands).toContain("npm run verify:battle-fixes");
    expect(commands).toContain("npm run verify:stability -- tests/stability/skill-effects.spec.js");
    expect(commands).toContain("npm run check");
    expect(requiredScopes).toContain("broad CSS changes");
    expect(requiredScopes).toContain("final handoff");
    expect(coverage).toContain("desktop Chromium");
    expect(coverage).toContain("mobile Chromium");
    expect(coverage).toContain("real Pixi canvas");
    expect(coverage).toContain("skill SFX scheduling");
    expect(coverage).toContain("system design HTML");
  });

  it("keeps round-3 shared splits import-only and in the low-risk inventory bucket", () => {
    const round3Candidates = new Set(inventoryFilesForGroup("reorganizable-shared-domains"));
    const protectedFiles = new Set([
      ...inventoryFilesForGroup("high-risk-gameplay-room"),
      ...inventoryFilesForGroup("skill-presentation-protected"),
      ...CSS_PROTECTED_SURFACES.flatMap((surface) => surface.files)
    ]);

    for (const split of CSS_ROUND3_SHARED_SPLITS) {
      const entrySource = readFileSync(join(stylesDir, split.entry), "utf8");

      expect(cssImports(entrySource)).toEqual(expectedRelativeImports(split));
      expect(concreteCssAfterImports(entrySource)).toBe("");
      expect(round3Candidates.has(split.entry)).toBe(true);

      for (const filePath of split.files) {
        expect(round3Candidates.has(filePath)).toBe(true);
        expect(protectedFiles.has(filePath)).toBe(false);
      }
    }
  });

  it("keeps final mobile safety splits import-only and in the final safety bucket", () => {
    const finalMobileFiles = new Set(inventoryFilesForGroup("final-mobile-safety"));

    for (const split of CSS_FINAL_MOBILE_SAFETY_SPLITS) {
      const entrySource = readFileSync(join(stylesDir, split.entry), "utf8");

      expect(cssImports(entrySource)).toEqual(expectedRelativeImports(split));
      expect(concreteCssAfterImports(entrySource)).toBe("");
      expect(finalMobileFiles.has(split.entry)).toBe(true);

      for (const filePath of split.files) {
        expect(finalMobileFiles.has(filePath)).toBe(true);
      }
    }
  });

  it("keeps theme overlay splits import-only and in the theme overlay bucket", () => {
    const themeOverlayFiles = new Set(inventoryFilesForGroup("bright-school-theme-overrides"));

    for (const split of CSS_THEME_OVERLAY_SPLITS) {
      const entrySource = readFileSync(join(stylesDir, split.entry), "utf8");

      expect(cssImports(entrySource)).toEqual(expectedRelativeImports(split));
      expect(concreteCssAfterImports(entrySource)).toBe("");
      expect(themeOverlayFiles.has(split.entry)).toBe(true);

      for (const filePath of split.files) {
        expect(themeOverlayFiles.has(filePath)).toBe(true);
      }
    }
  });

  it("keeps gameplay room splits import-only and in the high-risk room bucket", () => {
    const highRiskRoomFiles = new Set(inventoryFilesForGroup("high-risk-gameplay-room"));

    for (const split of CSS_GAMEPLAY_ROOM_SPLITS) {
      const entrySource = readFileSync(join(stylesDir, split.entry), "utf8");

      expect(cssImports(entrySource)).toEqual(expectedRelativeImports(split));
      expect(concreteCssAfterImports(entrySource)).toBe("");
      expect(highRiskRoomFiles.has(split.entry)).toBe(true);

      for (const filePath of split.files) {
        expect(highRiskRoomFiles.has(filePath)).toBe(true);
      }
    }
  });

  it("keeps skill presentation splits import-only and in the protected bucket", () => {
    const protectedSkillFiles = new Set(inventoryFilesForGroup("skill-presentation-protected"));

    for (const split of CSS_SKILL_PRESENTATION_SPLITS) {
      const entrySource = readFileSync(join(stylesDir, split.entry), "utf8");

      expect(cssImports(entrySource)).toEqual(expectedRelativeImports(split));
      expect(concreteCssAfterImports(entrySource)).toBe("");
      expect(protectedSkillFiles.has(split.entry)).toBe(true);

      for (const filePath of split.files) {
        expect(protectedSkillFiles.has(filePath)).toBe(true);
      }
    }
  });

  it("keeps protected surface contracts backed by current CSS fragments", () => {
    const missingFragments = CSS_PROTECTED_SURFACES.flatMap((surface) => {
      const source = cssSourceFor(surface.files);

      return surface.requiredFragments
        .filter((fragment) => !source.includes(fragment))
        .map((fragment) => `${surface.id}: ${fragment}`);
    });

    expect(missingFragments).toEqual([]);
  });
});
