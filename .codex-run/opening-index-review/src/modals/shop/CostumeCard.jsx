export default function CostumeCard({ costume, onShowDetail }) {
  return (
    <article className={`costume-shop-card${costume.characterOwned ? "" : " is-character-locked"}${costume.owned ? " is-owned" : ""}`}>
      <button
        className="costume-shop-card-trigger"
        type="button"
        onClick={() => onShowDetail(costume)}
        aria-label={`查看${costume.name}详情`}
      >
        <span className="costume-shop-art">
          <img src={costume.portraitUrl} alt="" loading="lazy" decoding="async" />
          <span className="costume-shop-price">
            <strong>{costume.finalPrice}</strong>
            <small>金币</small>
          </span>
        </span>
      </button>
    </article>
  );
}
