import { createElement, useState } from "react";
import { WINDOW_TITLE_STICKERS } from "../shared/windowTitleStickers.js";

export default function WindowTitleSticker({ titleKey, as = "h2", id, enabled = true }) {
  const asset = WINDOW_TITLE_STICKERS[titleKey];
  const [loadedSrc, setLoadedSrc] = useState("");
  if (!asset) return null;
  if (!enabled) return createElement(as, { id }, asset.title);

  return createElement(as, {
    id,
    className: `window-title-sticker${loadedSrc === asset.src ? " has-loaded-art" : ""}`,
    style: {
      "--window-title-width": `${asset.width}px`,
      "--window-title-height": `${asset.height}px`
    }
  },
  <span className="window-title-sticker-label">{asset.title}</span>,
  <img
    className="window-title-sticker-art"
    src={asset.src}
    alt=""
    aria-hidden="true"
    draggable="false"
    decoding="async"
    onLoad={() => setLoadedSrc(asset.src)}
    onError={() => setLoadedSrc("")}
  />);
}
