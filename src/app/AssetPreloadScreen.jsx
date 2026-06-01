export default function AssetPreloadScreen({ progress }) {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <main className="asset-preload-screen">
      <section className="asset-preload-panel">
        <div className="preload-mark" />
        <p>{"\u8d44\u6e90\u51c6\u5907\u4e2d"}</p>
        <div className="preload-bar" aria-label={"\u8d44\u6e90\u52a0\u8f7d " + percent + "%"}>
          <span style={{ width: `${percent}%` }} />
        </div>
      </section>
    </main>
  );
}
