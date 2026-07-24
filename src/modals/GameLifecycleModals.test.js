import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { colorTextForPlayer, formatSignedDelta, OpeningModal, ResultModal, resultRewardForRoom, resultVoiceEventForRoom, secondsSinceStarted, secondsUntilTimestamp } from "./GameLifecycleModals.jsx";
import { COLORS } from "../shared/game.js";

describe("GameLifecycleModals helpers", () => {
  it("formats the player opening color", () => {
    expect(colorTextForPlayer({ color: COLORS.black })).toBe("黑");
    expect(colorTextForPlayer({ color: COLORS.white })).toBe("白");
    expect(colorTextForPlayer(null)).toBe("");
  });

  it("clamps lifecycle countdown values", () => {
    expect(secondsSinceStarted(1_000, 3_900)).toBe(2);
    expect(secondsUntilTimestamp(4_100, 1_000)).toBe(4);
    expect(secondsUntilTimestamp(900, 1_000)).toBe(0);
  });

  it("formats signed reward deltas", () => {
    expect(formatSignedDelta(20)).toBe("+20");
    expect(formatSignedDelta(0)).toBe("0");
    expect(formatSignedDelta(-20)).toBe("-20");
  });

  it("shows the capture victory rule only in the practice opening modal", () => {
    const practiceMarkup = renderToStaticMarkup(createElement(OpeningModal, {
      room: {
        matchSource: "practice",
        practice: { difficulty: "basic" },
        openingEndsAt: Date.now() + 3_000
      },
      player: { color: COLORS.black }
    }));
    const regularMarkup = renderToStaticMarkup(createElement(OpeningModal, {
      room: { matchSource: "matchmaking", openingEndsAt: Date.now() + 3_000 },
      player: { color: COLORS.white }
    }));
    const restoredBeginnerMarkup = renderToStaticMarkup(createElement(OpeningModal, {
      room: {
        matchSource: "practice",
        practice: { difficulty: "beginner" },
        openingEndsAt: Date.now() + 3_000
      },
      player: { color: COLORS.white }
    }));
    const openingCss = readFileSync(new URL("../styles/modals/character-opening/opening-animation.css", import.meta.url), "utf8");

    expect(practiceMarkup).toContain("本局你执黑");
    expect(practiceMarkup).toContain('class="practice-opening-rule"');
    expect(practiceMarkup).toContain("吃掉准时宝22颗棋子就算胜利！");
    expect(regularMarkup).toContain("本局你执白");
    expect(regularMarkup).not.toContain("practice-opening-rule");
    expect(restoredBeginnerMarkup).toContain("吃掉准时宝11颗棋子就算胜利！");
    expect(openingCss).toContain(".opening-modal .practice-opening-rule");
    expect(openingCss).toContain("color: #c62828");
  });

  it("uses semantic rating typography only for rating reward values", () => {
    const source = readFileSync(new URL("./gameLifecycle/ResultModal.jsx", import.meta.url), "utf8");

    expect(source).toContain('<span className="text-rating-value">{formatSignedDelta(reward.rating)}</span>');
    expect(source).toContain('className="result-reward-tile result-reward-coins"');
    expect(source).toContain("<strong>金币</strong>{formatSignedDelta(reward.coins)}");
  });

  it("marks result reward cards with signed rating and coin classes", () => {
    const source = readFileSync(new URL("./gameLifecycle/ResultModal.jsx", import.meta.url), "utf8");

    expect(source).toContain('reward?.rating < 0 ? "result-reward-negative" : "result-reward-nonnegative"');
    expect(source).toContain("className={ratingRewardClass}");
    expect(source).toContain("result-reward-tile result-reward-rating");
    expect(source).not.toContain("result-reward-card");
  });

  it("renders the battle result portrait from the current room player", () => {
    const source = readFileSync(new URL("./gameLifecycle/ResultModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("const displayPlayer = currentPlayer ?? (!isDraw ? winner : null);");
    expect(source).toContain("src={resolveCharacterPortrait(character, {");
    expect(source).toContain("costumeSnapshot: displayPlayer?.costumeSnapshot");
    expect(source).toContain("currentPlayer?.completedItemEffects ?? currentPlayer?.user?.itemEffects ?? {}");
    expect(source).toContain("<CharacterChainBadge user={displayPlayer?.user} characterId={character.id} />");
    expect(source).toContain("`result-outcome-${outcome}`");
    expect(source).toContain('outcome === "loss"');
    expect(source).not.toContain("costumeSnapshot: winner?.costumeSnapshot");
  });

  it("shows zero reward deltas for invalid early resign results", () => {
    const room = {
      players: [{ user: { id: "u1" }, color: COLORS.black }],
      game: {
        winner: {
          winnerColor: COLORS.black,
          invalid: true
        }
      }
    };

    expect(resultRewardForRoom(room, { id: "u1" })).toEqual({ rating: 0, coins: 0 });
  });

  it("does not expose reward tiles for practice results", () => {
    const room = {
      rated: false,
      matchSource: "practice",
      recordPolicy: "none",
      players: [{ user: { id: "u1" }, color: COLORS.black }],
      game: { winner: { winnerColor: COLORS.black } }
    };

    expect(resultRewardForRoom(room, { id: "u1" })).toBeNull();
  });

  it("omits the practice result note while retaining the friendly-match note", () => {
    const baseRoom = {
      rated: false,
      players: [{ user: { id: "u1", username: "moming" }, color: COLORS.black }],
      game: { winner: { winnerColor: COLORS.black, text: "黑胜" } }
    };
    const practiceMarkup = renderToStaticMarkup(createElement(ResultModal, {
      room: { ...baseRoom, matchSource: "practice", recordPolicy: "none" },
      user: { id: "u1" },
      characters: {},
      audioSettings: {},
      onClose: () => {}
    }));
    const friendlyMarkup = renderToStaticMarkup(createElement(ResultModal, {
      room: { ...baseRoom, matchSource: "duel" },
      user: { id: "u1" },
      characters: {},
      audioSettings: {},
      onClose: () => {}
    }));

    expect(practiceMarkup).not.toContain("人机练习");
    expect(practiceMarkup).not.toContain("不保存棋谱");
    expect(friendlyMarkup).toContain("友谊对局 · 不计入积分与段位");
  });

  it("prefers settled result rewards from the room snapshot", () => {
    const room = {
      rated: false,
      matchSource: "duel",
      players: [{ user: { id: "u1" }, color: COLORS.black }],
      game: {
        winner: { winnerColor: COLORS.black },
        resultRewards: {
          u1: {
            rating: 0,
            coins: 0,
            rated: false,
            matchSource: "duel",
            rewardLimitReached: true
          }
        }
      }
    };

    expect(resultRewardForRoom(room, { id: "u1" })).toMatchObject({
      rating: 0,
      coins: 0,
      rated: false,
      rewardLimitReached: true
    });
  });

  it("selects the result voice event from the current player's outcome", () => {
    const room = {
      players: [
        { user: { id: "u1" }, color: COLORS.black },
        { user: { id: "u2" }, color: COLORS.white }
      ],
      game: {
        winner: {
          winnerColor: COLORS.black
        }
      }
    };

    expect(resultVoiceEventForRoom(room, { id: "u1" })).toBe("result-victory");
    expect(resultVoiceEventForRoom(room, { id: "u2" })).toBe("result-defeat");
  });

  it("selects draw result voice events but skips invalid early resigns", () => {
    const room = {
      players: [{ user: { id: "u1" }, color: COLORS.black }],
      game: { winner: null }
    };

    expect(resultVoiceEventForRoom(room, { id: "u1" })).toBe("result-draw");
    expect(resultVoiceEventForRoom({
      ...room,
      game: { winner: { winnerColor: COLORS.black, invalid: true } }
    }, { id: "u1" })).toBeNull();
  });
});
