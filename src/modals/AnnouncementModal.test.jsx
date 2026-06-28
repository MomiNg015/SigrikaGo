import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("AnnouncementModal detail popup contract", () => {
  it("keeps announcement tabs, rows, and detail body aligned with shared modal styling", () => {
    const source = readFileSync(new URL("./AnnouncementModal.jsx", import.meta.url), "utf8");
    const rawEntry = readFileSync(new URL("../styles/modals/announcement.css", import.meta.url), "utf8");
    const css = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const themeCss = readCssWithImports(new URL("../styles/themes.css", import.meta.url));
    const tabButtonBlock = css.match(/\.announcement-tabs button\s*\{[^}]+\}/)?.[0] ?? "";
    const brightTabBlock = css.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.announcement-tabs button\.active,\s*\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.announcement-tabs button\[aria-selected="true"\]\s*\{[^}]+\}/)?.[0] ?? "";
    const brightRowBlock = css.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.announcement-list-item\s*\{[^}]+\}/)?.[0] ?? "";
    const detailHeaderStackBlock = css.match(/\.announcement-detail-header > div\s*\{[^}]+\}/)?.[0] ?? "";
    const detailHeaderMetaBlock = css.match(/\.announcement-detail-header p\s*\{[^}]+\}/)?.[0] ?? "";
    const detailBodyBlock = css.match(/\.announcement-detail-body\s*\{[^}]+\}/)?.[0] ?? "";
    const metaChipBlock = css.match(/\.announcement-list-meta b\s*\{[^}]+\}/)?.[0] ?? "";
    const detailKindBlock = css.match(/\.announcement-detail-kind\s*\{[^}]+\}/)?.[0] ?? "";

    expect(source).toContain('className="announcement-title-group"');
    expect(source).not.toContain("announcement-title-lockup");
    expect(source).not.toContain("announcement-title-icon");
    expect(source).not.toContain("Megaphone");
    expect(source).toContain("aria-controls={`announcement-panel-${kind.id}`}");
    expect(source).toContain("role=\"tabpanel\"");
    expect(css).not.toContain(".announcement-title-icon");
    expect(css).not.toContain(".announcement-title-lockup");
    expect(rawEntry).toContain('@import "./announcement/shell.css";');
    expect(rawEntry).toContain('@import "./announcement/detail.css";');
    expect(rawEntry).toContain('@import "./announcement/visual-consistency.css";');
    expect(tabButtonBlock).toContain("min-height: 44px");
    expect(tabButtonBlock).toContain("padding: 8px 12px");
    expect(tabButtonBlock).toContain("line-height: 1.2");
    expect(brightTabBlock).toContain("background: #ff9ebb !important");
    expect(brightTabBlock).toContain("border-color: #4a3736 !important");
    expect(themeCss).toContain(".announcement-tabs button.active");
    expect(themeCss).toContain(".announcement-tabs button[aria-selected=\"true\"]");
    expect(brightRowBlock).toContain("border: 2px solid #4a3736 !important");
    expect(brightRowBlock).toContain("border-radius: 8px !important");
    expect(metaChipBlock).toContain("min-height: 26px");
    expect(metaChipBlock).toContain("padding: 4px 9px");
    expect(detailKindBlock).toContain("min-height: 28px");
    expect(detailKindBlock).toContain("padding: 5px 10px");
    expect(detailHeaderStackBlock).toContain("display: flex");
    expect(detailHeaderStackBlock).toContain("flex-direction: column");
    expect(detailHeaderStackBlock).toContain("align-items: flex-start");
    expect(detailHeaderStackBlock).toContain("gap: 8px");
    expect(detailHeaderMetaBlock).toContain("margin: 0");
    expect(detailBodyBlock).toContain("flex: 1 1 auto");
    expect(detailBodyBlock).toContain("min-height: 0");
    expect(detailBodyBlock).toContain("border: 1px solid #eaddea");
    expect(detailBodyBlock).toContain("padding: 18px");
    expect(css).toContain(".announcement-detail-body.markdown-lite-content");
    expect(css).not.toContain("\n.markdown-lite-content {\n");
  });

  it("renders entry details inside the parent announcement modal", () => {
    const source = readFileSync(new URL("./AnnouncementModal.jsx", import.meta.url), "utf8").replace(/\r\n/g, "\n");
    const parentBackdropIndex = source.indexOf('className="modal-backdrop announcement-backdrop"');
    const parentModalIndex = source.indexOf('className="modal-panel announcement-modal"');
    const detailBackdropIndex = source.indexOf('className="nested-modal-backdrop announcement-detail-backdrop"');
    const parentModalCloseIndex = source.indexOf("\n        </section>\n      </div>", parentModalIndex);
    const detailSource = source.slice(detailBackdropIndex);

    expect(parentBackdropIndex).toBeGreaterThan(-1);
    expect(parentModalIndex).toBeGreaterThan(parentBackdropIndex);
    expect(detailBackdropIndex).toBeGreaterThan(parentModalIndex);
    expect(detailBackdropIndex).toBeLessThan(parentModalCloseIndex);
    expect(source).not.toContain('className="modal-backdrop announcement-detail-backdrop"');
    expect(source.slice(parentModalCloseIndex)).not.toContain('className="nested-modal-backdrop announcement-detail-backdrop"');
    expect(detailSource).toContain('className="nested-modal announcement-detail-modal"');
    expect(detailSource).toContain('role="dialog"');
    expect(detailSource).toContain('aria-modal="true"');
  });

  it("keeps the embedded detail window the same size as its parent modal on desktop and mobile", () => {
    const css = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/themes.css", import.meta.url));
    const backdropBlock = css.match(/\.announcement-detail-backdrop\s*\{[^}]+\}/)?.[0] ?? "";
    const modalBlock = css.match(/\.announcement-detail-modal\s*\{[^}]+\}/)?.[0] ?? "";
    const phoneBlock = mediaBlock(css, "@media (max-width: 768px)");
    const phoneDetailBlock = [...phoneBlock.matchAll(/\.announcement-detail-modal\s*\{[^}]+\}/g)].at(-1)?.[0] ?? "";
    const brightDesktopBackdropBlock = finalMobileCss.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.announcement-modal \.announcement-detail-backdrop\s*\{[^}]+\}/)?.[0] ?? "";
    const brightDesktopDetailBlock = finalMobileCss.match(/\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.announcement-modal \.announcement-detail-backdrop \.announcement-detail-modal\s*\{[^}]+\}/)?.[0] ?? "";
    const finalPhoneBlock = mediaBlock(finalMobileCss, "@media (max-width: 768px)");
    const finalBackdropBlock = finalPhoneBlock.match(/\.announcement-modal \.announcement-detail-backdrop,\s*\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.announcement-modal \.announcement-detail-backdrop\s*\{[^}]+\}/)?.[0] ?? "";
    const finalDetailBlock = finalPhoneBlock.match(/\.announcement-modal \.announcement-detail-backdrop \.announcement-detail-modal,\s*\.app-shell\.player-theme-enabled\.theme-bright-school\.theme-bright-school \.announcement-modal \.announcement-detail-backdrop \.announcement-detail-modal\s*\{[^}]+\}/)?.[0] ?? "";

    expect(backdropBlock).toContain("position: absolute");
    expect(backdropBlock).toContain("inset: 0");
    expect(backdropBlock).toContain("z-index: 30");
    expect(backdropBlock).toContain("display: grid");
    expect(backdropBlock).toContain("padding: 0");
    expect(backdropBlock).toContain("border-radius: inherit");
    expect(backdropBlock).toContain("background: rgba(1, 9, 13, 0.38)");
    expect(modalBlock).toContain("position: relative");
    expect(modalBlock).toContain("inset: 0");
    expect(modalBlock).toContain("width: 100%");
    expect(modalBlock).toContain("max-width: 100%");
    expect(modalBlock).toContain("min-height: 100%");
    expect(modalBlock).toContain("height: 100%");
    expect(modalBlock).toContain("max-height: 100%");
    expect(modalBlock).toContain("margin: 0");
    expect(modalBlock).toContain("border-radius: inherit");
    expect(brightDesktopBackdropBlock).toContain("position: absolute !important");
    expect(brightDesktopBackdropBlock).toContain("inset: 0 !important");
    expect(brightDesktopBackdropBlock).toContain("padding: 0 !important");
    expect(brightDesktopDetailBlock).toContain("width: 100% !important");
    expect(brightDesktopDetailBlock).toContain("max-width: 100% !important");
    expect(brightDesktopDetailBlock).toContain("height: 100% !important");
    expect(brightDesktopDetailBlock).toContain("max-height: 100% !important");
    expect(brightDesktopDetailBlock).not.toContain("min(620px");
    expect(phoneDetailBlock).toContain("width: 100%");
    expect(phoneDetailBlock).toContain("height: 100%");
    expect(phoneDetailBlock).toContain("max-height: 100%");
    expect(phoneDetailBlock).not.toContain("min(640px");
    expect(finalBackdropBlock).toContain("position: absolute !important");
    expect(finalBackdropBlock).toContain("inset: 0 !important");
    expect(finalBackdropBlock).toContain("padding: 0 !important");
    expect(finalBackdropBlock).not.toContain("position: fixed");
    expect(finalDetailBlock).toContain("position: relative !important");
    expect(finalDetailBlock).toContain("inset: 0 !important");
    expect(finalDetailBlock).toContain("width: 100% !important");
    expect(finalDetailBlock).toContain("height: 100% !important");
    expect(finalDetailBlock).toContain("max-height: 100% !important");
    expect(finalDetailBlock).toContain("margin: 0 !important");
    expect(finalDetailBlock).not.toContain("100vw");
  });
});

function mediaBlock(css, marker) {
  const blocks = [];
  let start = css.indexOf(marker);
  while (start >= 0) {
    const next = css.indexOf("\n@media", start + 1);
    blocks.push(css.slice(start, next >= 0 ? next : undefined));
    start = css.indexOf(marker, start + marker.length);
  }
  return blocks.join("\n");
}
