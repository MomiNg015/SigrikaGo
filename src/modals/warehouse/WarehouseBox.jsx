import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { ModalActionButton, ModalDialog } from "../modalComponents.jsx";
import WindowEmptyState from "../WindowEmptyState.jsx";
import { ItemArt, WarehouseDirectory, WarehouseInspector } from "./WarehouseItemGrid.jsx";
import { useWarehouseListRows } from "./useWarehouseListRows.js";

const MAX_COPIES_PER_ITEM = 10;
const GOLDEN_ANGLE = 137.508;
const MAX_COVERAGE = .20;

function overlap(first, second) {
  const span = (axis) => Math.max(0, Math.min(first[axis] + first.radius, second[axis] + second.radius)
    - Math.max(first[axis] - first.radius, second[axis] - second.radius));
  return span("left") * span("top");
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

function placeItems(entries, width, height, seed) {
  if (!entries.length) return new Map();
  const floorWidth = width * .84;
  const floorTop = height * .16 + 48;
  const floorHeight = Math.max(1, height * .88 - floorTop);
  const maximumSize = entries.length <= 5 ? 170 : 128;
  let columns = 1;
  let bestCell = 0;
  for (let candidate = 1; candidate <= entries.length; candidate++) {
    const side = Math.min(floorWidth / candidate, floorHeight / Math.ceil(entries.length / candidate));
    if (side > bestCell) {
      bestCell = side;
      columns = candidate;
    }
  }
  const rows = Math.ceil(entries.length / columns);
  const cellWidth = floorWidth / columns;
  const cellHeight = floorHeight / rows;
  const random = itemRandom(seed, "floor");
  const slots = Array.from({ length: columns * rows }, (_, index) => index);
  const boxes = entries.map(entry => {
    const pick = Math.floor(random() * slots.length);
    const slot = slots[pick];
    slots[pick] = slots.at(-1);
    slots.pop();
    const radians = entry.angle * Math.PI / 180;
    const rotationFootprint = Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians));
    const size = Math.min(maximumSize, bestCell * .91 / rotationFootprint);
    const footprint = size * rotationFootprint;
    const left = width * .08 + slot % columns * cellWidth + footprint / 2 + random() * (cellWidth - footprint);
    const top = floorTop + Math.floor(slot / columns) * cellHeight + footprint / 2 + random() * (cellHeight - footprint);
    return { entry, left, top, size, radius: footprint / 2, budget: footprint ** 2 * MAX_COVERAGE, coverage: 0 };
  });
  const constrain = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  for (let pass = 0; pass < 2; pass++) {
    for (const box of boxes) {
      const candidate = {
        radius: box.radius,
        left: constrain(box.left + (random() - .5) * cellWidth * .75, width * .08 + box.radius, width * .92 - box.radius),
        top: constrain(box.top + (random() - .5) * cellHeight * .75, floorTop + box.radius, floorTop + floorHeight - box.radius)
      };
      const neighbors = boxes.filter(other => other !== box);
      const intersections = neighbors.map(other => overlap(candidate, other));
      const coverage = intersections.reduce((total, intersection) => total + intersection, 0);
      if (coverage > box.budget || neighbors.some((other, index) => other.coverage - overlap(box, other) + intersections[index] > other.budget)) continue;
      neighbors.forEach((other, index) => { other.coverage += intersections[index] - overlap(box, other); });
      Object.assign(box, candidate, { coverage });
    }
  }
  return new Map(boxes.map(({ entry, left, top, size }) => [
    entry.key, { left, top, "--wg-size": `${size}px`, "--wg-angle": `${entry.angle}deg` }
  ]));
}

function useBoxPlacements(entries, seed, pileRef) {
  const [layout, setLayout] = useState(null);
  useLayoutEffect(() => {
    const pile = pileRef.current;
    function measure() {
      const width = pile.clientWidth;
      const height = pile.clientHeight;
      if (!width || !height) return;
      setLayout(previous => {
        const sparse = entries.length <= 5;
        if (previous?.width === width && previous.height === height && previous.sparse === sparse
          && entries.every(entry => previous.placements.has(entry.key))) return previous;
        return { width, height, sparse, placements: placeItems(entries, width, height, seed) };
      });
    }
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(pile);
    return () => observer.disconnect();
  }, [entries, seed, pileRef]);
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
  const placements = useBoxPlacements(entries, scatterSeed, pileRef);
  const item = stocked.find(entry => entry.itemId === itemId);
  const detailOpen = Boolean(item) && !targetOpen;

  function handleEscape(event) {
    if (event.key !== "Escape" || !drawerOpen || targetOpen) return;
    event.preventDefault();
    event.stopPropagation();
    setDrawerOpen(false);
    toggleRef.current?.focus();
  }

  return <div className="wg-box-content" onKeyDown={handleEscape}>
    <ModalActionButton ref={toggleRef} variant="secondary" className="wg-drawer-toggle" disabled={!stocked.length} aria-controls="warehouse-box-directory" aria-expanded={drawerOpen && Boolean(stocked.length)} onClick={() => setDrawerOpen(open => !open)}>
      {drawerOpen && stocked.length ? "收起持有详情" : "展开持有详情"}
    </ModalActionButton>
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
