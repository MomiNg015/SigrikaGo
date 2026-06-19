import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";

const TIP_ROTATION_MS = 10000;

export function preloadTipList(tipsText = DEFAULT_SITE_SETTINGS.preloadTips) {
  return String(tipsText || DEFAULT_SITE_SETTINGS.preloadTips)
    .split(/\r?\n/)
    .map((tip) => tip.trim())
    .filter(Boolean);
}

function randomTipIndex(tips, currentIndex = -1) {
  if (tips.length <= 1) return 0;
  let nextIndex = Math.floor(Math.random() * tips.length);
  if (nextIndex === currentIndex) {
    nextIndex = (nextIndex + 1) % tips.length;
  }
  return nextIndex;
}

export default function AssetPreloadScreen({ progress, tipsText }) {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const tips = useMemo(() => preloadTipList(tipsText), [tipsText]);
  const [tipIndex, setTipIndex] = useState(() => randomTipIndex(tips));
  const currentTip = tips[tipIndex] ?? tips[0] ?? "";

  useEffect(() => {
    setTipIndex(randomTipIndex(tips));
  }, [tips]);

  useEffect(() => {
    if (tips.length <= 1) return undefined;
    const timer = setInterval(() => {
      setTipIndex((current) => randomTipIndex(tips, current));
    }, TIP_ROTATION_MS);
    return () => clearInterval(timer);
  }, [tips]);

  return (
    <main className="asset-preload-screen">
      <section className="asset-preload-panel">
        <div className="preload-mark" />
        <p className="preload-title">{"\u754c\u9762\u52a0\u8f7d\u4e2d"}</p>
        <div className="preload-bar" aria-label={"\u8d44\u6e90\u52a0\u8f7d " + percent + "%"}>
          <span style={{ width: `${percent}%` }} />
        </div>
        {currentTip && <p className="preload-tip" aria-live="polite">{currentTip}</p>}
      </section>
    </main>
  );
}
