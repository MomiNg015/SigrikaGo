import { useEffect, useRef, useState } from "react";
import { canonicalCharacterId } from "../../shared/characterAliases.js";
import { characterThemeStyle } from "../../shared/characterDisplay.js";
import { resolveHandbookPortrait } from "../../shared/handbookPortraits.js";
import LegacyHouseCharacterGrid from "./LegacyHouseCharacterGrid.jsx";
import { activeCharacterItemEffects } from "./houseStats.js";
import { HANDBOOK_STRIP_LAYOUT, HANDBOOK_STRIP_PAGE_SIZE, handbookStripArtStyle, handbookStripPage } from "./handbookStrips.js";

const HANDBOOK_ORNAMENTS = {
  sigrika: "/assets/characters/handbook-ornaments/sigrika.png",
  denia: "/assets/characters/handbook-ornaments/denia.png",
  nabomo: "/assets/characters/handbook-ornaments/nabomo.png"
};

export default function HouseCharacterGrid(props) {
  const boardRef = useRef(null);
  const inputMode = useRef("keyboard");
  const hoveredKey = useRef(null);
  const focusedKey = useRef(null);
  const suppressRestorePreview = useRef(null);
  const ignoreHoverUntilMove = useRef(false);
  const touchContact = useRef(false);
  const releaseTimer = useRef(null);
  const [mobile, setMobile] = useState(false);
  const [size, setSize] = useState({ width: 1000, height: 430 });
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const { panelId, labelledBy, characters, owned, itemEffects, user, sigrikaCorrupted,
    onOpenCharacterDetail, candyEffectCancellationEnabled,
    cancellingCandyEffect, onCancelCandyEffect } = props;
  useEffect(() => {
    const media = window.matchMedia?.("(max-width: 768px)");
    if (!media) return undefined;
    const update = () => { setMobile(media.matches); hoveredKey.current = null; focusedKey.current = null; setExpanded(null); };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const keyboardInput = () => { inputMode.current = "keyboard"; };
    window.addEventListener("keydown", keyboardInput, true);
    return () => { window.removeEventListener("keydown", keyboardInput, true); window.clearTimeout(releaseTimer.current); };
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
  const changePage = (next) => { setPage(next); hoveredKey.current = null; focusedKey.current = null; setExpanded(null); };
  const clearPointerPreview = () => {
    window.clearTimeout(releaseTimer.current);
    releaseTimer.current = null;
    touchContact.current = false;
    hoveredKey.current = null;
    setExpanded(focusedKey.current);
  };
  const leavePointerPreview = () => {
    // Non-hovering pointers also emit leave between pointerup and click.
    // The pending release cleanup already handles that post-click boundary.
    if (touchContact.current) return;
    clearPointerPreview();
  };
  return (
    <div className="handbook-puzzle-panel" id={panelId} role={panelId ? "tabpanel" : undefined}
      aria-labelledby={labelledBy} tabIndex={panelId ? 0 : undefined} onScroll={clearPointerPreview}>
      <div className="handbook-puzzle-board" ref={boardRef}
        style={{ "--handbook-desktop-slant": `${HANDBOOK_STRIP_LAYOUT.slant}px`,
          "--handbook-desktop-gap": `${HANDBOOK_STRIP_LAYOUT.gap}px`,
          "--handbook-expanded-grow": HANDBOOK_STRIP_LAYOUT.expandedGrow }}
        onPointerLeave={leavePointerPreview}>
        {roster.map((character, index) => {
          const id = canonicalCharacterId(character.id);
          const isOwned = owned.has(id);
          const hideIntel = id === "baconbits" && !isOwned;
          const isExpanded = isOwned && expanded === character.id;
          const portrait = hideIntel ? null : resolveHandbookPortrait(character, { itemEffects, user });
          const catalogIndex = currentPage * HANDBOOK_STRIP_PAGE_SIZE + index;
          const artStyle = portrait && handbookStripArtStyle(portrait, size, { mobile, expanded: isExpanded, count: roster.length, index: catalogIndex });
          const effects = isOwned ? activeCharacterItemEffects(id, itemEffects) : [];
          return <div key={character.id}
            className={`handbook-puzzle-piece${isOwned ? " is-owned" : " is-unowned"}${hideIntel ? " is-missing-data" : ""}${isExpanded ? " is-expanded" : ""}`}
            style={characterThemeStyle(character)} data-character-id={id} data-portrait-side={catalogIndex % 2 ? "right" : "left"}
            onPointerEnter={(event) => {
              if (!isOwned) return;
              if (event.pointerType === "mouse" && !ignoreHoverUntilMove.current
                && !event.nativeEvent.sourceCapabilities?.firesTouchEvents) {
                hoveredKey.current = character.id;
                setExpanded(character.id);
              }
            }}
            onPointerMove={(event) => {
              if (!isOwned) return;
              if (event.pointerType !== "mouse" || touchContact.current
                || event.nativeEvent.sourceCapabilities?.firesTouchEvents) return;
              // Removing a dialog can synthesize mouse enter/move at the last
              // touch position. Re-arm only after genuine pointer movement.
              if (ignoreHoverUntilMove.current && !event.movementX && !event.movementY) return;
              ignoreHoverUntilMove.current = false;
              hoveredKey.current = character.id;
              setExpanded(character.id);
            }}
            onPointerLeave={() => { if (hoveredKey.current === character.id) leavePointerPreview(); }}>
            <button type="button" className="handbook-puzzle-tile"
              disabled={!isOwned}
              data-character-key={character.id}
              aria-label={isOwned ? `${character.name}角色详情` : hideIntel ? "暂无情报" : "未拥有角色"}
              aria-expanded={isExpanded} title={isOwned ? character.name : undefined} data-ui-sound="none"
              data-home-guide={isOwned && id === "sigrika" ? "sigrika-card" : undefined}
              onPointerDown={(event) => {
                if (!isOwned) return;
                inputMode.current = "pointer";
                focusedKey.current = null;
                // Touch feedback must not change the row geometry under the
                // contact; the native click still opens this exact strip.
                if (event.pointerType !== "mouse") {
                  window.clearTimeout(releaseTimer.current);
                  ignoreHoverUntilMove.current = true;
                  touchContact.current = true;
                }
              }}
              onPointerUp={(event) => {
                if (!isOwned) return;
                // Native click follows pointerup. Preserve an already-expanded
                // hit target until that click; a non-activating release resets
                // on the next task rather than leaving a touch preview latched.
                if (event.pointerType !== "mouse") releaseTimer.current = window.setTimeout(clearPointerPreview, 0);
              }}
              onPointerCancel={clearPointerPreview}
              onFocus={() => {
                if (!isOwned) return;
                if (suppressRestorePreview.current === character.id) { suppressRestorePreview.current = null; return; }
                if (inputMode.current === "keyboard") { focusedKey.current = character.id; setExpanded(character.id); }
              }}
              onKeyDown={(event) => {
                if (!isOwned) return;
                if (event.key !== "Escape") {
                  inputMode.current = "keyboard";
                  suppressRestorePreview.current = null;
                  focusedKey.current = character.id;
                  setExpanded(character.id);
                }
              }}
              onBlur={() => {
                if (focusedKey.current === character.id) focusedKey.current = null;
                if (!touchContact.current) setExpanded(hoveredKey.current);
              }}
              onClick={(event) => {
                if (!isOwned) return;
                const pointerActivation = event.detail > 0 || inputMode.current === "pointer";
                if (pointerActivation) inputMode.current = "pointer";
                event.currentTarget.focus({ preventScroll: true });
                // Restoration may follow Escape or a synthetic guide click.
                // Keep it collapsed until a new hover or keyboard interaction.
                suppressRestorePreview.current = character.id;
                ignoreHoverUntilMove.current = true;
                window.clearTimeout(releaseTimer.current);
                releaseTimer.current = null;
                touchContact.current = false;
                hoveredKey.current = null;
                focusedKey.current = null;
                setExpanded(null);
                onOpenCharacterDetail(character);
              }}>
              {isOwned && <span className="handbook-strip-paper" aria-hidden="true">
                {HANDBOOK_ORNAMENTS[id] && <span className="handbook-strip-ornament"
                  style={{ maskImage: `url("${HANDBOOK_ORNAMENTS[id]}")`,
                    WebkitMaskImage: `url("${HANDBOOK_ORNAMENTS[id]}")` }} />}
              </span>}
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
              {isOwned && <span className="handbook-strip-name">{character.name}</span>}
            </button>
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
