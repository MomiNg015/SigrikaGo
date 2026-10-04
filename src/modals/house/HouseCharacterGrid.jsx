import { useEffect, useRef, useState } from "react";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { characterThemeStyle } from "../../shared/characterDisplay.js";
import { resolveHandbookPortrait } from "../../shared/handbookPortraits.js";
import LegacyHouseCharacterGrid from "./LegacyHouseCharacterGrid.jsx";
import { activeCharacterItemEffects } from "./houseStats.js";
import { HANDBOOK_STRIP_PAGE_SIZE, handbookStripArtStyle, handbookStripPage } from "./handbookStrips.js";

export default function HouseCharacterGrid(props) {
  const boardRef = useRef(null);
  const [mobile, setMobile] = useState(false);
  const [size, setSize] = useState({ width: 1000, height: 430 });
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const { panelId, labelledBy, characters, owned, itemEffects, user, sigrikaCorrupted,
    onOpenCharacterDetail, onOpenUnknownDetail, candyEffectCancellationEnabled,
    cancellingCandyEffect, onCancelCandyEffect } = props;
  useEffect(() => {
    const media = window.matchMedia?.("(max-width: 768px)");
    if (!media) return undefined;
    const update = () => { setMobile(media.matches); setExpanded(null); };
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
  const { pages, currentPage, roster } = handbookStripPage(characters, page);
  const changePage = (next) => { setPage(next); setExpanded(null); };
  return (
    <div className="handbook-puzzle-panel" id={panelId} role={panelId ? "tabpanel" : undefined}
      aria-labelledby={labelledBy} tabIndex={panelId ? 0 : undefined}>
      <div className="handbook-puzzle-board" ref={boardRef}
        onPointerLeave={() => {
          if (!mobile) {
            const focusedTile = boardRef.current?.querySelector(".handbook-puzzle-tile:focus-visible");
            setExpanded(focusedTile?.dataset.characterKey ?? null);
          }
        }}>
        {roster.map((character, index) => {
          const id = canonicalCharacterId(character.id);
          const isOwned = owned.has(id);
          const hideIntel = id === "baconbits" && !isOwned;
          const isExpanded = expanded === character.id;
          const portrait = hideIntel ? null : resolveHandbookPortrait(character, { itemEffects, user });
          const catalogIndex = currentPage * HANDBOOK_STRIP_PAGE_SIZE + index;
          const artStyle = portrait && handbookStripArtStyle(portrait, size, { mobile, expanded: isExpanded, count: roster.length, index: catalogIndex });
          const effects = hideIntel ? [] : activeCharacterItemEffects(id, itemEffects);
          const openDetail = () => hideIntel ? onOpenUnknownDetail?.() : onOpenCharacterDetail(character);
          return <div key={character.id}
            className={`handbook-puzzle-piece${isOwned ? " is-owned" : " is-unowned"}${hideIntel ? " is-missing-data" : ""}${isExpanded ? " is-expanded" : ""}`}
            style={characterThemeStyle(character)} data-character-id={id} data-portrait-side={catalogIndex % 2 ? "right" : "left"}
            onPointerEnter={(event) => { if (event.pointerType === "mouse") setExpanded(character.id); }}>
            <button type="button" className="handbook-puzzle-tile"
              data-character-key={character.id}
              aria-label={hideIntel ? "未知角色详情" : `${character.name}角色详情${isOwned ? "" : "（未拥有）"}`}
              aria-expanded={isExpanded} title={hideIntel ? "暂无情报" : character.name} data-ui-sound="none"
              data-home-guide={id === "sigrika" ? "sigrika-card" : undefined}
              onFocus={() => setExpanded(character.id)}
              onBlur={(event) => { if (!mobile && !event.currentTarget.parentElement.contains(event.relatedTarget)) setExpanded(null); }}
              onClick={(event) => {
                // Guide clicks and keyboard activation open details immediately;
                // an ordinary narrow-view tap reveals the explicit detail action.
                if (mobile && event.detail > 0) setExpanded(character.id);
                else openDetail();
              }}>
              {hideIntel ? <>
                <span className="handbook-missing-data" aria-hidden="true"><i /><i /><i /></span>
                <span className="handbook-missing-label">暂无情报</span>
              </> : isOwned ? <span className="handbook-puzzle-art">
                <img className="handbook-puzzle-portrait" style={artStyle} src={portrait.src}
                  alt="" decoding="async" draggable="false" />
              </span> : <>
                <span className="handbook-puzzle-silhouette" style={{ ...artStyle,
                  maskImage: `url("${portrait.src}")`, WebkitMaskImage: `url("${portrait.src}")` }} />
                <span className="handbook-puzzle-question">?</span>
              </>}
              {!hideIntel && <span className="handbook-strip-name">{character.name}</span>}
            </button>
            {mobile && isExpanded && <button type="button" className="handbook-strip-detail-action"
              onClick={(event) => {
                // Keep dialog focus restoration attached to the stable primary
                // trigger even if an orientation change removes this action.
                event.currentTarget.parentElement.querySelector(".handbook-puzzle-tile").focus();
                openDetail();
              }} aria-label={hideIntel ? "查看未知角色详情" : `查看${character.name}详情`}>查看详情 <span aria-hidden="true">↗</span></button>}
            {effects.length > 0 && <div className={`character-item-effect-badges handbook-puzzle-effects${candyEffectCancellationEnabled ? " is-interactive" : ""}`}
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
      {!roster.length && <p className="quiet-text">暂无角色</p>}
      {pages > 1 && <nav className="handbook-puzzle-pages" aria-label="角色立绘分页">
        <button type="button" disabled={!currentPage} onClick={() => changePage(currentPage - 1)}>上一页</button>
        <span>{currentPage + 1} / {pages}</span>
        <button type="button" disabled={currentPage === pages - 1} onClick={() => changePage(currentPage + 1)}>下一页</button>
      </nav>}
    </div>
  );
}
