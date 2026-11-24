import AssetPreloadScreen from "./AssetPreloadScreen.jsx";

const SIGRIKA_READING = { src: "/assets/preload/sigrika-page-turn.webp", width: 512, height: 350 };

export default function LoginAssetPreloadScreen({ progress = 0, tipsText }) {
  const value = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return (
    <AssetPreloadScreen
      illustration={SIGRIKA_READING}
      progress={value}
      progressNote="（第一次加载需要2-3分钟，请耐心等待）"
      tipsText={tipsText}
      tipStyle="brush"
    />
  );
}
