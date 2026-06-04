import { useEffect, useLayoutEffect, useRef } from "react";
import { BOARD_SOUND_TYPES, boardSoundActionAtStep, latestBoardSoundAction } from "../../shared/boardAudio.js";
import { nextCountdownAnnouncement, nextTimeAnnouncement } from "../../shared/timeAnnouncements.js";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "../../shared/systemVoices.js";
import { playBoardSound, preloadVoiceSound } from "../../audio/playback.jsx";
import { playSystemVoice } from "../../audio/systemVoicePlayback.js";
import { voiceCharacterForPlayer } from "../roomView.js";
import { applyRoomAudioBaseline, buildRoomAudioBaseline, shouldSeedRoomAudioBaseline } from "../roomAudioBaseline.js";
import { shouldPlayGameStartVoice } from "../roomState.js";

export function useRoomAudioEffects({
  activePlayer,
  audioSettings,
  characters,
  displayRoom,
  isReplay,
  me,
  replayStep,
  role,
  room
}) {
  const soundMoveRef = useRef(null);
  const hiddenRevealSoundRef = useRef(null);
  const replayStepSoundRef = useRef(replayStep);
  const voiceRef = useRef({});
  const preloadedCountdownRef = useRef("");
  const systemVoiceRef = useRef({});
  const seededAudioBaselineRef = useRef("");

  useLayoutEffect(() => {
    if (!shouldSeedRoomAudioBaseline(room)) return;
    const baselineKey = `${room.code}:${room.game.history.length}:${room.chat?.length ?? 0}`;
    if (seededAudioBaselineRef.current === baselineKey) return;
    seededAudioBaselineRef.current = baselineKey;
    applyRoomAudioBaseline({
      soundMoveRef,
      hiddenRevealSoundRef,
      voiceRef,
      systemVoiceRef
    }, buildRoomAudioBaseline(room));
  }, [room]);

  useEffect(() => {
    const boardSoundAction = latestBoardSoundAction(displayRoom.game.history);
    if (isReplay) {
      const previousReplayStep = replayStepSoundRef.current;
      replayStepSoundRef.current = replayStep;
      if (typeof previousReplayStep !== "number" || replayStep !== previousReplayStep + 1) return;
      playBoardSound(boardSoundActionAtStep(room.game.history, replayStep), audioSettings);
      return;
    }
    replayStepSoundRef.current = replayStep;
    if (!boardSoundAction || soundMoveRef.current === boardSoundAction.key) return;
    soundMoveRef.current = boardSoundAction.key;
    playBoardSound(boardSoundAction, audioSettings);
  }, [displayRoom.game.history, isReplay, replayStep, room.game.history, audioSettings]);

  useEffect(() => {
    if (isReplay) return;
    const exposedIds = displayRoom.game.points
      .filter((point) => point.hiddenHand?.exposed)
      .map((point) => point.id)
      .sort();
    const exposedKey = exposedIds.join("|");
    if (hiddenRevealSoundRef.current == null) {
      hiddenRevealSoundRef.current = exposedKey;
      return;
    }
    if (hiddenRevealSoundRef.current === exposedKey) return;
    const previous = new Set(hiddenRevealSoundRef.current.split("|").filter(Boolean));
    hiddenRevealSoundRef.current = exposedKey;
    const hasNewExposure = exposedIds.some((id) => !previous.has(id));
    const latestAction = latestBoardSoundAction(displayRoom.game.history);
    if (hasNewExposure && latestAction?.sound !== BOARD_SOUND_TYPES.hiddenReveal) {
      playBoardSound({ key: `hidden-reveal-${exposedKey}`, sound: BOARD_SOUND_TYPES.hiddenReveal }, audioSettings);
    }
  }, [displayRoom.game.points, displayRoom.game.history, isReplay, audioSettings]);

  useEffect(() => {
    if (isReplay || !activePlayer) return;
    const timer = activePlayer.time;
    const periodKey = `${activePlayer.color}-periods`;
    const mainKey = `${activePlayer.color}-main`;
    const previousPeriods = voiceRef.current[periodKey];
    const previousMain = voiceRef.current[mainKey];
    const announcement = nextTimeAnnouncement({
      previous: { main: previousMain, periods: previousPeriods },
      current: timer
    });
    if (announcement?.type === "voice") {
      playSystemVoice(announcement.event, {
        character: voiceCharacterForPlayer(activePlayer, characters),
        params: announcement.params,
        fallbackText: announcement.text,
        audioSettings
      });
    }
    if (timer.main <= 0 && timer.periodRemaining <= 10 && timer.periodRemaining > 0) {
      const countdownKey = `${activePlayer.color}-${displayRoom.game.history.length}-${timer.periods}-${timer.periodRemaining}`;
      if (!voiceRef.current[countdownKey]) {
        voiceRef.current[countdownKey] = true;
        const countdownAnnouncement = nextCountdownAnnouncement({ seconds: timer.periodRemaining });
        if (countdownAnnouncement?.type === "voice") {
          playSystemVoice(countdownAnnouncement.event, {
            character: voiceCharacterForPlayer(activePlayer, characters),
            params: countdownAnnouncement.params,
            fallbackText: countdownAnnouncement.text,
            audioSettings
          });
        }
      }
    }
    voiceRef.current[mainKey] = timer.main;
    voiceRef.current[periodKey] = timer.periods;
  }, [activePlayer, characters, displayRoom.game.history.length, isReplay, audioSettings]);

  useEffect(() => {
    if (isReplay || !activePlayer || !(activePlayer.time?.main <= 0)) return;
    const preloadSources = [];
    for (let seconds = 10; seconds >= 1; seconds -= 1) {
      const voice = resolveSystemVoice(SYSTEM_VOICE_EVENTS.countdown(seconds), {
        character: voiceCharacterForPlayer(activePlayer, characters),
        params: { seconds }
      });
      if (voice.type === "audio" && voice.src) preloadSources.push(voice.src);
    }
    const preloadKey = `${activePlayer.color}:${preloadSources.join("|")}`;
    if (!preloadSources.length || preloadedCountdownRef.current === preloadKey) return;
    preloadedCountdownRef.current = preloadKey;
    for (const src of preloadSources) {
      preloadVoiceSound(src);
    }
  }, [activePlayer, characters, isReplay]);

  useEffect(() => {
    if (!shouldPlayGameStartVoice({ isReplay, role, phase: displayRoom.game.phase })) return;
    const gameStartMessage = displayRoom.chat.findLast?.((message) => message.kind === "game-start");
    if (!gameStartMessage || systemVoiceRef.current.gameStart === gameStartMessage.id) return;
    systemVoiceRef.current.gameStart = gameStartMessage.id;
    playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, {
      character: voiceCharacterForPlayer(me, characters),
      audioSettings
    });
  }, [displayRoom.chat, displayRoom.game.phase, isReplay, role, me, characters, audioSettings]);
}
