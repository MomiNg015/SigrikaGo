import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  RECRUITMENT_MISS_SOUND,
  RECRUITMENT_MAGIC_CLOCK_FAST_FORWARD_SOUND,
  RECRUITMENT_SUCCESS_SOUND,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_FRIENDS_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_IRIS_DATABASE_OPEN_SOUND,
  UI_LEADERBOARD_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_RECRUITMENT_OPEN_SOUND,
  UI_RESUME_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_WAREHOUSE_OPEN_SOUND,
  UI_WATCH_OPEN_SOUND,
  UI_UNAVAILABLE_SOUND
} from "./audioAssets.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import { DENIA_SKILL_FORM_ASSET, DENIA_PAPER_ASSET, DENIA_RUNE_ASSET } from "./deniaSkillForm.js";
import { AEMEATH_SKILL_FORM_ASSET } from "./aemeathSkillForm.js";
import {
  DENIA_CANDY_PORTRAIT_ASSET,
  SIGRIKA_CORRUPTED_PLAYER_PORTRAIT_ASSET,
  SIGRIKA_CORRUPTED_PORTRAIT_ASSET
} from "./characterPortraitAssetCatalog.js";
import { modeOrderedEntries } from "./gameModes.js";
import { STARTORCH_COUPON } from "./startorchCoupon.js";
import {
  COSTUME_SHOP_BACKGROUND_IMAGE,
  COSTUME_SHOP_DIALOGUE_FRAME_IMAGE,
  COSTUME_SHOP_MOBILE_BACKGROUND_IMAGE,
  SHOP_BACKGROUND_IMAGE,
  SHOP_DIALOGUE_FRAME_IMAGE,
  SHOP_DIRECTION_SIGN_IMAGE,
  SHOP_MASCOT_DEFAULT_IMAGE,
  SHOP_MASCOT_THANKS_IMAGE,
  SHOP_MOBILE_BACKGROUND_IMAGE
} from "./shopMascotAssets.js";

export const RUNTIME_IMAGE_ASSETS = Object.freeze({
  home: Object.freeze([
    "/assets/home/home-main-panel-desktop.webp",
    "/assets/home/home-main-panel-mobile.webp",
    "/assets/home/home-paper-grid.svg",
    "/assets/home/student-id-hanging.png",
    "/assets/home/student-id-nameplate.webp",
    "/assets/home/home-header-sigrika.gif?v=170ms",
    "/assets/home/home-practice-zhunshibao.webp",

    STARTORCH_COUPON.src,
    "/assets/home/book-entry.webp",
    "/assets/home/fantasy-match-entry.webp",
    "/assets/home/home-utility-recruitment.webp",
    "/assets/home/home-utility-shop.webp",
    "/assets/home/home-utility-warehouse.webp",
    "/assets/home/home-utility-leaderboard.webp",
    "/assets/home/home-utility-watch.webp",
    "/assets/home/home-utility-friends.webp",
    "/assets/home/multipurpose-classroom-bg.webp",
    "/assets/home/selection-stamp-flag-v2.png",
    "/assets/home/selection-stamp-1-v2.png",
    "/assets/home/selection-stamp-2-v2.png",
    "/assets/home/selection-stamp-3-v2.png",
    "/assets/characters/bright-school-radio-player.png",
    ...modeOrderedEntries().map((mode) => mode.iconUrl)
  ]),
  shop: Object.freeze([
    SHOP_BACKGROUND_IMAGE,
    SHOP_MOBILE_BACKGROUND_IMAGE,
    COSTUME_SHOP_BACKGROUND_IMAGE,
    COSTUME_SHOP_MOBILE_BACKGROUND_IMAGE,
    SHOP_DIALOGUE_FRAME_IMAGE,
    COSTUME_SHOP_DIALOGUE_FRAME_IMAGE,
    SHOP_DIRECTION_SIGN_IMAGE,
    SHOP_MASCOT_DEFAULT_IMAGE,
    SHOP_MASCOT_THANKS_IMAGE,
    "/assets/costumes/nivora-greeting.webp",
    "/assets/costumes/nivora-thanks.webp",
    "/assets/costumes/nivora-empty.webp",
    "/assets/items/qiuyuan-zhouwo.webp",
    "/assets/items/rainbow-bean-candy.webp"
  ]),
  corruption: Object.freeze([
    SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url,
    SIGRIKA_CORRUPTED_PLAYER_PORTRAIT_ASSET.url
  ]),
  effects: Object.freeze([
    AEMEATH_SKILL_FORM_ASSET,
    DENIA_RUNE_ASSET,
    DENIA_SKILL_FORM_ASSET,
    DENIA_PAPER_ASSET,
    DENIA_CANDY_PORTRAIT,
    DENIA_CANDY_PORTRAIT_ASSET.avatarUrl,
    "/assets/boards/nabomo-color-illusion-board.webp",
    "/assets/effects/changli-fire-phoenix.svg",
    "/assets/effects/changli-flame-sprite.svg",
    "/assets/effects/denia-bubble-pop.webp",
    "/assets/effects/sigrika-erased-field-marker.webp",
    "/assets/stones/spray-stone.webp"
  ])
});

export const RUNTIME_AUDIO_ASSETS = Object.freeze({
  interaction: Object.freeze([
    STONE_SOUND,
    CAPTURE_SOUND,
    HIDDEN_HAND_REVEAL_SOUND,
    UI_CLOSE_WINDOW_SOUND,
    UI_CONFIRM_SOUND,
    UI_DETAIL_OPEN_SOUND,
    UI_FRIENDS_OPEN_SOUND,
    UI_HOUSE_OPEN_SOUND,
    UI_IRIS_DATABASE_OPEN_SOUND,
    UI_LEADERBOARD_OPEN_SOUND,
    UI_MATCH_OPEN_SOUND,
    UI_RECRUITMENT_OPEN_SOUND,
    UI_RESUME_OPEN_SOUND,
    UI_SHOP_OPEN_SOUND,
    UI_WAREHOUSE_OPEN_SOUND,
    UI_WATCH_OPEN_SOUND,
    UI_UNAVAILABLE_SOUND,
    RECRUITMENT_SUCCESS_SOUND,
    RECRUITMENT_MISS_SOUND,
    RECRUITMENT_MAGIC_CLOCK_FAST_FORWARD_SOUND
  ])
});
