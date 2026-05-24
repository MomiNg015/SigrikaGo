export default function StoneDecorationPreview({ decoration, label = "", large = false }) {
  return (
    <div className={`stone-decoration-preview ${large ? "large" : ""}`} aria-label={label || decoration.name}>
      <span style={{ "--preview-stone-image": `url("${decoration.images.black}")` }} />
      <span style={{ "--preview-stone-image": `url("${decoration.images.white}")` }} />
    </div>
  );
}
