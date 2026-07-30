// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CharacterCostumeDialog from "./CharacterCostumeDialog.jsx";

afterEach(cleanup);

describe("CharacterCostumeDialog overlay", () => {
  it("portals the wardrobe outside the clipped character-detail parent", () => {
    render(
      <main className="app-shell player-theme-enabled theme-bright-school">
        <section className="character-detail-parent" style={{ overflow: "hidden" }}>
          <CharacterCostumeDialog
            character={{ id: "denia", name: "达妮娅", portrait: "/assets/characters/denia.webp" }}
            characterOwned
            costumes={[{
              id: "denia-costume-01",
              name: "舞台服",
              characterSlug: "denia",
              portraitUrl: "/assets/costumes/denia-01.webp",
              owned: true,
              enabled: true,
              sortOrder: 1
            }]}
            loading={false}
            equippingId=""
            user={{
              ownedCostumeIds: ["denia-costume-01"],
              equippedCostumes: { denia: { id: "denia-costume-01" } }
            }}
            onEquip={vi.fn()}
            onClose={vi.fn()}
          />
        </section>
      </main>
    );

    const appShell = document.querySelector(".app-shell");
    const parent = document.querySelector(".character-detail-parent");
    const backdrop = document.querySelector(".character-costume-backdrop");
    const equippedCard = document.querySelector('.character-costume-card[aria-current="true"]');

    expect(appShell?.contains(backdrop)).toBe(true);
    expect(parent?.contains(backdrop)).toBe(false);
    expect(screen.getByRole("dialog", { name: "达妮娅服装" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "达妮娅的衣柜" })).toBeTruthy();
    expect(equippedCard?.classList.contains("is-equipped")).toBe(true);
    expect(screen.queryByText("装扮中")).toBeNull();
    expect(screen.queryByText("部员手册 · 服装")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "查看舞台服详情，正在装扮" }));
    const detailBackdrop = document.querySelector(".character-costume-detail-backdrop");
    const wardrobeDialog = document.querySelector(".character-costume-dialog");

    expect(appShell?.contains(detailBackdrop)).toBe(true);
    expect(wardrobeDialog?.contains(detailBackdrop)).toBe(false);
    expect(detailBackdrop?.parentElement).toBe(appShell);
    const detailDialog = screen.getByRole("dialog", { name: "舞台服详情" });
    expect(detailDialog.classList.contains("shop-item-detail-modal")).toBe(true);
    expect(detailDialog.querySelector(".shop-detail-art.character-costume-detail-art")).toBeTruthy();
    expect(detailDialog.querySelector(".shop-detail-copy.character-costume-detail-copy")).toBeTruthy();
    expect(screen.getByText("达妮娅服装")).toBeTruthy();
    expect(screen.queryByText("持有状态")).toBeNull();
  });

  it("shows character-managed illust credit in the virtual default-costume detail", () => {
    render(
      <main className="app-shell">
        <CharacterCostumeDialog
          character={{
            id: "denia",
            name: "达妮娅",
            portrait: "/assets/characters/denia.webp",
            illustName: "绘师",
            illustUrl: "https://example.com/illustrator"
          }}
          characterOwned
          costumes={[]}
          loading={false}
          equippingId=""
          user={{ ownedCostumeIds: [], equippedCostumes: {} }}
          onEquip={vi.fn()}
          onClose={vi.fn()}
        />
      </main>
    );

    fireEvent.click(screen.getByRole("button", { name: "查看默认服装详情，正在装扮" }));

    const credit = screen.getByRole("link", { name: "illust：绘师" });
    const heading = screen.getByRole("heading", { name: "默认服装" });
    expect(credit.getAttribute("href")).toBe("https://example.com/illustrator");
    expect(credit.parentElement).toBe(heading.parentElement);
    expect(credit.parentElement?.classList.contains("character-costume-detail-heading")).toBe(true);
    expect(credit.classList.contains("shop-detail-illust-label")).toBe(true);
    expect(screen.queryByText("持有状态")).toBeNull();
    expect(screen.getByRole("dialog", { name: "默认服装详情" })).toBeTruthy();
  });
});
