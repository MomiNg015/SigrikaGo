export default function StoneDecorationPreview({ decoration, label = "", large = false }) {
  return (
    <div className={`stone-decoration-preview ${large ? "large" : ""}`} aria-label={label || decoration?.name || "默认棋子"}>
      <span style={{ "--preview-stone-image": decoration ? `url("${decoration.images.black}")` : "radial-gradient(circle at 32% 26%, #4e4b51 0 16%, #16151a 56%, #050507 100%)" }} />
      <span style={{ "--preview-stone-image": decoration ? `url("${decoration.images.white}")` : "radial-gradient(circle at 34% 26%, #f3f0e8 0 20%, #e5e1d9 58%, #cbc6bd 100%)" }} />
    </div>
  );
}
