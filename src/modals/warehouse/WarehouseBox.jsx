import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { ModalDialog } from "../modalComponents.jsx";
import { BookmarkPaper } from "../WindowBookmarkTabs.jsx";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { ItemArt, WarehouseDirectory, WarehouseInspector } from "./WarehouseItemGrid.jsx";
import { useWarehouseListRows } from "./useWarehouseListRows.js";

const MAX_COPIES_PER_ITEM = 10;
const GOLDEN_ANGLE = 137.508;
const MAX_COVERAGE = .195;

function overlap(first, second) {
  const span = (axis) => Math.max(0, Math.min(first[axis] + first.radius, second[axis] + second.radius)
    - Math.max(first[axis] - first.radius, second[axis] - second.radius));
  return span("left") * span("top");
}

function tryPlacement(box, candidate, boxes) {
  const budget = (candidate.radius * 2) ** 2 * MAX_COVERAGE;
  const neighbors = boxes.filter(other => other !== box);
  const intersections = neighbors.map(other => overlap(candidate, other));
  const coverage = intersections.reduce((total, intersection) => total + intersection, 0);
  if (coverage > budget || neighbors.some((other, index) => other.coverage - overlap(box, other) + intersections[index] > other.budget)) return;
  neighbors.forEach((other, index) => { other.coverage += intersections[index] - overlap(box, other); });
  Object.assign(box, candidate, { budget, coverage });
}

function itemRandom(seed, itemId) {
  let state = seed;
  for (const character of String(itemId)) state = Math.imul(state ^ character.codePointAt(0), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 0x100000000;
  };
}

function scatterItems(items, seed) {
  return [...items].sort((first, second) => first.quantity - second.quantity).flatMap((item, index) => {
    const random = itemRandom(seed, item.itemId);
    const baseAngle = random() * 360;
    return Array.from({ length: Math.min(MAX_COPIES_PER_ITEM, item.quantity) }, (_, copy) => ({
      item, key: `${item.itemId}-${copy}`,
      angle: (baseAngle + copy * GOLDEN_ANGLE + random() * 18) % 360,
      zIndex: items.length - index
    }));
  });
}

function placeItems(entries, width, height, seed, obstacles) {
  if (!entries.length) return new Map();
  const floorLeft = width * .085 + 6;
  const floorRight = width * .91 - 6;
  const floorTop = height * .12 + 9;
  const floorBottom = height * .85 - 9;
  const floorWidth = floorRight - floorLeft;
  const floorHeight = floorBottom - floorTop;
  const maximumSize = entries.length <= 5 ? 188 : 148;
  const hasControl = (left, top, right, bottom) => obstacles.some(control =>
    left < control.right && right > control.left && top < control.bottom && bottom > control.top);
  let grid;
  for (let columns = 1; columns <= entries.length + 3; columns++) {
    const cellWidth = floorWidth / columns;
    const minimumRows = Math.ceil(entries.length / columns);
    for (let rows = minimumRows; rows <= minimumRows + 3; rows++) {
      const cellHeight = floorHeight / rows;
      const side = Math.min(cellWidth, cellHeight);
      if (side <= (grid?.side ?? 0)) break;
      const slots = [];
      for (let slot = 0; slot < columns * rows; slot++) {
        const left = floorLeft + slot % columns * cellWidth;
        const top = floorTop + Math.floor(slot / columns) * cellHeight;
        if (!hasControl(left, top, left + cellWidth, top + cellHeight)) slots.push({ left, top });
      }
      if (slots.length >= entries.length) grid = { slots, cellWidth, cellHeight, side };
    }
  }
  if (!grid) return new Map();
  const { slots, cellWidth, cellHeight, side } = grid;
  const random = itemRandom(seed, "floor");
  const boxes = entries.map(entry => {
    const pick = Math.floor(random() * slots.length);
    const slot = slots[pick];
    slots[pick] = slots.at(-1);
    slots.pop();
    const radians = entry.angle * Math.PI / 180;
    const rotationFootprint = Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians));
    const size = Math.min(maximumSize, side * .91 / rotationFootprint);
    const footprint = size * rotationFootprint;
    const left = slot.left + footprint / 2 + random() * (cellWidth - footprint);
    const top = slot.top + footprint / 2 + random() * (cellHeight - footprint);
    return { entry, left, top, size, radius: footprint / 2, budget: footprint ** 2 * MAX_COVERAGE, coverage: 0 };
  });
  const constrain = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  function tryFloorPlacement(box, candidate) {
    const { left, top, radius } = candidate;
    if (!hasControl(left - radius, top - radius, left + radius, top + radius)) tryPlacement(box, candidate, boxes);
  }
  for (let pass = 0; pass < 2; pass++) {
    for (const box of boxes) {
      const candidate = {
        radius: box.radius,
        left: constrain(box.left + (random() - .5) * cellWidth * .75, floorLeft + box.radius, floorRight - box.radius),
        top: constrain(box.top + (random() - .5) * cellHeight * .75, floorTop + box.radius, floorTop + floorHeight - box.radius)
      };
      tryFloorPlacement(box, candidate);
    }
  }
  for (let pass = 0; pass < 4; pass++) {
    for (const box of boxes) {
      const size = Math.min(maximumSize, box.size * (pass < 2 ? 1.12 : 1.045));
      if (size === box.size) continue;
      const radius = box.radius * size / box.size;
      if (radius * 2 > Math.min(floorWidth, floorHeight)) continue;
      tryFloorPlacement(box, {
        size, radius,
        left: constrain(box.left, floorLeft + radius, floorRight - radius),
        top: constrain(box.top, floorTop + radius, floorTop + floorHeight - radius)
      });
    }
  }
  return new Map(boxes.map(({ entry, left, top, size }) => [
    entry.key, { left, top, "--wg-size": `${size}px`, "--wg-angle": `${entry.angle}deg` }
  ]));
}

function useBoxPlacements(entries, seed, pileRef, toggleRef) {
  const [layout, setLayout] = useState(null);
  useLayoutEffect(() => {
    const pile = pileRef.current;
    const controls = [toggleRef.current, pile.closest(".warehouse-box")?.querySelector(":scope > .close-button")].filter(Boolean);
    function measure() {
      const width = pile.clientWidth;
      const height = pile.clientHeight;
      if (!width || !height) return;
      const obstacles = controls.map(control => ({
        left: control.offsetLeft - 8, top: control.offsetTop - 8,
        right: control.offsetLeft + control.offsetWidth + 8,
        bottom: control.offsetTop + control.offsetHeight + 8
      }));
      setLayout(previous => {
        const sparse = entries.length <= 5;
        if (previous?.width === width && previous.height === height && previous.sparse === sparse
          && entries.every(entry => previous.placements.has(entry.key))) return previous;
        return { width, height, sparse, placements: placeItems(entries, width, height, seed, obstacles) };
      });
    }
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(pile);
    return () => observer.disconnect();
  }, [entries, seed, pileRef, toggleRef]);
  return layout?.placements;
}

export default function WarehouseBox({ items, targetOpen, ...actions }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [itemId, setItemId] = useState("");
  const [scatterSeed] = useState(() => Math.floor(Math.random() * 0x100000000));
  const toggleRef = useRef(null);
  const pileRef = useRef(null);
  const listRef = useWarehouseListRows(drawerOpen);
  const stocked = useMemo(() => items.filter(item => item.quantity > 0), [items]);
  const entries = useMemo(() => scatterItems(stocked, scatterSeed), [stocked, scatterSeed]);
  const [batchEntry] = useState(() => entries.length > 16);
  const placements = useBoxPlacements(entries, scatterSeed, pileRef, toggleRef);
  const item = stocked.find(entry => entry.itemId === itemId);
  const detailOpen = Boolean(item) && !targetOpen;

  function handleEscape(event) {
    if (event.key !== "Escape" || !drawerOpen || targetOpen) return;
    event.preventDefault();
    event.stopPropagation();
    setDrawerOpen(false);
    toggleRef.current?.focus();
  }

  return <div className="wg-box-content" data-batch-entry={batchEntry || undefined} onKeyDown={handleEscape}>
    <button ref={toggleRef} type="button" className="window-bookmark-tab wg-drawer-toggle" disabled={!stocked.length} aria-controls="warehouse-box-directory" aria-expanded={drawerOpen && Boolean(stocked.length)} onClick={() => setDrawerOpen(open => !open)}>
      <BookmarkPaper />
      <span className="window-bookmark-label">{drawerOpen && stocked.length ? "收起持有详情" : "展开持有详情"}</span>
    </button>
    <div className="wg-pile" ref={pileRef} inert={drawerOpen && Boolean(stocked.length)} aria-label="箱内道具">
      {entries.map(({ item: entry, key, zIndex }) => <button type="button" className="wg-loot" key={key} style={{ ...placements?.get(key), zIndex }} hidden={Boolean(placements && !placements.has(key))} aria-label={`查看道具详情：${entry.name}，持有 ${entry.quantity}`} onClick={() => setItemId(entry.itemId)}>
        <ItemArt item={entry} />
      </button>)}
      {!stocked.length && <WindowEmptyState compact>暂无道具</WindowEmptyState>}
    </div>
    <div className="wg-drawer" id="warehouse-box-directory" inert={!drawerOpen || !stocked.length}>
      <p className="wg-drawer-summary">目前已持有{stocked.length}种物品</p>
      {stocked.length > 0 && <WarehouseDirectory items={stocked} listRef={listRef} item={item} onSelect={entry => setItemId(entry.itemId)} />}
    </div>
    {detailOpen && <div className="wg-detail-backdrop" onClick={() => setItemId("")}>
      <ModalDialog className="wg-item-dialog" ariaLabel={`道具详情：${item.name}`} onClose={() => setItemId("")} onClick={event => event.stopPropagation()}>
        <button className="nested-modal-close" type="button" aria-label="关闭道具详情" onClick={() => setItemId("")}><X size={20} /></button>
        <WarehouseInspector item={item} {...actions} />
      </ModalDialog>
    </div>}
  </div>;
}
