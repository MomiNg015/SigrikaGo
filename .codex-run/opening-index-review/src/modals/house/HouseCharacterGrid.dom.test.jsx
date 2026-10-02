// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHARACTERS } from "../../shared/characters.js";
import HouseCharacterGrid from "./HouseCharacterGrid.jsx";

afterEach(cleanup);

function renderGrid(overrides = {}) {
  const onCancelCandyEffect = vi.fn();
  const onOpenCharacterDetail = vi.fn();
  render(
    <HouseCharacterGrid
      audioSettings={{}}
      characters={[CHARACTERS.sigrika]}
      itemEffects={{ sigrikaCandyDisabled: true }}
      owned={new Set(["sigrika"])}
      selectedCharacter="sigrika"
      user={{
        id: 1,
        selectedCharacter: "sigrika",
        itemEffects: { sigrikaCandyDisabled: true }
      }}
      candyEffectCancellationEnabled
      onCancelCandyEffect={onCancelCandyEffect}
      onOpenCharacterDetail={onOpenCharacterDetail}
      onSelectCharacter={() => {}}
      {...overrides}
    />
  );

  return { onCancelCandyEffect, onOpenCharacterDetail };
}

describe("HouseCharacterGrid candy effect cancellation", () => {
  it("cancels from the candy icon without opening the character card", async () => {
    const user = userEvent.setup();
    const { onCancelCandyEffect, onOpenCharacterDetail } = renderGrid();

    await user.click(screen.getByRole("button", {
      name: "取消西格莉卡的彩虹豆豆跳跳糖效果中"
    }));

    expect(onCancelCandyEffect).toHaveBeenCalledOnce();
    expect(onCancelCandyEffect).toHaveBeenCalledWith("sigrika");
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
  });

  it("keeps Enter and Space cancellation isolated from the character card", async () => {
    const user = userEvent.setup();
    const { onCancelCandyEffect, onOpenCharacterDetail } = renderGrid();
    const cancelButton = screen.getByRole("button", {
      name: "取消西格莉卡的彩虹豆豆跳跳糖效果中"
    });

    cancelButton.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onCancelCandyEffect).toHaveBeenCalledTimes(2);
    expect(onOpenCharacterDetail).not.toHaveBeenCalled();
  });
});
