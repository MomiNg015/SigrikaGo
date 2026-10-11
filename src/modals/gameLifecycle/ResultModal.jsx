import ResultRankProgress from "./ResultRankProgress.jsx";
import { useEffect, useMemo, useRef } from "react";
import { playEffectSound } from "../../audio/playback.jsx";
import { playSystemVoice } from "../../audio/systemVoicePlayback.js";
import ResultCharacterPortrait from "./ResultCharacterPortrait.jsx";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import { findCharacter } from "../../shared/characterDisplay.js";
import { COLORS } from "../../shared/game.js";
import { isPracticeRoom } from "../../shared/practiceMode.js";
import { isCaptureChallenge } from "../../shared/captureChallenge.js";
import { resolveResultSound } from "../../shared/musicLibrary.js";
import {
  formatSignedDelta,
  resultPlayerForRoom,
  resultRewardForRoom,
  resultVoiceEventForRoom
} from "./lifecycleHelpers.js";

const RESULT_DEFEAT_WEATHER_GIF = "/assets/effects/result-defeat-rain.gif";

export default function ResultModal({ room, user, characters, audioSettings, onClose, onLeaveRoom, onSpecialContinue }) {
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  const isDraw = !winnerColor;
  const winner = room.players.find((player) => player.color === winnerColor) ?? room.players[0];
  const currentPlayer = resultPlayerForRoom(room, user);
  const displayPlayer = currentPlayer ?? (!isDraw ? winner : null);
  const character = displayPlayer ? findCharacter(characters, displayPlayer?.character ?? displayPlayer?.characterId) : null;
  const resultVoiceCharacter = findCharacter(characters, currentPlayer?.character ?? currentPlayer?.characterId);
  const voiceCharacter = useMemo(() => resultVoiceCharacter ? {
    ...resultVoiceCharacter,
    itemEffects: currentPlayer?.completedItemEffects ?? currentPlayer?.user?.itemEffects ?? {}
  } : null, [resultVoiceCharacter, currentPlayer]);
  const reward = resultRewardForRoom(room, user);
  const isPractice = isPracticeRoom(room);
  const isChallenge = isCaptureChallenge(room);
  const challengeComplete = isChallenge && room.game.winner?.reason === "capture-challenge";
  const isSigrikaCandyDuel = Boolean(room.sigrikaCandyDuel);
  const isSigrikaCandyDuelOwner = isSigrikaCandyDuel && Boolean(currentPlayer);
  const isFriendlyMatch = reward?.rated === false || room.rated === false;
  const progressDelta = reward?.rank || reward?.stars || reward?.rating || 0;
  const ratingRewardClass = `result-reward-tile result-reward-rating ${progressDelta < 0 ? "result-reward-negative" : "result-reward-nonnegative"}`;
  const userWon = Boolean(winnerColor && currentPlayer?.color === winnerColor);
  const userLost = Boolean(winnerColor && currentPlayer && currentPlayer.color !== winnerColor);
  const outcome = isChallenge ? "challenge" : isDraw ? "draw" : userWon ? "win" : userLost ? "loss" : "spectator";
  const portraitOutcome = isChallenge ? (challengeComplete ? "win" : "loss")
    : isDraw ? "draw" : displayPlayer?.color === winnerColor ? "win" : "loss";
  const outcomeLabel = isChallenge ? (challengeComplete ? "挑战完成" : "挑战未完成") : outcome === "win" ? "赢了耶！" : outcome === "loss" ? "输掉了..." : outcome === "draw" ? "平局" : "对局结束";
  const showPortrait = !isSigrikaCandyDuel && Boolean(displayPlayer && character);
  const resultClasses = [
    `result-modal${isSigrikaCandyDuel ? " sigrika-corruption-result-modal" : " result-compact"}`,
    !isChallenge && winnerColor === COLORS.black ? "black-win" : "",
    !isChallenge && isDraw ? "draw-result" : "",
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
  }, [room, user, audioSettings, isChallenge]);

  useEffect(() => {
    if (playedResultVoiceRef.current) return;
    const event = resultVoiceEventForRoom(room, user);
    if (!event) return;
    playedResultVoiceRef.current = true;
    playSystemVoice(event, {
      character: voiceCharacter,
      audioSettings
    });
  }, [room, user, voiceCharacter, audioSettings, isChallenge]);

  return (
    <div className={`modal-backdrop ${isSigrikaCandyDuel ? "sigrika-corruption-result-backdrop" : ""}`} onClick={isSigrikaCandyDuel ? undefined : onClose}>
      <section className={resultClasses} onClick={(event) => event.stopPropagation()}>
        {showPortrait && (
          <div className="result-winner result-player-portrait">
            <span className="result-winner-portrait-wrap">
              <ResultCharacterPortrait character={character} outcome={portraitOutcome}
                itemEffects={displayPlayer?.user?.itemEffects}
                user={displayPlayer?.user} costumeSnapshot={displayPlayer?.costumeSnapshot} />
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
          </div>
        )}
        <div className="result-summary">
          <span className={`result-outcome-label result-outcome-label-${outcome}`}>{outcomeLabel}</span>
          <p className="result-detail-text" aria-live="polite">{isChallenge && !challengeComplete
            ? "本次挑战未满100手，成绩不计入排行榜。"
            : room.game.winner?.text ?? "对局结束"}</p>
          {isChallenge && room.practice.result?.breakthrough && <p className="capture-challenge-breakthrough" role="status">突破个人最高排名！</p>}
          {!isSigrikaCandyDuel && !isPractice && (isFriendlyMatch || room.team) && (
            <p className="result-match-note">{room.team ? "队际赛 · 独立段位，不奖励金币" : "友谊对局 · 不计入积分与段位"}</p>
          )}
          {room.team && <div className="team-result-lineups">
            {room.players.map((player) => <p key={player.color}><strong>{player.color === "black" ? "黑方" : "白方"}</strong> {player.teamLineup?.map((member) => member.character?.name ?? "?").join(" → ")}</p>)}
          </div>}
          {!isSigrikaCandyDuel && reward && (
            <div className="result-rewards" aria-label="本局收益">
              <span className={ratingRewardClass}><ResultRankProgress reward={reward} rank={reward.rankAfter ?? currentPlayer?.user?.rank ?? user.rank} stars={reward.starsAfter ?? currentPlayer?.user?.stars ?? user.stars} rating={reward.ratingAfter ?? currentPlayer?.user?.rating ?? user.rating} /></span>
              <span className="result-reward-tile result-reward-coins"><strong>金币</strong>{formatSignedDelta(reward.coins)}</span>
            </div>
          )}
          {reward?.rewardLimitReached && <p className="result-reward-limit-note">今日友谊对局奖励已达上限</p>}
          {isSigrikaCandyDuel ? <button onClick={() => onSpecialContinue?.({ owner: isSigrikaCandyDuelOwner })}>
            {isSigrikaCandyDuelOwner ? "继续" : "确认"}
          </button> : <div className="result-actions">
            <button onClick={onClose}>返回棋盘</button>
            {onLeaveRoom && <button className="result-leave" onClick={onLeaveRoom}>退出房间</button>}
          </div>}
        </div>
      </section>
    </div>
  );
}
