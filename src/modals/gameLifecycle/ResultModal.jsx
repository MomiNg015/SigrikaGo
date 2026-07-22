import { useEffect, useRef } from "react";
import { playEffectSound } from "../../audio/playback.jsx";
import { playSystemVoice } from "../../audio/systemVoicePlayback.js";
import { resolveCandyPortrait } from "../../shared/candyPortraits.js";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import UserIdentity from "../../shared/UserIdentity.jsx";
import { findCharacter } from "../../shared/characterDisplay.js";
import { COLORS } from "../../shared/game.js";
import { isPracticeRoom } from "../../shared/practiceMode.js";
import { resolveResultSound } from "../../shared/musicLibrary.js";
import {
  formatSignedDelta,
  resultPlayerForRoom,
  resultRewardForRoom,
  resultVoiceEventForRoom
} from "./lifecycleHelpers.js";

const RESULT_DEFEAT_WEATHER_GIF = "/assets/effects/result-defeat-rain.gif";

export default function ResultModal({ room, user, characters, audioSettings, onClose }) {
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  const isDraw = !winnerColor;
  const winner = room.players.find((player) => player.color === winnerColor) ?? room.players[0];
  const currentPlayer = resultPlayerForRoom(room, user);
  const displayPlayer = currentPlayer ?? (!isDraw ? winner : null);
  const character = displayPlayer ? findCharacter(characters, displayPlayer?.character ?? displayPlayer?.characterId) : null;
  const voiceCharacter = findCharacter(characters, currentPlayer?.character ?? currentPlayer?.characterId);
  const reward = resultRewardForRoom(room, user);
  const isPractice = isPracticeRoom(room);
  const isFriendlyMatch = reward?.rated === false || room.rated === false;
  const ratingRewardClass = `result-reward-tile result-reward-rating ${reward?.rating < 0 ? "result-reward-negative" : "result-reward-nonnegative"}`;
  const userWon = Boolean(winnerColor && currentPlayer?.color === winnerColor);
  const userLost = Boolean(winnerColor && currentPlayer && currentPlayer.color !== winnerColor);
  const outcome = isDraw ? "draw" : userWon ? "win" : userLost ? "loss" : "spectator";
  const outcomeLabel = outcome === "win" ? "赢了耶！" : outcome === "loss" ? "输掉了..." : outcome === "draw" ? "平局" : "对局结束";
  const showPortrait = Boolean(displayPlayer && character);
  const resultClasses = [
    "result-modal",
    winnerColor === COLORS.black ? "black-win" : "",
    isDraw ? "draw-result" : "",
    `result-outcome-${outcome}`,
    showPortrait ? "has-result-portrait" : "no-result-portrait"
  ].filter(Boolean).join(" ");
  const playedResultSoundRef = useRef(false);
  const playedResultVoiceRef = useRef(false);

  useEffect(() => {
    if (playedResultSoundRef.current) return;
    const sound = resolveResultSound(room, user);
    if (!sound) return;
    playedResultSoundRef.current = true;
    playEffectSound(sound, audioSettings);
  }, [room, user, audioSettings]);

  useEffect(() => {
    if (playedResultVoiceRef.current) return;
    const event = resultVoiceEventForRoom(room, user);
    if (!event) return;
    playedResultVoiceRef.current = true;
    playSystemVoice(event, {
      character: voiceCharacter,
      audioSettings
    });
  }, [room, user, voiceCharacter, audioSettings]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className={resultClasses} onClick={(event) => event.stopPropagation()}>
        {showPortrait && (
          <div className="result-winner result-player-portrait">
            <span className="result-winner-portrait-wrap">
              <img
                className="result-player-portrait-image"
                src={resolveCandyPortrait(character, displayPlayer?.user?.itemEffects)}
                alt={character.name}
              />
              {outcome === "loss" && (
                <img
                  className="result-defeat-weather"
                  src={RESULT_DEFEAT_WEATHER_GIF}
                  alt=""
                  aria-hidden="true"
                />
              )}
              <CharacterChainBadge user={displayPlayer?.user} characterId={character.id} />
            </span>
            <strong>
              <UserIdentity user={displayPlayer?.user} />
            </strong>
          </div>
        )}
        <div className="result-summary">
          <span className={`result-outcome-label result-outcome-label-${outcome}`}>{outcomeLabel}</span>
          <p className="result-detail-text">{room.game.winner?.text ?? "对局结束"}</p>
          {isPractice
            ? <p className="result-match-note">人机练习 · 不计成长 · 不保存棋谱</p>
            : isFriendlyMatch && <p className="result-match-note">友谊对局 · 不计入积分与段位</p>}
          {reward && (
            <div className="result-rewards" aria-label="本局收益">
              <span className={ratingRewardClass}><strong>积分</strong><span className="text-rating-value">{formatSignedDelta(reward.rating)}</span></span>
              <span className="result-reward-tile result-reward-coins"><strong>金币</strong>{formatSignedDelta(reward.coins)}</span>
            </div>
          )}
          {reward?.rewardLimitReached && <p className="result-reward-limit-note">今日友谊对局奖励已达上限</p>}
          <button onClick={onClose}>确认</button>
        </div>
      </section>
    </div>
  );
}
