import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { preloadTipDisplayText, preloadTipList } from "./AssetPreloadScreen.jsx";
import { LOGIN_LOADING_ART as art } from "./loginLoadingAssets.js";

const motionQuery = () => window.matchMedia?.("(prefers-reduced-motion: reduce)");
function subscribeMotion(listener) {
  const query = motionQuery();
  query?.addEventListener("change", listener);
  return () => query?.removeEventListener("change", listener);
}
const reducedMotion = () => Boolean(motionQuery()?.matches);

export default function LoginAssetPreloadScreen({ progress = 0, tipsText }) {
  const value = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const complete = value === 1;
  const percent = complete ? 100 : Math.min(99, Math.round(value * 100));
  const still = useSyncExternalStore(subscribeMotion, reducedMotion, () => true);
  const gradientId = useId();
  const tips = useMemo(() => preloadTipList(tipsText), [tipsText]);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * tips.length));
  useEffect(() => {
    if (complete || tips.length < 2) return undefined;
    const timer = setInterval(() => {
      setTipIndex((previous) => (previous + 1 + Math.floor(Math.random() * (tips.length - 1))) % tips.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [complete, tips]);
  const tip = preloadTipDisplayText(tips[tipIndex % tips.length]).replace(/^Tip：/, "");
  // Source-image chamber bounds: the screw and exterior remain transparent.
  const level = 77.07182320441989 - (77.07182320441989 - 8.56353591160221) * value;

  return (
    <main className={`asset-preload-screen login-loading-screen${complete ? " is-complete" : ""}`} aria-label="资源加载">
      <div className="login-loading-composition">
        <section className="login-loading-art" aria-label="角色正在思考围棋死活题">
          <div className="login-loading-cloud">
            <img className="login-loading-outline" src={art.cloud} alt="" aria-hidden="true" />
            <img className="login-loading-outline login-loading-outline-alternate" src={art.alternateCloud} alt="" aria-hidden="true" />
            <div className="login-loading-puzzle"><img src={art.puzzle} alt="围棋死活题，保留棋盘坐标" /></div>
          </div>
          {["one", "two", "three"].map((size) => <img key={size} className={`login-loading-link login-loading-link-${size}`} src={art.bubble} alt="" aria-hidden="true" />)}
          <img className="login-loading-character" src={complete ? art.complete : still ? art.waiting : art.blink} alt={complete ? "角色恍然大悟" : "角色正在思考"} fetchPriority="high" />
          <div className="login-loading-bulb" role="progressbar" aria-label="资源加载" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="login-loading-fill-mask" aria-hidden="true">
              <svg className="login-loading-fill" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs><linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffb937" /><stop offset="55%" stopColor="#ffdb62" /><stop offset="100%" stopColor="#fff3a9" />
                </linearGradient></defs>
                <polygon points={value === 0 ? "0,100 100,100 100,100 0,100" : `0,${level} 100,${level} 100,100 0,100`} fill={`url(#${gradientId})`} />
              </svg>
            </div>
            <img className="login-loading-bulb-outline" src={art.bulb} alt="" aria-hidden="true" />
            <span className="login-loading-percentage" aria-hidden="true">{percent}%</span>
            <img className="login-loading-rays" src={art.rays} alt="" aria-hidden="true" />
          </div>
        </section>
        {tip && <div className="login-loading-tip" aria-live="polite"><span className="login-loading-tip-label">Tip：</span><span className="login-loading-tip-copy">{tip}</span></div>}
      </div>
    </main>
  );
}
