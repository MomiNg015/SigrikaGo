import { useEffect, useRef, useState } from "react";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { characterThemeStyle } from "../../shared/characterDisplay.js";
import { resolveHandbookPortrait } from "../../shared/handbookPortraits.js";
import LegacyHouseCharacterGrid from "./LegacyHouseCharacterGrid.jsx";
import { activeCharacterItemEffects } from "./houseStats.js";
import { handbookPuzzleLayout, insetHandbookPiece, orderHandbookCharacters } from "./handbookPuzzle.js";

export default function HouseCharacterGrid(props) {
  const boardRef = useRef(null);
  const [mobile, setMobile] = useState(false);
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const [page, setPage] = useState(0);
  const { panelId, labelledBy, characters, owned, itemEffects, user, sigrikaCorrupted,
    onOpenCharacterDetail, onOpenUnknownDetail, candyEffectCancellationEnabled,
    cancellingCandyEffect, onCancelCandyEffect } = props;
  useEffect(() => {
    const media = window.matchMedia?.("(max-width: 768px)");
    if (!media) return undefined;
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const board = boardRef.current;
    if (!board || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width && entry.contentRect.height) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, [sigrikaCorrupted]);
  if (sigrikaCorrupted) return <LegacyHouseCharacterGrid {...props} />;
  const ordered = orderHandbookCharacters(characters);
  const pages = Math.max(1, Math.ceil(ordered.length / 10));
  const currentPage = Math.min(page, pages - 1);
  const roster = ordered.slice(currentPage * 10, currentPage * 10 + 10);
  const pieces = handbookPuzzleLayout(mobile);
  return (
    <div className="handbook-puzzle-panel" id={panelId} role={panelId ? "tabpanel" : undefined}
      aria-labelledby={labelledBy} tabIndex={panelId ? 0 : undefined}>
      <div className="handbook-puzzle-board" ref={boardRef}>
        {pieces.map((piece, index) => {
          const character = roster[index];
          const { bbox, portraitRegion } = piece;
          const points = insetHandbookPiece(piece, size, mobile ? 1 : 1.5);
          const clipPath = `polygon(${points.map(([x, y]) => `${(x - bbox.x) / bbox.width * 100}% ${(y - bbox.y) / bbox.height * 100}%`).join(",")})`;
          const placement = { left: `${bbox.x}%`, top: `${bbox.y}%`, width: `${bbox.width}%`, height: `${bbox.height}%` };
          if (!character) return <div key={`empty-${index}`} className="handbook-puzzle-piece is-empty" style={placement} aria-hidden="true">
            <span className="handbook-puzzle-tile" style={{ "--handbook-piece-clip": clipPath }} />
          </div>;
          const id = canonicalCharacterId(character.id);
          const isOwned = owned.has(id);
          const hideIntel = id === "baconbits" && !isOwned;
          const portrait = resolveHandbookPortrait(character, { itemEffects, user });
          const scale = size.width * (mobile ? .465 : .285) / portrait.cropWidth;
          const anchorX = portraitRegion.center[0] * size.width / 100;
          const anchorY = Math.max(portraitRegion.center[1] * size.height / 100,
            bbox.y * size.height / 100 + (portrait.focal[1] - portrait.visibleTop) * scale + 4);
          const artStyle = {
            width: portrait.width * scale, height: portrait.height * scale,
            left: anchorX - bbox.x * size.width / 100 - portrait.focal[0] * scale,
            top: anchorY - bbox.y * size.height / 100 - portrait.focal[1] * scale,
            ...portrait.style
          };
          const effects = activeCharacterItemEffects(id, itemEffects);
          return <div key={character.id} className={`handbook-puzzle-piece${isOwned ? " is-owned" : " is-unowned"}`}
            style={{ ...placement, ...characterThemeStyle(character) }}>
            <button type="button" className="handbook-puzzle-tile" style={{ "--handbook-piece-clip": clipPath }}
              aria-label={hideIntel ? "未知角色详情" : `${character.name}角色详情${isOwned ? "" : "（未拥有）"}`}
              title={hideIntel ? "暂无情报" : character.name} data-ui-sound="none"
              data-home-guide={id === "sigrika" ? "sigrika-card" : undefined}
              onClick={() => hideIntel ? onOpenUnknownDetail?.() : onOpenCharacterDetail(character)}>
              {isOwned ? <span className="handbook-puzzle-art">
                <img className="handbook-puzzle-portrait" style={artStyle} src={portrait.src}
                  alt="" decoding="async" draggable="false" />
              </span> : <>
                <span className="handbook-puzzle-silhouette" style={{ ...artStyle,
                  maskImage: `url("${portrait.src}")`, WebkitMaskImage: `url("${portrait.src}")` }} />
                <span className="handbook-puzzle-question" style={{
                  left: anchorX - bbox.x * size.width / 100,
                  top: anchorY - bbox.y * size.height / 100 }}>?</span>
              </>}
            </button>
            {effects.length > 0 && <div className={`character-item-effect-badges handbook-puzzle-effects${candyEffectCancellationEnabled ? " is-interactive" : ""}`}
              style={{ left: `${(portraitRegion.center[0] - bbox.x) / bbox.width * 100}%`, top: `${(portraitRegion.center[1] - bbox.y) / bbox.height * 100}%` }}
              aria-label={`${character.name}道具效果`}>
              {effects.map((effect) => candyEffectCancellationEnabled ? <button key={effect.effectKey}
                type="button" className="character-item-effect-cancel" aria-label={`取消${character.name}的${effect.label}`}
                title="点击取消效果（仅开发环境）" disabled={cancellingCandyEffect === id}
                onClick={() => onCancelCandyEffect?.(id)}>
                <img className="character-item-effect-icon" src={effect.icon} alt={effect.label} title={effect.label} />
              </button> : <img key={effect.effectKey} className="character-item-effect-icon" src={effect.icon} alt={effect.label} title={effect.label} />)}
            </div>}
          </div>;
        })}
      </div>
      {pages > 1 && <nav className="handbook-puzzle-pages" aria-label="角色画板分页">
        <button type="button" disabled={!currentPage} onClick={() => setPage(currentPage - 1)}>上一页</button>
        <span>{currentPage + 1} / {pages}</span>
        <button type="button" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>下一页</button>
      </nav>}
    </div>
  );
}
