import AssetPreloadScreen from "./AssetPreloadScreen.jsx";

export default function LoginAssetPreloadScreen({ progress = 0, characters, loadingLinesText, tipsText }) {
  const value = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return (
    <AssetPreloadScreen
      characters={characters}
      loadingLinesText={loadingLinesText}
      progress={value}
      tipsText={tipsText}
      tipStyle="brush"
    />
  );
}
