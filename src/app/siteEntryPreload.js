import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { preloadImageAssets } from "../shared/preloadAssets.js";
import { markAuthPortraitReady } from "./authPortraitPrewarm.js";
import { loadPublicCharacterCatalog } from "./characterCatalog.js";
import { loadPublicSiteSettings } from "./siteSettingsCatalog.js";

export const SITE_ENTRY_IMAGES = [
  "/assets/login-sigrika-mascot.webp",
  "/assets/preload/orange-mascot.png"
];
export const SITE_ENTRY_FONTS = [
  '400 16px "Sigrika Accent Latin"',
  '400 16px "Sigrika Window Title"'
];

export function siteEntryPortraits(characters = CHARACTERS) {
  return [...new Set([...Object.values(CHARACTERS), ...Object.values(characters)]
    .map((character) => character?.portrait).filter(Boolean))];
}

export async function preloadSiteEntry({
  loadCharacters = loadPublicCharacterCatalog,
  loadSettings = loadPublicSiteSettings,
  preloadImages = preloadImageAssets,
  loadFont = (font) => document.fonts?.load(font, "SigrikaGo0123456789正在加载中"),
  rememberPortrait = markAuthPortraitReady,
  onProgress = () => {},
  timeoutMs = 8000
} = {}) {
  onProgress(0);
  const [characters, siteSettings] = await Promise.all([
    settleWithin(loadCharacters, CHARACTERS, timeoutMs),
    settleWithin(loadSettings, DEFAULT_SITE_SETTINGS, timeoutMs)
  ]);
  onProgress(0.1);
  const portraits = new Set(siteEntryPortraits(characters));
  const images = [...new Set([...SITE_ENTRY_IMAGES, ...portraits])];
  const total = images.length + SITE_ENTRY_FONTS.length;
  const skipped = [];
  let imageProgress = 0;
  let fontsCompleted = 0;
  const report = () => onProgress(0.1 + 0.9 * (imageProgress * images.length + fontsCompleted) / total);
  await Promise.all([
    preloadImages(images, {
      concurrency: 4,
      taskTimeoutMs: timeoutMs,
      onLoaded: (src) => { if (portraits.has(src)) rememberPortrait(src); },
      onSkipped: (src) => skipped.push(src),
      onProgress: (progress) => { imageProgress = progress; report(); }
    }),
    ...SITE_ENTRY_FONTS.map(async (font) => {
      await settleWithin(() => loadFont(font), null, timeoutMs);
      fontsCompleted += 1;
      report();
    })
  ]);
  onProgress(1);
  return { characters, siteSettings, skipped };
}

async function settleWithin(load, fallback, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(load).catch(() => fallback),
      new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), timeoutMs); })
    ]);
  } finally {
    clearTimeout(timer);
  }
}
