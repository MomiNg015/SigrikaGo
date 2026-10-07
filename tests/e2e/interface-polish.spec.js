import { expect, test } from "@playwright/test";
import { createSigrikaCandyDuelRoom } from "../../server/roomFactory.js";
import { buildRoomView } from "../../server/roomView.js";
import { CHARACTERS } from "../../src/shared/characters.js";

const characterIds = ["sigrika", "denia", "aemeath", "lynae", "mornye", "chisa", "changli", "qiuyuan", "nabomo", "baconbits"];
const fixture = "/tests/e2e/fixtures/interface-polish.html";

async function mount(page, surface, suffix = "") {
  await page.route("**/api/users/*/profile?*", route => route.fulfill({ json: { profile: {
    rank: "3段", stars: 2, rating: 1250,
    recordStats: { totalGames: 62, wins: 42, losses: 18, draws: 2 },
    characterStats: suffix.includes("empty") ? [] : characterIds.map((characterId, index) => ({ characterId, totalGames: 20 - index, wins: 12 - index, losses: 7, draws: 1 })),
    recentResults: suffix.includes("empty") ? [] : ["win", "loss", "win", "loss", "win", "win", "loss", "win", "win", "win"]
  } } }));
  await page.goto(`${fixture}?surface=${surface}${suffix}`);
  await page.evaluate(() => document.fonts.ready);
  for (const image of await page.locator(".character-bust-image").all()) {
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`identity portraits and profile navigation at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const surface of ["home", "resume", "profile", "room"]) {
      await mount(page, surface);
      const portraits = page.locator('.character-bust-portrait[data-standard="true"]');
      await expect(portraits).toHaveCount(surface === "room" ? 2 : 1);
      for (const portrait of await portraits.all()) {
        await expect(portrait).toBeVisible();
        const ratio = await portrait.locator("img").evaluate(img => {
          const bounds = img.getBoundingClientRect();
          return Math.abs(bounds.width / bounds.height - img.naturalWidth / img.naturalHeight);
        });
        expect(ratio).toBeLessThan(.002);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (surface === "room" && viewport.width < 768) {
        const labels = await page.locator(".player-info[data-paper-player]").evaluateAll(players => players.map(player => {
          const label = player.querySelector(".battle-character-label");
          const range = document.createRange();
          range.selectNodeContents(label);
          const box = label.getBoundingClientRect();
          return {
            textLines: range.getClientRects().length,
            overlaps: [...player.querySelectorAll(".player-meta, .captures")].some(control => {
              const bounds = control.getBoundingClientRect();
              return Math.min(box.right, bounds.right) - Math.max(box.left, bounds.left) > 1
                && Math.min(box.bottom, bounds.bottom) - Math.max(box.top, bounds.top) > 1;
            })
          };
        }));
        expect(labels.every(label => label.textLines === 1 && !label.overlaps)).toBe(true);
      }
      if (surface === "resume" || surface === "profile") {
        await expect(page.locator(".profile-resume-view")).not.toHaveAttribute("aria-busy", "true");
        await page.keyboard.press("Escape");
        await expect(page.locator(".profile-resume-view")).toHaveCount(0);
        await expect(page.locator(".home-screen")).toBeVisible();
      }
    }
    expect(errors).toEqual([]);
  });
}

test("each character keeps a loaded identity and authored costume framing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of characterIds) {
    await mount(page, "profile", `&character=${id}`);
    await expect(page.locator(".profile-hero-portrait .character-bust-portrait")).toHaveAttribute("data-standard", id === "baconbits" ? "false" : "true");
    if (id !== "baconbits") await expect(page.locator(".profile-hero-portrait img")).toHaveAttribute("src", new RegExp(`/handbook-sprites/${id}\\.webp$`));
  }
  await mount(page, "profile", "&costume=1");
  await expect(page.locator(".profile-hero-portrait .character-bust-portrait")).toHaveAttribute("data-standard", "false");
  await expect(page.locator(".profile-hero-portrait img")).toHaveAttribute("src", "/assets/costumes/portraits/sigrika-costume-01.webp");
  const framing = page.locator(".profile-hero-portrait .character-bust-art");
  await expect(framing).toHaveCSS("scale", "1.1");
  await expect(framing).toHaveCSS("translate", "4% -3%");
});

test("missing standard sprite falls back once to the same character", async ({ page }) => {
  await page.route("**/handbook-sprites/sigrika.webp", route => route.abort());
  await mount(page, "profile");
  const portrait = page.locator(".profile-hero-portrait .character-bust-portrait");
  await expect(portrait).toHaveAttribute("data-standard", "false");
  await expect(portrait.locator("img")).not.toHaveAttribute("src", /handbook-sprites/);
  await expect(portrait.locator("img")).toHaveAttribute("alt", "西格莉卡立绘");
});

test("reduced motion keeps profile immediately readable and usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await mount(page, "profile", "&empty=1&long-name=1");
    const dialog = page.locator(".user-profile-modal");
    await expect(dialog).toHaveCSS("animation-name", "none");
    await expect(dialog).toHaveCSS("opacity", "1");
    await expect(page.getByText("暂无角色战绩", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});

test("legal wide mobile usernames stay readable without overlapping actions", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const surface of ["resume", "profile"]) {
      await mount(page, surface, "&wide-name=1");
      const metrics = await page.locator(".profile-resume-hero").evaluate(hero => {
        const name = hero.querySelector(".user-identity-name");
        const box = name.getBoundingClientRect();
        return {
          font: Number.parseFloat(getComputedStyle(name).fontSize),
          clipped: name.scrollHeight > name.clientHeight + 1 || name.scrollWidth > name.clientWidth + 1,
          overlaps: [...hero.querySelectorAll(".profile-identity-actions button")].map(button => {
            const control = button.getBoundingClientRect();
            return Math.max(0, Math.min(box.right, control.right) - Math.max(box.left, control.left))
              * Math.max(0, Math.min(box.bottom, control.bottom) - Math.max(box.top, control.top));
          })
        };
      });
      expect(metrics.font).toBeGreaterThanOrEqual(22);
      expect(metrics.clipped).toBe(false);
      expect(metrics.overlaps.every(area => area < 1)).toBe(true);
    }
  }
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`profile identity equipment clears actions at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const surface of ["resume", "profile"]) {
      for (const equipment of ["", "&equipped=1", "&equipped=1&decorated=1"]) {
        for (const name of ["", "&wide-name=1"]) {
          await mount(page, surface, equipment + name);
          const metrics = await page.locator(".profile-resume-hero").evaluate(hero => {
            const tag = hero.querySelector(".user-identity-name-tag");
            const bounds = tag.getBoundingClientRect();
            const intersect = element => {
              const box = element.getBoundingClientRect();
              return Math.max(0, Math.min(bounds.right, box.right) - Math.max(bounds.left, box.left))
                * Math.max(0, Math.min(bounds.bottom, box.bottom) - Math.max(bounds.top, box.top));
            };
            return {
              equipped: Boolean(hero.querySelector(".user-identity.has-nameplate")),
              ratio: bounds.width / bounds.height,
              actionOverlaps: [...hero.querySelectorAll(".profile-identity-actions button")].map(intersect)
            };
          });
          const context = `${surface} ${equipment || "plain"} ${name || "normal-name"}`;
          expect(metrics.actionOverlaps.every(area => area < 1), context).toBe(true);
          expect(metrics.equipped, context).toBe(equipment.includes("equipped"));
          if (metrics.equipped) expect(metrics.ratio, context).toBeCloseTo(3.75, 2);
        }
      }
    }
  });
}

test("nested social dialogs release entry transforms and restore keyboard focus", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await mount(page, "profile");
    const profile = page.locator(".user-profile-modal");
    await finishEntry(profile);
    await expect(profile).toHaveCSS("translate", "none");
    await expect(profile).toHaveCSS("scale", "none");

    for (const action of [
      { name: "举报", dialog: ".profile-report-dialog", close: "关闭举报窗口", last: "textarea" },
      { name: "加入黑名单", dialog: ".profile-blacklist-dialog", close: "关闭黑名单确认窗口", last: "button:has-text('暂不处理')" }
    ]) {
      const trigger = page.getByRole("button", { name: action.name, exact: true });
      await trigger.click();
      const nested = page.locator(action.dialog);
      await expect(nested).toBeVisible();
      await finishEntry(nested);
      const backdrop = await nested.evaluate(dialog => {
        const box = dialog.parentElement.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      });
      expect(backdrop.x).toBeCloseTo(0, 1);
      expect(backdrop.y).toBeCloseTo(0, 1);
      expect(backdrop.width).toBeCloseTo(viewport.width, 1);
      expect(backdrop.height).toBeCloseTo(viewport.height, 1);
      const close = nested.getByRole("button", { name: action.close });
      await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(nested.locator(action.last)).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(nested).toHaveCount(0);
      await expect(profile).toBeVisible();
      await expect(trigger).toBeFocused();
    }
  }
});

test("quick social actions keep nested backdrops viewport-sized during profile entry", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    for (const reduce of [false, true]) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: reduce ? "reduce" : "no-preference" });
      await mount(page, "profile");
      const profile = page.locator(".user-profile-modal");
      if (reduce) {
        await expect(profile).toHaveCSS("animation-name", "none");
      } else {
        const entry = await profile.evaluate(element => {
          element.style.setProperty("animation", "none", "important");
          void element.offsetWidth;
          element.style.removeProperty("animation");
          const animation = element.getAnimations()[0];
          if (!animation) return false;
          animation.pause();
          animation.currentTime = 65;
          return getComputedStyle(element).scale !== "none";
        });
        expect(entry).toBe(true);
      }
      for (const action of [
        { name: "举报", dialog: ".profile-report-dialog" },
        { name: "加入黑名单", dialog: ".profile-blacklist-dialog" }
      ]) {
        const trigger = page.getByRole("button", { name: action.name, exact: true });
        await trigger.click();
        const nested = page.locator(action.dialog);
        await expect(nested).toBeVisible();
        const bounds = await nested.evaluate(dialog => {
          const box = dialog.parentElement.getBoundingClientRect();
          return {
            x: box.x, y: box.y, width: box.width, height: box.height,
            insideProfile: Boolean(dialog.closest(".user-profile-modal")),
            theme: Boolean(dialog.closest(".app-shell.theme-bright-school"))
          };
        });
        expect(bounds.insideProfile).toBe(false);
        expect(bounds.theme).toBe(true);
        expect(bounds.x).toBeCloseTo(0, 1);
        expect(bounds.y).toBeCloseTo(0, 1);
        expect(bounds.width).toBeCloseTo(viewport.width, 1);
        expect(bounds.height).toBeCloseTo(viewport.height, 1);
        if (reduce) await expect(nested).toHaveCSS("animation-name", "none");
        await page.keyboard.press("Escape");
        await expect(nested).toHaveCount(0);
        await expect(profile).toBeVisible();
        await expect(trigger).toBeFocused();
      }
      if (!reduce) {
        await profile.evaluate(element => element.getAnimations().forEach(animation => animation.play()));
        await finishEntry(profile);
        await expect(profile).toHaveCSS("translate", "none");
        await expect(profile).toHaveCSS("scale", "none");
      }
    }
  }
});

async function finishEntry(locator) {
  await locator.evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
}

for (const width of [844, 768]) {
  test(`supported landscape battle keeps portraits and intersections visible at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 390 });
    await mount(page, "room");
    // This fixture renders RoomScreen directly; verify that the real app gate permits this viewport.
    const gatePermitsRoom = await page.evaluate(async () => {
      const { isCompactViewport, shouldBlockDesktopViewport } = await import("/src/app/DesktopViewportGate.jsx");
      const viewport = { width: innerWidth, height: innerHeight };
      return !shouldBlockDesktopViewport({ ...viewport, compactLayout: isCompactViewport(viewport) });
    });
    expect(gatePermitsRoom).toBe(true);
    await expectLandscapeBattle(page);

    await page.goto("/tests/e2e/fixtures/team-match.html?round=2");
    await expectLandscapeBattle(page);
    const hidden = page.locator(".team-portrait-slot.is-hidden");
    await expect(hidden).toHaveCount(1);
    await expect(hidden.locator("img")).toHaveCount(0);
    const slices = await page.locator(".team-portrait-slot").evaluateAll(slots => slots.map(slot => getComputedStyle(slot).clipPath));
    expect(slices.every(clip => clip.startsWith("polygon("))).toBe(true);
  });
}

test("battle art and square board recover when resizing across the landscape boundary", async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await mount(page, "room");
  for (const width of [844, 769, 768, 767, 844]) {
    await page.setViewportSize({ width, height: 390 });
    await expectLandscapeBattle(page);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".mobile-room-screen .portrait-wrap").first()).toHaveCSS("height", "88px");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".desktop-room-screen")).toBeVisible();
  await expect(page.locator(".desktop-room-screen .portrait-wrap").first()).toHaveCSS("height", "250px");
});

async function expectLandscapeBattle(page, { authoredSpecial = false } = {}) {
  await expect(page.locator(".mobile-room-screen")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".character-bust-image").evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await expect.poll(async () => page.locator(".mobile-room-screen").evaluate(room => {
    const rect = element => element.getBoundingClientRect();
    const stage = rect(room.querySelector(".board-stage"));
    const wrap = rect(room.querySelector(".board-wrap"));
    const board = rect(room.querySelector(".board"));
    const lines = rect(room.querySelector(".board-lines"));
    const viewport = rect(room.querySelector(".mobile-board-viewport"));
    const inside = (box, parent) => box.left >= parent.left - 1 && box.right <= parent.right + 1
      && box.top >= parent.top - 1 && box.bottom <= parent.bottom + 1;
    const square = box => box.width > 100 && Math.abs(box.width - box.height) < 1;
    return square(stage) && square(wrap) && square(board) && square(lines)
      && inside(stage, viewport) && inside(wrap, stage) && inside(board, wrap)
      && Math.abs(board.left - lines.left) < 1 && Math.abs(board.top - lines.top) < 1;
  })).toBe(true);

  const art = await page.locator(".character-bust-portrait").evaluateAll(portraits => portraits.map(portrait => {
    const mask = portrait.getBoundingClientRect();
    const image = portrait.querySelector("img");
    const bounds = image.getBoundingClientRect();
    return { width: mask.width, height: mask.height, loaded: image.complete && image.naturalWidth > 0,
      ratioDelta: Math.abs(bounds.width / bounds.height - image.naturalWidth / image.naturalHeight) };
  }));
  if (!authoredSpecial) {
    expect(art.length).toBeGreaterThanOrEqual(2);
    expect(art.every(portrait => portrait.width > 60 && portrait.height > 60 && portrait.loaded
      && Number.isFinite(portrait.ratioDelta) && portrait.ratioDelta < .002)).toBe(true);
  }
  const portraitRows = await page.locator(".player-info[data-paper-player]").evaluateAll(players => players.map(player => {
    const portrait = player.querySelector(".portrait-wrap").getBoundingClientRect();
    const identity = player.querySelector(".player-meta").getBoundingClientRect();
    const clock = player.querySelector(".digital-timer").getBoundingClientRect();
    const card = player.getBoundingClientRect();
    return portrait.top >= identity.bottom + 1 && portrait.bottom <= clock.top - 1
      && identity.top >= card.top - 1 && clock.bottom <= card.bottom + 1;
  }));
  expect(portraitRows.every(Boolean)).toBe(true);
  await expect(page.locator(".coord-row")).toHaveCount(2);
  await expect(page.locator(".coord-col")).toHaveCount(2);
  const points = await page.locator(".point").evaluateAll(elements => elements.map(point => {
    const box = point.getBoundingClientRect();
    return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest(".point") === point;
  }));
  expect(points).toHaveLength(169);
  expect(points.every(Boolean)).toBe(true);
  const actions = await page.locator("#mobile-room-panel-actions button").evaluateAll(buttons => buttons
    .filter(button => getComputedStyle(button).display !== "none")
    .map(button => {
      const box = button.getBoundingClientRect();
      let top = 0, bottom = innerHeight, left = 0, right = innerWidth;
      for (let parent = button.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        const bounds = parent.getBoundingClientRect();
        if (/auto|scroll|hidden|clip/.test(style.overflowY)) {
          top = Math.max(top, bounds.top);
          bottom = Math.min(bottom, bounds.bottom);
        }
        if (/auto|scroll|hidden|clip/.test(style.overflowX)) {
          left = Math.max(left, bounds.left);
          right = Math.min(right, bounds.right);
        }
      }
      return box.height >= 44 && box.top >= top - 1 && box.bottom <= bottom + 1
        && box.left >= left - 1 && box.right <= right + 1
        && document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest("button") === button;
    }));
  expect(actions.length).toBeGreaterThanOrEqual(5);
  expect(actions.every(Boolean)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

for (const width of [844, 768]) {
  test(`playing special duel keeps the board, authored art and actions reachable at ${width}`, async ({ page }) => {
    const user = { id: "special-interface-player", username: "星炬同学", selectedCharacter: "sigrika", rank: "3段", sigrikaCandyArc: { corrupted: true } };
    const room = createSigrikaCandyDuelRoom({ user, characterId: "sigrika", character: CHARACTERS.sigrika }, { code: "SIG01", random: () => 0, now: () => 1000 });
    room.sigrikaCandyDuel.openingPresentationStage = "done";
    room.sigrikaCandyDuel.presentation = null;
    room.preload = null;
    room.openingEndsAt = null;
    room.game.phase = "playing";
    room.game.turn = room.sigrikaCandyDuel.humanColor;
    const payload = { user, room: buildRoomView(room, user.id) };
    await page.addInitScript(value => { window.__interfaceSpecialRoomPayload = value; }, payload);
    await page.setViewportSize({ width, height: 390 });
    await mount(page, "room");
    await expect(page.locator(".sigrika-candy-duel-room")).toBeVisible();
    await page.locator(".portrait-wrap img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await expectLandscapeBattle(page, { authoredSpecial: true });
    await expect(page.locator(".portrait-wrap img")).toHaveCount(2);
    const portraitState = () => page.locator(".portrait-wrap img").evaluateAll(images => images.map(image => ({
      source: image.getAttribute("src"), fit: getComputedStyle(image).objectFit, transform: getComputedStyle(image).transform
    })));
    const artwork = await portraitState();
    expect(artwork.map(image => image.source).sort()).toEqual([
      "/assets/characters/portraits/sigrika-corrupted-player.webp", "/assets/characters/portraits/sigrika-corrupted.webp"
    ].sort());
    const contained = await page.locator(".mobile-player-slot").evaluateAll(slots => slots.map(slot => {
      const card = slot.querySelector(".player-info").getBoundingClientRect();
      const meta = slot.querySelector(".player-meta").getBoundingClientRect();
      const art = slot.querySelector(".portrait-wrap").getBoundingClientRect();
      const timer = slot.querySelector(".digital-timer").getBoundingClientRect();
      const dock = document.querySelector(".mobile-room-dock").getBoundingClientRect();
      return meta.top >= card.top && art.top >= meta.bottom + 1 && art.height > 60 && art.width > 100
        && art.bottom <= timer.top - 1 && timer.bottom <= card.bottom && card.bottom < dock.top;
    }));
    expect(contained).toEqual([true, true]);
    await page.locator('.point[data-point-id="12,12"]').click();
    expect(await page.evaluate(() => window.__interfaceReviewActions)).toEqual([{ type: "move", pointId: "12,12" }]);
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await expect(page.locator(viewport.width === 390 ? ".mobile-room-screen.sigrika-candy-duel-room" : ".desktop-room-screen.sigrika-candy-duel-room")).toBeVisible();
      expect(await portraitState()).toEqual(artwork);
      const geometry = await page.locator(".room-screen").evaluate(element => ({
        layout: getComputedStyle(element.querySelector(".player-info")).gridTemplateAreas,
        mask: element.querySelector(".portrait-wrap").getBoundingClientRect().height,
        columns: getComputedStyle(element.querySelector(".action-bar")).gridTemplateColumns
      }));
      if (viewport.width === 390) expect(geometry.mask).toBe(54);
      else expect(geometry.mask).toBeGreaterThan(100);
      expect(geometry.layout).not.toBe('"meta" "portrait" "time"');
    }
  });
}
