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
  const fitFontSize = compact ? userIdentityFitFontSize(displayName) : null;
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
    <span className={classes} style={fitFontSize ? { "--user-identity-fit-font-size": fitFontSize } : undefined}>
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

export function userIdentityFitFontSize(name) {
  const displayWidth = measureDisplayWidth(name);
  if (displayWidth <= 8) return null;
  const scale = Math.max(0.58, Math.min(1, 8.6 / displayWidth));
  return `${scale.toFixed(3)}em`;
}

function displayAssetText(asset) {
  return String(asset?.text || asset?.name || "").trim();
}

function measureDisplayWidth(value) {
  return Array.from(String(value ?? "")).reduce((total, char) => {
    return total + (isWideDisplayCharacter(char) ? 2 : 1);
  }, 0);
}

function isWideDisplayCharacter(char) {
  return /[\u2e80-\u9fff\uac00-\ud7af\u3040-\u30ff\uff01-\uff60\uffe0-\uffe6]/u.test(char);
}
