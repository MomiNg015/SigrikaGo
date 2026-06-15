import { useEffect, useRef } from "react";
import { playEffectSound } from "../../audio/playback.jsx";
import { playSystemVoice } from "../../audio/systemVoicePlayback.js";
import { resolveCandyPortrait } from "../../shared/candyPortraits.js";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import UserIdentity from "../../shared/UserIdentity.jsx";
import { findCharacter } from "../../shared/characterDisplay.js";
import { COLORS } from "../../shared/game.js";
import { resolveResultSound } from "../../shared/musicLibrary.js";
import {
  formatSignedDelta,
  resultPlayerForRoom,
  resultRewardForRoom,
  resultVoiceEventForRoom
} from "./lifecycleHelpers.js";

export default function ResultModal({ room, user, characters, audioSettings, onClose }) {
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  const isDraw = !winnerColor;
  const winner = room.players.find((player) => player.color === winnerColor) ?? room.players[0];
  const character = findCharacter(characters, winner?.character ?? winner?.characterId);
  const currentPlayer = resultPlayerForRoom(room, user);
  const voiceCharacter = findCharacter(characters, currentPlayer?.character ?? currentPlayer?.characterId);
  const reward = resultRewardForRoom(room, user);
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
      <section className={`result-modal ${winnerColor === COLORS.black ? "black-win" : ""} ${isDraw ? "draw-result" : ""}`} onClick={(event) => event.stopPropagation()}>
        {!isDraw && (
          <div className="result-winner">
            <span className="result-winner-portrait-wrap">
              <img src={resolveCandyPortrait(character, winner?.user?.itemEffects)} alt={character.name} />
              <CharacterChainBadge user={winner?.user} characterId={character.id} />
            </span>
            <strong>
              <UserIdentity user={winner?.user} />
            </strong>
          </div>
        )}
        <div className="result-summary">
          <h2>对局结果</h2>
          <p>{room.game.winner?.text ?? "对局结束"}</p>
          {reward && (
            <div className="result-rewards" aria-label="本局收益">
              <span><strong>积分</strong>{formatSignedDelta(reward.rating)}</span>
              <span><strong>金币</strong>{formatSignedDelta(reward.coins)}</span>
            </div>
          )}
          <button onClick={onClose}>确认</button>
        </div>
      </section>
    </div>
  );
}
