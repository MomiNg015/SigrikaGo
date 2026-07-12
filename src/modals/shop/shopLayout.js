const DESKTOP_CARD_WIDTH = 180;
const DESKTOP_CARD_HEIGHT = 252;
const MOBILE_CARD_WIDTH = 164;
const MOBILE_CARD_HEIGHT = 196;
const DESKTOP_EDGE = 14;
const DESKTOP_GAP = 28;
const DESKTOP_CELL_BREATHING_ROOM = 48;
const DESKTOP_JITTER_RESERVE = 6;

export function layoutShopCards({ width, height, count, mobile = false, seed = 1 }) {
  const safeCount = Math.max(0, Math.min(5, Number(count) || 0));
  if (!safeCount || width <= 0 || height <= 0) return [];
  return mobile
    ? layoutMobileCards(width, height, safeCount)
    : layoutDesktopCards(width, height, safeCount, seededRandom(seed));
}

function layoutDesktopCards(width, height, count, random) {
  const rows = cardRows(count);
  const rowCount = rows.length;
  const maxColumns = Math.max(...rows);
  const availableWidth = Math.max(1, width - (DESKTOP_EDGE * 2) - (DESKTOP_GAP * (maxColumns - 1)));
  const availableHeight = Math.max(1, height - (DESKTOP_EDGE * 2) - (DESKTOP_GAP * (rowCount - 1)));
  const cellWidth = Math.min(
    availableWidth / maxColumns,
    DESKTOP_CARD_WIDTH + DESKTOP_CELL_BREATHING_ROOM
  );
  const cellHeight = Math.min(
    availableHeight / rowCount,
    DESKTOP_CARD_HEIGHT + DESKTOP_CELL_BREATHING_ROOM
  );
  const scale = Math.max(0.01, Math.min(
    1,
    (cellWidth - DESKTOP_JITTER_RESERVE) / DESKTOP_CARD_WIDTH,
    (cellHeight - DESKTOP_JITTER_RESERVE) / DESKTOP_CARD_HEIGHT
  ));
  const cardWidth = DESKTOP_CARD_WIDTH * scale;
  const cardHeight = DESKTOP_CARD_HEIGHT * scale;
  const gridHeight = (rowCount * cellHeight) + ((rowCount - 1) * DESKTOP_GAP);
  const startY = (height - gridHeight) / 2;
  const placements = [];

  rows.forEach((columns, rowIndex) => {
    const rowWidth = (columns * cellWidth) + ((columns - 1) * DESKTOP_GAP);
    const startX = (width - rowWidth) / 2;
    for (let column = 0; column < columns; column += 1) {
      placements.push({
        x: startX + (column * (cellWidth + DESKTOP_GAP)) + (random() * Math.max(0, cellWidth - cardWidth)),
        y: startY + (rowIndex * (cellHeight + DESKTOP_GAP)) + (random() * Math.max(0, cellHeight - cardHeight)),
        width: cardWidth,
        height: cardHeight,
        scale
      });
    }
  });

  return placements;
}

function layoutMobileCards(width, height, count) {
  const rows = cardRows(count);
  const horizontalGap = Math.max(4, Math.min(5, width * 0.012));
  const verticalGap = Math.max(8, Math.min(10, height * 0.025));
  const verticalEdge = Math.max(8, Math.min(10, height * 0.025));
  const rowCount = rows.length;
  const maxColumns = Math.max(...rows);
  const scale = Math.min(
    1,
    (width - (horizontalGap * (maxColumns + 1))) / (MOBILE_CARD_WIDTH * maxColumns),
    (height - (verticalEdge * 2) - (verticalGap * (rowCount - 1))) / (MOBILE_CARD_HEIGHT * rowCount)
  );
  const cardWidth = MOBILE_CARD_WIDTH * scale;
  const cardHeight = MOBILE_CARD_HEIGHT * scale;
  const totalHeight = (rowCount * cardHeight) + ((rowCount - 1) * verticalGap);
  const placements = [];
  let itemIndex = 0;

  rows.forEach((columns, rowIndex) => {
    const rowWidth = (columns * cardWidth) + ((columns - 1) * horizontalGap);
    const startX = (width - rowWidth) / 2;
    const y = Math.max(verticalEdge, (height - totalHeight) / 2) + (rowIndex * (cardHeight + verticalGap));
    for (let column = 0; column < columns; column += 1) {
      if (itemIndex >= count) break;
      placements.push({
        x: startX + (column * (cardWidth + horizontalGap)),
        y,
        width: cardWidth,
        height: cardHeight,
        scale
      });
      itemIndex += 1;
    }
  });
  return placements;
}

function cardRows(count) {
  if (count === 5) return [2, 3];
  if (count === 4) return [2, 2];
  if (count === 3) return [2, 1];
  return [count];
}

function seededRandom(seed) {
  let value = (Number(seed) || 1) >>> 0;
  return () => {
    value = ((value * 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export const SHOP_CARD_BASE_SIZE = Object.freeze({
  desktop: Object.freeze({ width: DESKTOP_CARD_WIDTH, height: DESKTOP_CARD_HEIGHT }),
  mobile: Object.freeze({ width: MOBILE_CARD_WIDTH, height: MOBILE_CARD_HEIGHT })
});
