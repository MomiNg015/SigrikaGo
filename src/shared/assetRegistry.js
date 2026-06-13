import {
  CAPTURE_SOUND,
  HIDDEN_HAND_REVEAL_SOUND,
  STONE_SOUND,
  UI_CLOSE_WINDOW_SOUND,
  UI_CONFIRM_SOUND,
  UI_DETAIL_OPEN_SOUND,
  UI_HOUSE_OPEN_SOUND,
  UI_MATCH_OPEN_SOUND,
  UI_SHOP_OPEN_SOUND,
  UI_UNAVAILABLE_SOUND
} from "./audioAssets.js";
import { DENIA_CANDY_PORTRAIT } from "./candyPortraits.js";

export const RUNTIME_IMAGE_ASSETS = Object.freeze({
  home: Object.freeze([
    "/assets/home/book-entry.webp",
    "/assets/home/fantasy-match-entry.webp",
    "/assets/home/multipurpose-classroom-bg.webp"
  ]),
  shop: Object.freeze([
    "/assets/zahiya_shop.webp",
    "/assets/items/rainbow-bean-candy.webp"
  ]),
  effects: Object.freeze([
    DENIA_CANDY_PORTRAIT,
    "/assets/effects/denia-bubble-pop.webp"
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
    UI_SHOP_OPEN_SOUND,
    UI_UNAVAILABLE_SOUND
  ])
});
