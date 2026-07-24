import { useEffect, useMemo, useRef, useState } from "react";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import { CHARACTERS, characterListFromCatalog } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { resolveCharacterPortraitPresentation } from "../shared/characterPortraits.js";

const TIP_ROTATION_MS = 10000;
const PRELOAD_PROGRESS_MASCOT = "/assets/preload/orange-mascot.png";
const PRELOAD_PROGRESS_IDLE_MS = 600;
const PRELOAD_PROGRESS_MIN_MOVEMENT = 1;

export function isMeaningfulPreloadProgressMovement(previousPercent, nextPercent) {
  return Math.abs(nextPercent - previousPercent) > PRELOAD_PROGRESS_MIN_MOVEMENT;
}

export function preloadTipList(tipsText = DEFAULT_SITE_SETTINGS.preloadTips) {
  return String(tipsText || DEFAULT_SITE_SETTINGS.preloadTips)
    .split(/\r?\n/)
    .map((tip) => tip.trim())
    .filter(Boolean);
}

function randomTipIndex(tips, currentIndex = -1) {
  if (tips.length <= 1) return 0;
  let nextIndex = Math.floor(Math.random() * tips.length);
  if (nextIndex === currentIndex) {
    nextIndex = (nextIndex + 1) % tips.length;
  }
  return nextIndex;
}

export function characterLoadingLineMap(linesText = DEFAULT_SITE_SETTINGS.characterLoadingLines) {
  return Object.fromEntries(String(linesText || DEFAULT_SITE_SETTINGS.characterLoadingLines)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = firstSeparatorIndex(line);
      if (separatorIndex <= 0) return null;
      const key = canonicalCharacterId(line.slice(0, separatorIndex).trim());
      const value = line.slice(separatorIndex + 1).trim();
      return key && value ? [key, value] : null;
    })
    .filter(Boolean));
}

export function characterLoadingLine(character, linesText = DEFAULT_SITE_SETTINGS.characterLoadingLines) {
  const characterId = canonicalCharacterId(character?.id);
  const line = characterLoadingLineMap(linesText)[characterId];
  return line || `${character?.name || "角色"}正在加载中`;
}

export function randomPreloadCharacter(characters = CHARACTERS, random = Math.random, currentCharacter = null) {
  const candidates = characterListFromCatalog(characters)
    .filter((character) => character?.portrait);
  if (candidates.length === 0) return CHARACTERS.sigrika;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  const nextCharacter = candidates[index];
  if (candidates.length > 1 && canonicalCharacterId(nextCharacter?.id) === canonicalCharacterId(currentCharacter?.id)) {
    return candidates[(index + 1) % candidates.length];
  }
  return nextCharacter;
}

function randomPreloadDisplayState({
  tips,
  characters,
  fixedCharacter = null,
  currentTipIndex = -1,
  currentCharacter = null
}) {
  return {
    tipIndex: randomTipIndex(tips, currentTipIndex),
    randomCharacter: fixedCharacter
      ? null
      : randomPreloadCharacter(characters, Math.random, currentCharacter)
  };
}

function characterFromCatalogById(characters, characterId) {
  const canonicalId = canonicalCharacterId(characterId);
  if (!canonicalId) return null;
  return characterListFromCatalog(characters)
    .find((catalogCharacter) => canonicalCharacterId(catalogCharacter?.id) === canonicalId) ?? null;
}

export default function AssetPreloadScreen({
  character = null,
  characters = CHARACTERS,
  label = "",
  loadingLinesText = DEFAULT_SITE_SETTINGS.characterLoadingLines,
  progress,
  statusText = "",
  showTips = true,
  tipsText,
  user = null
}) {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const tips = useMemo(() => preloadTipList(tipsText), [tipsText]);
  const tipsSignature = tips.join("\n");
  const fixedCharacterId = canonicalCharacterId(character?.id) || "";
  const [displayState, setDisplayState] = useState(() => randomPreloadDisplayState({
    tips,
    characters,
    fixedCharacter: character
  }));
  const [isProgressIdle, setIsProgressIdle] = useState(true);
  const didMountRef = useRef(false);
  const previousPercentRef = useRef(percent);
  const progressIdleTimerRef = useRef(null);
  const latestInputsRef = useRef({ character, characters, tips });
  const { tipIndex, randomCharacter } = displayState;
  const randomCharacterId = canonicalCharacterId(randomCharacter?.id);
  const displayCharacter = character
    ? characterFromCatalogById(characters, character.id) ?? character
    : characterFromCatalogById(characters, randomCharacterId) ?? randomCharacter;
  const displayPortrait = resolveCharacterPortraitPresentation(displayCharacter, {
    itemEffects: user?.itemEffects,
    user,
    costumeSnapshot: displayCharacter?.costumeSnapshot
  });
  const currentTip = tips[tipIndex] ?? tips[0] ?? "";
  const title = label || characterLoadingLine(displayCharacter, loadingLinesText);

  useEffect(() => {
    latestInputsRef.current = { character, characters, tips };
  }, [character, characters, tips]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setDisplayState((current) => ({
      tipIndex: randomTipIndex(tips, current.tipIndex),
      randomCharacter: character
        ? null
        : current.randomCharacter ?? randomPreloadCharacter(characters)
    }));
  }, [fixedCharacterId, tipsSignature]);

  useEffect(() => {
    if (character && tips.length <= 1) return undefined;
    const timer = setInterval(() => {
      const latestInputs = latestInputsRef.current;
      setDisplayState((current) => randomPreloadDisplayState({
        tips: latestInputs.tips,
        characters: latestInputs.characters,
        fixedCharacter: latestInputs.character,
        currentTipIndex: current.tipIndex,
        currentCharacter: current.randomCharacter
      }));
    }, TIP_ROTATION_MS);
    return () => clearInterval(timer);
  }, [fixedCharacterId, tipsSignature]);

  useEffect(() => {
    const previousPercent = previousPercentRef.current;
    previousPercentRef.current = percent;
    window.clearTimeout(progressIdleTimerRef.current);

    if (!isMeaningfulPreloadProgressMovement(previousPercent, percent)) {
      setIsProgressIdle(true);
      return undefined;
    }

    setIsProgressIdle(false);
    progressIdleTimerRef.current = window.setTimeout(() => {
      setIsProgressIdle(true);
    }, PRELOAD_PROGRESS_IDLE_MS);

    return () => window.clearTimeout(progressIdleTimerRef.current);
  }, [percent]);

  return (
    <main className="asset-preload-screen">
      <section className="asset-preload-panel">
        {displayPortrait.src ? (
          <span className="preload-character" aria-label={displayCharacter.name ?? "当前角色"}>
            <img src={displayPortrait.src} style={displayPortrait.style} alt={displayCharacter.name ?? ""} />
          </span>
        ) : (
          <div className="preload-mark" />
        )}
        <p className="preload-title">{title}</p>
        {statusText && <p className="preload-status">{statusText}</p>}
        <div
          className={`preload-progress${isProgressIdle ? " is-idle" : ""}`}
          style={{
            "--preload-progress": percent / 100,
            "--preload-mask-size": `${percent}%`,
            "--preload-mascot-rotation": `${percent * 7.2}deg`
          }}
          role="progressbar"
          aria-label={"\u8d44\u6e90\u52a0\u8f7d " + percent + "%"}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percent}
        >
          <div className="preload-progress-track">
            <div className="preload-bar" aria-hidden="true">
              <span className="preload-paper-fill" />
            </div>
            <span className="preload-mascot-anchor" aria-hidden="true">
              <span className="preload-mascot-roll">
                <span className="preload-mascot-motion">
                  <img
                    className="preload-progress-mascot"
                    src={PRELOAD_PROGRESS_MASCOT}
                    alt=""
                    decoding="sync"
                    draggable="false"
                    fetchPriority="high"
                    loading="eager"
                  />
                </span>
              </span>
            </span>
          </div>
        </div>
        {showTips && currentTip && <p className="preload-tip" aria-live="polite">{currentTip}</p>}
      </section>
    </main>
  );
}

function firstSeparatorIndex(line) {
  const separators = ["=", ":", "："];
  return separators
    .map((separator) => line.indexOf(separator))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0] ?? -1;
}
