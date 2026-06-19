export default function UserIdentity({
  user,
  name,
  className = "",
  compact = false,
  showNameplate = true
}) {
  const assets = user?.achievementEquipmentAssets ?? {};
  const title = assets.title;
  const emblem = assets.badge;
  const nameplate = showNameplate ? assets.nameplate : null;
  const displayName = name ?? user?.username ?? "-";
  const titleText = displayAssetText(title);
  const emblemText = displayAssetText(emblem);
  const classes = [
    "user-identity",
    compact ? "compact" : "",
    nameplate?.imageUrl ? "has-nameplate" : "",
    titleText ? "has-title" : "",
    emblem ? "has-emblem" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      {titleText && <span className="user-identity-title">{titleText}</span>}
      <span className="user-identity-main">
        {emblem && (
          <span className="user-identity-emblem" title={emblemText}>
            {emblem.imageUrl ? <img src={emblem.imageUrl} alt={emblemText} /> : emblemText.slice(0, 2)}
          </span>
        )}
        <span
          className="user-identity-name-tag"
          style={nameplate?.imageUrl ? { backgroundImage: `url(${nameplate.imageUrl})` } : undefined}
        >
          <span className="user-identity-name">{displayName}</span>
        </span>
      </span>
    </span>
  );
}

function displayAssetText(asset) {
  return String(asset?.text || asset?.name || "").trim();
}
