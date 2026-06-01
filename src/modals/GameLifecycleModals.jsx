import { useEffect, useRef, useState } from "react";
import { MonitorPlay, Swords } from "lucide-react";
import { MATCH_SUCCESS_SOUND, resolveResultSound } from "../shared/musicLibrary.js";
import { COLORS } from "../shared/game.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { resultRewardDelta } from "../shared/resultRewards.js";
import { playEffectSound } from "../audio/playback.jsx";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import { SYSTEM_VOICE_EVENTS } from "../shared/systemVoices.js";

export function MatchModal({ user, startedAt, onCancel, characters }) {
  const [now, setNow] = useState(Date.now());
  const character = findCharacter(characters, user?.selectedCharacter);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section className="small-modal" onClick={(event) => event.stopPropagation()}>
        <img className="match-portrait" src={resolveCandyPortrait(character, user?.itemEffects)} alt={character.name} />
        <h2>匹配中</h2>
        <p>{secondsSinceStarted(startedAt, now)} 秒</p>
        <button onClick={onCancel}>取消匹配</button>
      </section>
    </div>
  );
}

export function MatchSuccessModal({ startedAt, audioSettings, onComplete }) {
  const [now, setNow] = useState(Date.now());
  const completedRef = useRef(false);
  const remaining = Math.max(0, 3 - secondsSinceStarted(startedAt, now));

  useEffect(() => {
    playEffectSound(MATCH_SUCCESS_SOUND, audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining > 0 || completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [remaining, onComplete]);

  return (
    <div className="modal-backdrop">
      <section className="small-modal match-success-modal">
        <MonitorPlay size={34} />
        <h2>匹配成功</h2>
        <p>{remaining} 秒后进入对弈</p>
      </section>
    </div>
  );
}

export function OpeningModal({ room, player }) {
  const [now, setNow] = useState(Date.now());
  const remaining = secondsUntilTimestamp(room.openingEndsAt ?? now, now);
  const colorText = colorTextForPlayer(player);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="modal-backdrop opening-backdrop">
      <section className="small-modal opening-modal">
        <Swords size={34} />
        <h2>{colorText ? `本局你执${colorText}` : "对局即将开始"}</h2>
        <p>{remaining} 秒后正式开始</p>
      </section>
    </div>
  );
}

export function ResultModal({ room, user, characters, audioSettings, onClose }) {
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
            <img src={resolveCandyPortrait(character, winner?.user?.itemEffects)} alt={character.name} />
            <strong>{winner?.user.username}</strong>
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

export function colorTextForPlayer(player) {
  if (player?.color === COLORS.black) return "黑";
  if (player?.color === COLORS.white) return "白";
  return "";
}

export function secondsSinceStarted(startedAt, now) {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function secondsUntilTimestamp(timestamp, now) {
  return Math.max(0, Math.ceil((timestamp - now) / 1000));
}

export function formatSignedDelta(value) {
  return value > 0 ? `+${value}` : String(value);
}

export function resultRewardForRoom(room, user) {
  const currentPlayer = resultPlayerForRoom(room, user);
  if (!currentPlayer) return null;
  if (room.game.winner?.invalid) return { rating: 0, coins: 0 };
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  return resultRewardDelta(currentPlayer.color, winnerColor);
}

export function resultPlayerForRoom(room, user) {
  return room.players.find((player) => player.user?.id === user?.id) ?? null;
}

export function resultVoiceEventForRoom(room, user) {
  if (room.game.winner?.invalid) return null;
  const currentPlayer = resultPlayerForRoom(room, user);
  if (!currentPlayer) return null;
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  if (!winnerColor) return SYSTEM_VOICE_EVENTS.resultDraw;
  return currentPlayer.color === winnerColor ? SYSTEM_VOICE_EVENTS.resultVictory : SYSTEM_VOICE_EVENTS.resultDefeat;
}
