function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCorruptionFragments(seed, columns = 6, rows = 4) {
  const random = seededRandom(`fragments:${seed}`);
  const missingRandom = seededRandom(`missing-fragments:${seed}`);
  const gap = 0.45;
  const fragmentCount = columns * rows;
  const missingCount = fragmentCount > 0 ? Math.max(1, Math.round(fragmentCount * 0.25)) : 0;
  const missingIndices = new Set();

  while (missingIndices.size < missingCount) {
    missingIndices.add(Math.floor(missingRandom() * fragmentCount));
  }

  return Array.from({ length: fragmentCount }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const top = (row / rows) * 100 + gap;
    const right = 100 - ((column + 1) / columns) * 100 + gap;
    const bottom = 100 - ((row + 1) / rows) * 100 + gap;
    const left = (column / columns) * 100 + gap;
    const direction = random() > 0.5 ? 1 : -1;

    return {
      clipPath: `inset(${top.toFixed(2)}% ${right.toFixed(2)}% ${bottom.toFixed(2)}% ${left.toFixed(2)}%)`,
      delay: `${(-random() * 5.4).toFixed(2)}s`,
      id: `${column}-${row}`,
      missing: missingIndices.has(index),
      opacity: (0.48 + random() * 0.42).toFixed(2),
      shiftX: `${(direction * (1.8 + random() * 6.2)).toFixed(2)}%`,
      shiftY: `${((random() - 0.5) * 7.2).toFixed(2)}%`
    };
  });
}

export function createCorruptionNoise(seed, count = 92) {
  const random = seededRandom(`noise:${seed}`);
  return Array.from({ length: count }, (_, index) => ({
    fill: random() > 0.42 ? "#050506" : "#f4f4f5",
    height: (1 + random() * 7).toFixed(1),
    id: index,
    opacity: (0.52 + random() * 0.46).toFixed(2),
    width: (1 + random() * 8).toFixed(1),
    x: (random() * 100).toFixed(1),
    y: (random() * 100).toFixed(1)
  }));
}

export function createCorruptionCadence(seed) {
  const random = seededRandom(`cadence:${seed}`);
  const cardDuration = 5.1 + random() * 4.6;
  const noiseDuration = 2.7 + random() * 4.2;
  const sliceDirection = random() > 0.5 ? 1 : -1;
  const firstFlashStart = 5 + random() * 24;
  const secondFlashStart = 34 + random() * 28;
  const thirdFlashStart = 13 + random() * 46;

  return {
    cardDelay: `${(-random() * cardDuration).toFixed(2)}s`,
    cardDirection: random() > 0.5 ? "alternate" : "alternate-reverse",
    cardDuration: `${cardDuration.toFixed(2)}s`,
    flashFirstEnd: `${Math.min(94, firstFlashStart + 13 + random() * 22).toFixed(1)}%`,
    flashFirstStart: `${firstFlashStart.toFixed(1)}%`,
    flashSecondEnd: `${Math.min(96, secondFlashStart + 12 + random() * 27).toFixed(1)}%`,
    flashSecondStart: `${secondFlashStart.toFixed(1)}%`,
    flashThirdEnd: `${Math.min(92, thirdFlashStart + 17 + random() * 25).toFixed(1)}%`,
    flashThirdStart: `${thirdFlashStart.toFixed(1)}%`,
    flashYFirst: `${(11 + random() * 31).toFixed(1)}%`,
    flashYSecond: `${(44 + random() * 29).toFixed(1)}%`,
    flashYThird: `${(63 + random() * 25).toFixed(1)}%`,
    noiseDelay: `${(-random() * noiseDuration).toFixed(2)}s`,
    noiseDirection: random() > 0.5 ? "alternate" : "alternate-reverse",
    noiseDuration: `${noiseDuration.toFixed(2)}s`,
    sliceBack: `${(-sliceDirection * (2 + random() * 6)).toFixed(1)}px`,
    sliceBand: `${(8 + random() * 16).toFixed(1)}%`,
    sliceBottom: `${(21 + random() * 18).toFixed(1)}%`,
    sliceForward: `${(sliceDirection * (2 + random() * 7)).toFixed(1)}px`,
    sliceTop: `${(31 + random() * 21).toFixed(1)}%`,
    sliceY: `${(38 + random() * 29).toFixed(1)}%`
  };
}

export function CorruptionFragmentImage({ className = "", columns = 6, rows = 4, seed, src }) {
  const fragments = createCorruptionFragments(seed, columns, rows);
  return (
    <span
      aria-hidden="true"
      className={`corruption-fragment-image ${className}`.trim()}
      data-corruption-columns={columns}
      data-corruption-rows={rows}
      data-corruption-seed={seed}
    >
      {fragments.filter((fragment) => !fragment.missing).map((fragment) => (
        <img
          alt=""
          className="corruption-fragment-piece"
          decoding="async"
          draggable="false"
          key={fragment.id}
          src={src}
          style={{
            "--corruption-fragment-clip": fragment.clipPath,
            "--corruption-fragment-delay": fragment.delay,
            "--corruption-fragment-opacity": fragment.opacity,
            "--corruption-fragment-x": fragment.shiftX,
            "--corruption-fragment-y": fragment.shiftY
          }}
        />
      ))}
    </span>
  );
}

export function CorruptionNoise({ className = "", count = 92, seed }) {
  const fragments = createCorruptionNoise(seed, count);
  return (
    <svg
      aria-hidden="true"
      className={`corruption-noise ${className}`.trim()}
      data-corruption-seed={seed}
      focusable="false"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      viewBox="0 0 100 100"
    >
      {fragments.map((fragment) => (
        <rect key={fragment.id} {...fragment} />
      ))}
    </svg>
  );
}
