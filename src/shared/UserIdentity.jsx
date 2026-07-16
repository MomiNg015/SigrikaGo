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
    <span className={classes} data-nameplate-id={nameplate?.id || undefined}>
      {titleText && <span className="user-identity-title">{titleText}</span>}
      <span className="user-identity-main">
        {emblem && (
          <span className="user-identity-emblem" title={emblemText}>
            {emblem.imageUrl ? <img src={emblem.imageUrl} alt={emblemText} /> : emblemText.slice(0, 2)}
          </span>
        )}
        <span
          className="user-identity-name-tag"
        >
          {nameplate?.imageUrl && (
            <>
              <span
                className="user-identity-nameplate-background"
                aria-hidden="true"
                style={{ backgroundImage: `url(${nameplate.imageUrl})` }}
              />
              <span className="user-identity-nameplate-effect" aria-hidden="true">
                <span className="user-identity-nameplate-glow" />
                <span className="user-identity-nameplate-core" />
                <span className="user-identity-nameplate-sweep" />
                <span className="user-identity-nameplate-sparkles" />
              </span>
            </>
          )}
          <span className="user-identity-name">{displayName}</span>
        </span>
      </span>
    </span>
  );
}

function displayAssetText(asset) {
  return String(asset?.text || asset?.name || "").trim();
}
