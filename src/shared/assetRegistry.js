import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  RECRUITMENT_MISS_SOUND,
  RECRUITMENT_SUCCESS_SOUND,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_RECRUITMENT_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_UNAVAILABLE_SOUND
} from "./audioAssets.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";
import {
  SHOP_MASCOT_DEFAULT_IMAGE,
  SHOP_MASCOT_THANKS_IMAGE,
  SHOP_WALLET_IMAGE
} from "./shopMascotAssets.js";

export const RUNTIME_IMAGE_ASSETS = Object.freeze({
  home: Object.freeze([
    "/assets/home/book-entry.webp",
    "/assets/home/fantasy-match-entry.webp",
    "/assets/home/home-utility-recruitment.webp",
    "/assets/home/home-utility-shop.webp",
    "/assets/home/home-utility-warehouse.webp",
    "/assets/home/home-utility-leaderboard.webp",
    "/assets/home/home-utility-watch.webp",
    "/assets/home/home-utility-friends.webp",
    "/assets/home/multipurpose-classroom-bg.webp"
  ]),
  shop: Object.freeze([
    SHOP_MASCOT_DEFAULT_IMAGE,
    SHOP_MASCOT_THANKS_IMAGE,
    SHOP_WALLET_IMAGE,
    "/assets/items/qiuyuan-zhouwo.webp",
    "/assets/items/rainbow-bean-candy.webp"
  ]),
  effects: Object.freeze([
    DENIA_CANDY_PORTRAIT,
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
    UI_HOUSE_OPEN_SOUND,
    UI_MATCH_OPEN_SOUND,
    UI_RECRUITMENT_OPEN_SOUND,
    UI_SHOP_OPEN_SOUND,
    UI_UNAVAILABLE_SOUND,
    RECRUITMENT_SUCCESS_SOUND,
    RECRUITMENT_MISS_SOUND
  ])
});
