import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  getSkillTraitCatalogSnapshot,
  loadCachedPublicSkillTraitCatalog,
  subscribeSkillTraitCatalog
} from "../app/skillTraitCatalog.js";
import { SKILL_TRAIT_TOKEN_PATTERN, skillTraitMap } from "./skillTraits.js";

export default function SkillDescription({
  className = "",
  description = "",
  overclockText = "",
  traits,
  floatingLayerZ,
  onPopoverOpenChange
}) {
  const loadedTraits = usePublicSkillTraits();
  const glossary = useMemo(() => skillTraitMap(traits ?? loadedTraits), [loadedTraits, traits]);
  const [openTrait, setOpenTrait] = useState(null);
  const popoverId = useId();
  const parts = useMemo(
    () => descriptionParts(description, glossary),
    [description, glossary]
  );

  useEffect(() => {
    onPopoverOpenChange?.(Boolean(openTrait));
    return () => onPopoverOpenChange?.(false);
  }, [onPopoverOpenChange, openTrait]);

  function toggleTrait(event, part) {
    event.stopPropagation();
    const key = `${part.index}:${part.trait.name}`;
    if (openTrait?.key === key) {
      setOpenTrait(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const keyboardActivation = event.detail === 0 || (!event.clientX && !event.clientY);
    setOpenTrait({
      key,
      trait: part.trait,
      anchor: keyboardActivation
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: event.clientX, y: event.clientY }
    });
  }

  return (
    <div className={`skill-description ${className}`.trim()}>
      {overclockText && <div className="skill-overclock-line">{overclockText}</div>}
      <div className="skill-description-body">
        {parts.map((part) => part.type === "trait" ? (
          <button
            key={part.key}
            className="skill-trait-token"
            type="button"
            aria-expanded={openTrait?.key === `${part.index}:${part.trait.name}`}
            aria-controls={openTrait?.key === `${part.index}:${part.trait.name}` ? popoverId : undefined}
            aria-label={`特性词【${part.trait.name}】，点击查看释义`}
            onClick={(event) => toggleTrait(event, part)}
          >
            【{part.trait.name}】
          </button>
        ) : (
          <span key={part.key}>{part.text}</span>
        ))}
      </div>
      {openTrait && (
        <SkillTraitPopover
          id={popoverId}
          openTrait={openTrait}
          floatingLayerZ={floatingLayerZ}
          onClose={() => setOpenTrait(null)}
        />
      )}
    </div>
  );
}

export function descriptionParts(description, glossary) {
  const text = String(description ?? "");
  const parts = [];
  let cursor = 0;
  let index = 0;
  for (const match of text.matchAll(SKILL_TRAIT_TOKEN_PATTERN)) {
    if (match.index > cursor) {
      parts.push({ type: "text", text: text.slice(cursor, match.index), key: `text-${index}` });
    }
    const trait = glossary.get(match[1]);
    if (trait) {
      parts.push({ type: "trait", trait, index, key: `trait-${index}-${trait.id ?? trait.name}` });
    } else {
      parts.push({ type: "text", text: match[0], key: `unknown-${index}` });
    }
    cursor = match.index + match[0].length;
    index += 1;
  }
  if (cursor < text.length || parts.length === 0) {
    parts.push({ type: "text", text: text.slice(cursor), key: `text-${index}` });
  }
  return parts;
}

export function positionSkillTraitPopover(anchor, size, viewport = globalThis) {
  const width = Math.max(0, Number(size?.width) || 0);
  const height = Math.max(0, Number(size?.height) || 0);
  const viewportWidth = Number(viewport?.innerWidth) || 0;
  const viewportHeight = Number(viewport?.innerHeight) || 0;
  const margin = 12;
  const gap = 12;
  const aboveY = anchor.y - gap - height;
  const belowY = anchor.y + gap;
  const fitsAbove = aboveY >= margin;
  const fitsBelow = belowY + height <= viewportHeight - margin;
  const placement = fitsAbove || (!fitsBelow && anchor.y > viewportHeight / 2) ? "above" : "below";
  const desiredY = placement === "above" ? aboveY : belowY;
  const maxX = Math.max(margin, viewportWidth - width - margin);
  const maxY = Math.max(margin, viewportHeight - height - margin);
  const x = clamp(anchor.x - width / 2, margin, maxX);
  const y = clamp(desiredY, margin, maxY);
  return {
    x,
    y,
    placement,
    arrowX: clamp(anchor.x - x, 16, Math.max(16, width - 16))
  };
}

function SkillTraitPopover({ id, openTrait, floatingLayerZ, onClose }) {
  const popoverRef = useRef(null);
  const [position, setPosition] = useState(() => positionSkillTraitPopover(
    openTrait.anchor,
    { width: Math.min(280, Math.max(0, (globalThis.innerWidth ?? 304) - 24)), height: 110 }
  ));

  useLayoutEffect(() => {
    const element = popoverRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setPosition(positionSkillTraitPopover(openTrait.anchor, rect));
  }, [openTrait]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  useEffect(() => {
    const isCurrentTrigger = (target) => target?.closest?.(".skill-trait-token")?.getAttribute("aria-controls") === id;
    const isPopover = (target) => Boolean(target?.closest?.(".skill-trait-popover"));
    const onPointerDown = (event) => {
      if (isPopover(event.target) || isCurrentTrigger(event.target)) return;
      event.__skillTraitTopLayer = true;
    };
    const onDocumentClick = (event) => {
      if (isPopover(event.target) || isCurrentTrigger(event.target)) return;
      if (event.target?.closest?.(".skill-trait-token")) {
        onClose();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [id, onClose]);

  if (typeof document === "undefined") return null;
  const numericFloatingLayerZ = Number(floatingLayerZ);
  const layerStyle = Number.isFinite(numericFloatingLayerZ)
    ? { "--room-floating-z": Math.max(120, numericFloatingLayerZ) }
    : undefined;
  return createPortal(
    <aside
        ref={popoverRef}
        id={id}
        className="skill-trait-popover"
        style={{
          ...layerStyle,
          left: `${position.x}px`,
          top: `${position.y}px`,
          "--skill-trait-arrow-x": `${position.arrowX}px`
        }}
        data-placement={position.placement}
        role="tooltip"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="skill-trait-popover-content">
          <strong>【{openTrait.trait.name}】</strong>
          <p>{openTrait.trait.definition}</p>
        </div>
    </aside>,
    document.body
  );
}

function usePublicSkillTraits() {
  const traits = useSyncExternalStore(
    subscribeSkillTraitCatalog,
    getSkillTraitCatalogSnapshot,
    getSkillTraitCatalogSnapshot
  );
  useEffect(() => {
    loadCachedPublicSkillTraitCatalog().catch(() => {});
  }, []);
  return traits;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
