import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  ChartNoAxesColumn,
  CircleDollarSign,
  Flag,
  Gem,
  Hash,
  MessageSquareText,
  MonitorPlay,
  PanelRight,
  Settings,
  ShoppingBag,
  Sparkles,
  Swords,
  Star,
  Trophy,
  X
} from "lucide-react";
import { CHARACTERS, mergeCharacters } from "./shared/characters.js";
import { COLORS, GAME_PHASES, gameViewForColor } from "./shared/game.js";
import { derivePlayerRecordStats } from "./shared/gameRecords.js";
import { BOARD_SOUND_TYPES, boardSoundActionAtStep, latestBoardSoundAction } from "./shared/boardAudio.js";
import { MATCH_SUCCESS_SOUND, latestSkillCharacterId, resolveBackgroundMusic, resolveResultSound } from "./shared/musicLibrary.js";
import { nextCountdownAnnouncement, nextTimeAnnouncement } from "./shared/timeAnnouncements.js";
import { DEFAULT_SITE_SETTINGS } from "./shared/siteSettings.js";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "./shared/systemVoices.js";
import { resultRewardDelta } from "./shared/resultRewards.js";
import { getStoneDecoration } from "./shared/stoneDecorations.js";
import { findCharacter } from "./shared/characterDisplay.js";
import { BackgroundMusic, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, playBoardSound, playEffectSound, preloadVoiceSound } from "./audio/playback.jsx";
import { playSystemVoice } from "./audio/systemVoicePlayback.js";
import AdminConsole from "./admin/AdminConsole.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import HomeScreen from "./home/HomeScreen.jsx";
import LeaderboardModal from "./modals/LeaderboardModal.jsx";
import MessageBoardModal from "./modals/MessageBoardModal.jsx";
import SettingsModal from "./modals/SettingsModal.jsx";
import WatchModal from "./modals/WatchModal.jsx";
import ActionBar from "./room/ActionBar.jsx";
import Board from "./room/Board.jsx";
import ChatBox from "./room/ChatBox.jsx";
import OperationHint from "./room/OperationHint.jsx";
import PlayerInfo from "./room/PlayerInfo.jsx";
import RoomPeopleList from "./room/RoomPeopleList.jsx";
import {
  replayGameAt,
  replayRoomAt,
  stoneDecorationsForRoom,
  voiceCharacterForPlayer
} from "./room/roomView.js";
import { adminApi, api } from "./api/client.js";
import "./styles.css";

const SOCKET_BASE = "http://localhost:3001";
const SHOW_TEST_TOOLS = import.meta.env.DEV;

function App() {
  const [token, setToken] = useState(localStorage.getItem("sigrika-token") ?? "");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState("");
  const [matchStart, setMatchStart] = useState(null);
  const [matchSuccess, setMatchSuccess] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showHouse, setShowHouse] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWatch, setShowWatch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMessageBoard, setShowMessageBoard] = useState(false);
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const [watchCode, setWatchCode] = useState("");
  const [pendingSkill, setPendingSkill] = useState(false);
  const [replayRecords, setReplayRecords] = useState([]);
  const [replayStep, setReplayStep] = useState(null);
  const [dismissedResultRoom, setDismissedResultRoom] = useState("");
  const [characters, setCharacters] = useState(CHARACTERS);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [adminTab, setAdminTab] = useState("overview");
  const matchSuccessRef = useRef(matchSuccess);
  const characterListView = Object.values(characters);
  const resultModalOpen = room?.game.phase === "finished" && dismissedResultRoom !== room.code;
  const backgroundMusic = resolveBackgroundMusic({
    view,
    skillPreview: room?.game?.pendingSkill,
    latestSkillCharacterId: latestSkillCharacterId(room),
    gamePhase: room?.game?.phase,
    matchSuccess: Boolean(matchSuccess),
    resultModalOpen,
    selections: user?.musicSelections,
    ownedMusicIds: user?.ownedMusicIds
  });

  useEffect(() => {
    matchSuccessRef.current = matchSuccess;
  }, [matchSuccess]);

  useEffect(() => {
    refreshSiteSettings();
  }, []);

  useEffect(() => {
    if (!token) return;
    api("/api/me", { token })
      .then((data) => {
        setUser(data.user);
        setView("home");
        refreshPublicCharacters();
      })
      .catch(() => {
        localStorage.removeItem("sigrika-token");
        socket?.close();
        setToken("");
        setUser(null);
        setRoom(null);
        setMatchStart(null);
        setMatchSuccess(null);
        setShowShop(false);
        setShowHouse(false);
        setShowLeaderboard(false);
        setShowWatch(false);
        setView("login");
        setCharacters(CHARACTERS);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    const nextSocket = io(SOCKET_BASE, { auth: { token } });
    nextSocket.on("match:waiting", ({ startedAt }) => setMatchStart(startedAt));
    nextSocket.on("match:found", (roomView) => {
      setReplayStep(null);
      setMatchStart(null);
      const transition = {
        room: roomView,
        startedAt: Date.now()
      };
      matchSuccessRef.current = transition;
      setMatchSuccess(transition);
    });
    nextSocket.on("room:update", (roomView) => {
      if (matchSuccessRef.current) {
        setMatchSuccess((current) => current ? { ...current, room: roomView } : current);
        return;
      }
      setRoom(roomView);
      setView("room");
    });
    nextSocket.on("room:closed", () => {
      setRoom(null);
      setView("home");
      setToast("房间已关闭。");
    });
    nextSocket.on("error:toast", (message) => {
      if (String(message).includes("房间不存在")) {
        setRoom(null);
        setReplayStep(null);
        setPendingSkill(false);
        setMatchSuccess(null);
        setView("home");
      }
      setToast(message);
    });
    setSocket(nextSocket);
    return () => nextSocket.close();
  }, [token, user]);

  useEffect(() => {
    if (!showHouse || !token) return;
    api("/api/replays", { token })
      .then((data) => setReplayRecords(data.records))
      .catch((error) => setToast(error.message));
  }, [showHouse, token]);

  useEffect(() => {
    localStorage.setItem("sigrika-audio-settings", JSON.stringify(audioSettings));
  }, [audioSettings]);

  function handleAuth(nextToken, nextUser) {
    localStorage.setItem("sigrika-token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setView("home");
  }

  async function refreshPublicCharacters() {
    try {
      const data = await api("/api/characters", { token });
      setCharacters(mergeCharacters(data.characters, data.disabledSlugs));
    } catch {
      setCharacters(CHARACTERS);
    }
  }

  async function refreshSiteSettings() {
    try {
      const data = await api("/api/site-settings");
      setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...(data.settings ?? {}) });
    } catch {
      setSiteSettings(DEFAULT_SITE_SETTINGS);
    }
  }

  function logout() {
    localStorage.removeItem("sigrika-token");
    socket?.close();
    setToken("");
    setUser(null);
    setRoom(null);
    setMatchSuccess(null);
    setCharacters(CHARACTERS);
    setView("login");
  }

  async function selectCharacter(characterId) {
    const data = await api("/api/me/character", {
      method: "POST",
      token,
      body: { characterId }
    });
    setUser(data.user);
  }

  async function applyStoneDecoration(decorationId) {
    const data = await api("/api/me/decoration", {
      method: "POST",
      token,
      body: { decorationId }
    });
    setUser(data.user);
  }

  function startMatch() {
    setMatchSuccess(null);
    setMatchStart(Date.now());
    socket?.emit("match:join");
  }

  function joinWatchRoom() {
    if (watchCode.length !== 5) return;
    socket?.emit("room:join", { roomCode: watchCode });
  }

  function emitGame(action) {
    if (!room) return;
    socket?.emit("game:action", { roomCode: room.code, action });
  }

  function emitScoring(action) {
    if (!room) return;
    socket?.emit("scoring:action", { roomCode: room.code, action });
  }

  function requestDraw() {
    if (!room) return;
    socket?.emit("draw:request", { roomCode: room.code });
  }

  function respondDraw(accepted) {
    if (!room) return;
    socket?.emit("draw:respond", { roomCode: room.code, accepted });
  }

  async function openReplay(recordId) {
    const data = await api(`/api/replays/${recordId}`, { token });
    const snapshot = data.record.snapshot;
    setRoom(snapshot);
    setReplayStep(snapshot.game.history.length);
    setPendingSkill(false);
    setShowHouse(false);
    setView("room");
  }

  async function openAdminReplay(recordId) {
    const data = await adminApi(`/replays/${recordId}`, token);
    const snapshot = data.record.snapshot;
    setRoom(snapshot);
    setReplayStep(snapshot.game.history.length);
    setPendingSkill(false);
    setView("room");
  }

  return (
    <div className="app-shell">
      <BackgroundMusic track={backgroundMusic} audioSettings={audioSettings} />
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
      {view === "login" && <AuthScreen onAuth={handleAuth} />}
      {view === "home" && user && (
        <HomeScreen
          user={user}
          characters={characters}
          siteSettings={siteSettings}
          onLogout={logout}
          onSelectCharacter={selectCharacter}
          onStartMatch={startMatch}
          onOpenHouse={() => setShowHouse(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenWatch={() => setShowWatch(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMessageBoard={() => setShowMessageBoard(true)}
          onOpenAdmin={() => setView("admin")}
        />
      )}
      {view === "admin" && user?.role === "admin" && (
        <AdminConsole
          user={user}
          token={token}
          tab={adminTab}
          setTab={setAdminTab}
          onCurrentUserChange={setUser}
          onCharactersChanged={refreshPublicCharacters}
          onSiteSettingsChanged={setSiteSettings}
          onBack={() => setView("home")}
          onOpenReplay={openAdminReplay}
        />
      )}
      {view === "admin" && user?.role !== "admin" && (
        <HomeScreen
          user={user}
          characters={characters}
          siteSettings={siteSettings}
          onLogout={logout}
          onSelectCharacter={selectCharacter}
          onStartMatch={startMatch}
          onOpenHouse={() => setShowHouse(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenWatch={() => setShowWatch(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMessageBoard={() => setShowMessageBoard(true)}
          onOpenAdmin={() => setView("admin")}
        />
      )}
      {view === "room" && room && user && (
        <RoomScreen
          room={room}
          user={user}
          characters={characters}
          replayStep={replayStep}
          setReplayStep={setReplayStep}
          pendingSkill={pendingSkill}
          setPendingSkill={setPendingSkill}
          audioSettings={audioSettings}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMessageBoard={() => setShowMessageBoard(true)}
          onBack={() => {
            setReplayStep(null);
            setView("home");
          }}
          onGameAction={emitGame}
          onCountingRequest={() => socket?.emit("counting:request", { roomCode: room.code })}
          onCountingRespond={(accepted) => socket?.emit("counting:respond", { roomCode: room.code, accepted })}
          onDrawRequest={requestDraw}
          onDrawRespond={respondDraw}
          onScoringAction={emitScoring}
          onChat={(text) => socket?.emit("chat:send", { roomCode: room.code, text })}
        />
      )}
      {resultModalOpen && (
        <ResultModal
          room={room}
          user={user}
          characters={characters}
          audioSettings={audioSettings}
          onClose={() => setDismissedResultRoom(room.code)}
        />
      )}
      {matchStart && <MatchModal user={user} startedAt={matchStart} onCancel={() => {
        socket?.emit("match:leave");
        setMatchStart(null);
      }} characters={characters} />}
      {matchSuccess && (
        <MatchSuccessModal
          startedAt={matchSuccess.startedAt}
          audioSettings={audioSettings}
          onComplete={() => {
            setRoom(matchSuccess.room);
            matchSuccessRef.current = null;
            setMatchSuccess(null);
            setView("room");
          }}
        />
      )}
      {showHouse && user && (
        <HouseModal
          user={user}
          records={replayRecords}
          characterListView={characterListView}
          audioSettings={audioSettings}
          onClose={() => setShowHouse(false)}
          onSelectCharacter={selectCharacter}
          onApplyDecoration={applyStoneDecoration}
          onOpenReplay={openReplay}
        />
      )}
      {showLeaderboard && (
        <LeaderboardModal
          token={token}
          characters={characters}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
      {showWatch && (
        <WatchModal
          code={watchCode}
          setCode={setWatchCode}
          onClose={() => setShowWatch(false)}
          onJoin={() => {
            joinWatchRoom();
            if (watchCode.length === 5) setShowWatch(false);
          }}
        />
      )}
      {showShop && (
        <ShopModal
          token={token}
          user={user}
          onPurchased={(nextUser) => setUser(nextUser)}
          onClose={() => setShowShop(false)}
        />
      )}
      {showSettings && (
        <SettingsModal
          siteSettings={siteSettings}
          audioSettings={audioSettings}
          setAudioSettings={setAudioSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showMessageBoard && <MessageBoardModal onClose={() => setShowMessageBoard(false)} />}
    </div>
  );
}

function RoomScreen({ room, user, characters, replayStep, setReplayStep, pendingSkill, setPendingSkill, audioSettings, onOpenSettings, onOpenMessageBoard, onBack, onGameAction, onCountingRequest, onCountingRespond, onDrawRequest, onDrawRespond, onScoringAction, onChat }) {
  const [showCoords, setShowCoords] = useState(true);
  const [showMoves, setShowMoves] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [spectatorStep, setSpectatorStep] = useState(null);
  const [viewColor, setViewColor] = useState(COLORS.black);
  const liveStepRef = useRef(room.game.history.length);
  const isReplay = replayStep !== null;
  const liveStep = room.game.history.length;
  const isLiveSpectator = room.role === "spectator" && !isReplay;
  const effectiveSpectatorStep = spectatorStep ?? liveStep;
  const boardStep = isReplay ? replayStep : isLiveSpectator ? effectiveSpectatorStep : null;
  const rawBoardGame = boardStep == null || boardStep >= liveStep
    ? isLiveSpectator && room.gameViews?.[viewColor] ? room.gameViews[viewColor] : room.game
    : replayGameAt(room, boardStep);
  const boardGame = (isReplay || isLiveSpectator) && !(isLiveSpectator && boardStep >= liveStep && room.gameViews?.[viewColor])
    ? gameViewForColor(rawBoardGame, viewColor)
    : rawBoardGame;
  const displayRoom = isReplay ? replayRoomAt(room, replayStep, viewColor) : isLiveSpectator ? { ...room, game: boardGame } : room;
  const role = isReplay ? "spectator" : displayRoom.role;
  const blackPlayer = displayRoom.players.find((p) => p.color === COLORS.black);
  const whitePlayer = displayRoom.players.find((p) => p.color === COLORS.white);
  const me = role === "spectator" ? blackPlayer : displayRoom.players.find((p) => p.user.id === user.id);
  const opponent = role === "spectator" ? whitePlayer : displayRoom.players.find((p) => p.user.id !== user.id) ?? displayRoom.players[1];
  const activePlayer = displayRoom.players.find((p) => p.color === displayRoom.game.turn);
  const scoring = displayRoom.game.scoring;
  const drawRequest = displayRoom.game.drawRequest;
  const soundMoveRef = useRef(null);
  const hiddenRevealSoundRef = useRef(null);
  const replayStepSoundRef = useRef(replayStep);
  const voiceRef = useRef({});
  const preloadedCountdownRef = useRef("");
  const systemVoiceRef = useRef({});
  const winnerColor = displayRoom.game.winner?.winnerColor ?? displayRoom.game.winner?.color;
  const skillPreview = displayRoom.game.pendingSkill;
  const canSwitchView = role === "spectator";

  useEffect(() => {
    if (!isLiveSpectator) {
      liveStepRef.current = liveStep;
      return;
    }
    setSpectatorStep((current) => {
      const wasFollowingLive = current == null || current >= liveStepRef.current;
      liveStepRef.current = liveStep;
      if (wasFollowingLive) return liveStep;
      return Math.min(current, liveStep);
    });
  }, [isLiveSpectator, liveStep, room.code]);

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
  }, [displayRoom.game.history, isReplay, replayStep, audioSettings]);

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
  }, [activePlayer, characters, isReplay, audioSettings]);

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
    if (isReplay) return;
    const gameStartMessage = displayRoom.chat.findLast?.((message) => message.kind === "game-start");
    if (!gameStartMessage || systemVoiceRef.current.gameStart === gameStartMessage.id) return;
    systemVoiceRef.current.gameStart = gameStartMessage.id;
    playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, {
      character: voiceCharacterForPlayer(me, characters),
      audioSettings
    });
  }, [displayRoom.chat, isReplay, me, characters, audioSettings]);

  function handlePoint(point) {
    if (isReplay) return;
    if (skillPreview) return;
    if (displayRoom.game.phase === "marking-dead") return handleScoringPoint(point);
    if (displayRoom.game.phase !== GAME_PHASES.playing) return;
    if (role !== "player") return;
    if (pendingSkill) {
      setPendingSkill(false);
      onGameAction({ type: "skill", pointId: point.id });
      return;
    }
    onGameAction({ type: "move", pointId: point.id });
  }

  function handleScoringPoint(point) {
    if (point.stone) onScoringAction({ type: "mark-dead", pointId: point.id });
    else if (point.valid) onScoringAction({ type: "mark-neutral", pointId: point.id });
  }

  function requestResignConfirm() {
    if (displayRoom.game.phase === "finished") return;
    setConfirmAction({
      title: "确认认输",
      message: "是否认输？",
      confirmText: "认输",
      onConfirm: () => onGameAction({ type: "resign" })
    });
  }

  function requestExitConfirm() {
    if (displayRoom.game.phase !== "finished" && role === "player") {
      setConfirmAction({
        title: "退出房间",
        message: "对局还没结束，是否认输并退出房间？",
        confirmText: "认输并退出",
        onConfirm: () => {
          onGameAction({ type: "resign" });
          onBack();
        }
      });
      return;
    }
    onBack();
  }

  return (
    <main className="room-screen">
      <header className="room-header">
        <div>
          <p>房间号 {room.code}</p>
          {isReplay && <h1>棋谱回放</h1>}
        </div>
        <div className="room-toggles">
          <button className="toggle" onClick={onOpenMessageBoard} title="留言板"><MessageSquareText size={16} /></button>
          <button className="toggle" onClick={onOpenSettings} title="设置"><Settings size={16} /></button>
          <button className={showMoves ? "toggle active" : "toggle"} onClick={() => setShowMoves(!showMoves)} title="显示手数"><Hash size={16} /></button>
          <button className={showCoords ? "toggle active" : "toggle"} onClick={() => setShowCoords(!showCoords)} title="显示坐标"><PanelRight size={16} /></button>
        </div>
      </header>
      <section className="battle-layout">
        <div className="opponent-side">
          <PlayerInfo
            player={opponent}
            game={displayRoom.game}
            characters={characters}
            align="opponent"
            viewColor={viewColor}
            canSwitchView={canSwitchView}
            onViewColor={setViewColor}
            isWinner={displayRoom.game.phase === "finished" && opponent?.color === winnerColor}
            isActiveTurn={displayRoom.game.phase === "playing" && opponent?.color === displayRoom.game.turn}
            isDrawResult={displayRoom.game.phase === "finished" && !winnerColor}
          />
          <RoomPeopleList room={displayRoom} />
          <OperationHint room={displayRoom} user={user} scoring={scoring} drawRequest={drawRequest} />
        </div>
        <div className="board-column">
          <div className="board-stage">
            <Board
              game={displayRoom.game}
              showCoords={showCoords}
              showMoves={showMoves}
              pendingSkill={pendingSkill}
              previewPlayer={role === "player" ? me : null}
              stoneDecorations={stoneDecorationsForRoom(displayRoom)}
              onPoint={handlePoint}
              onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
              onNeutral={(id) => onScoringAction({ type: "mark-neutral", pointId: id })}
            />
          </div>
          <ActionBar
            role={role}
            phase={displayRoom.game.phase}
            me={me}
            isMyTurn={Boolean(me && displayRoom.game.turn === me.color)}
            pendingSkill={pendingSkill}
            setPendingSkill={setPendingSkill}
            skillLocked={Boolean(skillPreview)}
            skillUses={me ? displayRoom.game.skillUses[me.color] ?? 0 : 0}
            scoring={scoring}
            drawRequest={drawRequest}
            drawDeadline={displayRoom.drawDeadline ?? drawRequest?.deadline}
            countingDeadline={displayRoom.countingDeadline ?? scoring?.deadline}
            resultDeadline={displayRoom.resultDeadline ?? scoring?.resultDeadline}
            replayStep={boardStep ?? liveStep}
            replayMax={liveStep}
            onReplayStep={isReplay ? setReplayStep : isLiveSpectator ? setSpectatorStep : null}
            showTestTools={SHOW_TEST_TOOLS}
            onTestRandomLayout={() => onGameAction({ type: "test-random-layout" })}
            onTestRestoreSkill={() => onGameAction({ type: "test-restore-skill" })}
            onPass={() => onGameAction({ type: "pass" })}
            onCountingRequest={onCountingRequest}
            onCountingRespond={onCountingRespond}
            onDrawRequest={onDrawRequest}
            onDrawRespond={onDrawRespond}
            onConfirmScoring={() => onScoringAction({ type: "confirm-dead" })}
            onResetScoring={() => onScoringAction({ type: "reset-dead" })}
            onAcceptResult={() => onScoringAction({ type: "accept-result" })}
            onRejectResult={() => onScoringAction({ type: "reject-result" })}
            onResign={requestResignConfirm}
            onBack={requestExitConfirm}
          />
        </div>
        <div className="room-side">
          <PlayerInfo
            player={me ?? displayRoom.players[0]}
            game={displayRoom.game}
            characters={characters}
            align="self"
            viewColor={viewColor}
            canSwitchView={canSwitchView}
            onViewColor={setViewColor}
            isWinner={displayRoom.game.phase === "finished" && (me ?? displayRoom.players[0])?.color === winnerColor}
            isActiveTurn={displayRoom.game.phase === "playing" && (me ?? displayRoom.players[0])?.color === displayRoom.game.turn}
            isDrawResult={displayRoom.game.phase === "finished" && !winnerColor}
            isSkillTargeting={Boolean(pendingSkill && role === "player")}
          />
          <ChatBox room={displayRoom} onChat={onChat} readonly={isReplay} />
        </div>
      </section>
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            const action = confirmAction.onConfirm;
            setConfirmAction(null);
            action();
          }}
        />
      )}
      {!isReplay && displayRoom.game.phase === GAME_PHASES.opening && (
        <OpeningModal room={displayRoom} player={me} />
      )}
      {skillPreview && <SkillBanner banner={skillPreview} characters={characters} audioSettings={audioSettings} />}
    </main>
  );
}

function HouseModal({ user, records, characterListView, audioSettings, onClose, onSelectCharacter, onApplyDecoration, onOpenReplay }) {
  const [detailCharacter, setDetailCharacter] = useState(null);
  const [showReplays, setShowReplays] = useState(false);
  const [applyingDecoration, setApplyingDecoration] = useState("");
  const [decorationError, setDecorationError] = useState("");
  const stats = derivePlayerRecordStats(user, records);
  const owned = new Set(user.ownedCharacters ?? []);
  const detailOwned = detailCharacter ? owned.has(detailCharacter.id) : false;
  const emptySlots = Array.from({ length: Math.max(0, 10 - characterListView.length) }, (_, index) => index);
  function openCharacterDetail(character) {
    setDetailCharacter(character);
    playSystemVoice(SYSTEM_VOICE_EVENTS.houseDetail, {
      character,
      audioSettings
    });
  }

  async function applyDecoration(decorationId) {
    setDecorationError("");
    setApplyingDecoration(decorationId || "default");
    try {
      await onApplyDecoration(decorationId);
    } catch (error) {
      setDecorationError(error.message);
    } finally {
      setApplyingDecoration("");
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="house-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="house-header">
          <h2>棋舍</h2>
          <button className="replay-open-button" onClick={() => setShowReplays(true)}>
            <MonitorPlay size={18} />对局回放
          </button>
        </header>
        <div className="profile-grid">
          <Stat label="战绩" value={`${stats.totalGames}局 · ${stats.wins}胜${stats.losses}负${stats.draws}和`} icon={<ChartNoAxesColumn size={16} />} />
          <Stat label="积分" value={stats.rating} icon={<Star size={16} />} />
          <Stat label="段位" value={user.rank} icon={<Trophy size={16} />} />
          <Stat label="金币" value={user.coins} icon={<CircleDollarSign size={16} />} />
        </div>
        <div className="character-list">
          {characterListView.map((character) => (
            <div
              className={`character-card portrait-card ${user.selectedCharacter === character.id ? "selected" : ""} ${owned.has(character.id) ? "" : "unowned"}`}
              key={character.id}
              onClick={() => openCharacterDetail(character)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") openCharacterDetail(character);
              }}
            >
              <button
                className={`sortie-button ${user.selectedCharacter === character.id ? "selected" : ""}`}
                title={user.selectedCharacter === character.id ? "出战中" : "设为出战"}
                disabled={!owned.has(character.id)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectCharacter(character.id);
                }}
              >
                <Flag size={18} />
              </button>
              <img src={character.portrait} alt={character.name} />
              <strong>{character.name}</strong>
            </div>
          ))}
          {emptySlots.map((slot) => (
            <div className="character-card portrait-card locked" key={`empty-${slot}`}>
              <button className="sortie-button" disabled title="未获得">
                <Flag size={18} />
              </button>
              <span className="locked-portrait">?</span>
              <strong>敬请期待</strong>
            </div>
          ))}
        </div>
        <section className="owned-decoration-section">
          <div className="owned-decoration-header">
            <h3>装饰</h3>
            {user.selectedStoneDecoration && (
              <button className="secondary-action compact-action" disabled={applyingDecoration === "default"} onClick={() => applyDecoration("")}>
                恢复初始装饰
              </button>
            )}
          </div>
          <div className="owned-decoration-list">
            {(user.ownedDecorations ?? []).length === 0 && <p className="quiet-text">暂无装饰。</p>}
            {(user.ownedDecorations ?? []).map((decorationId) => {
              const decoration = getStoneDecoration(decorationId);
              const selected = user.selectedStoneDecoration === decorationId;
              return (
                <button
                  className={`owned-decoration-chip ${selected ? "selected" : ""}`}
                  key={decorationId}
                  disabled={selected || applyingDecoration === decorationId}
                  onClick={() => applyDecoration(decorationId)}
                >
                  {decoration ? <StoneDecorationPreview decoration={decoration} /> : null}
                  <span>{decoration?.name ?? decorationId}</span>
                  <strong>{selected ? "使用中" : applyingDecoration === decorationId ? "应用中" : "应用"}</strong>
                </button>
              );
            })}
          </div>
          {decorationError && <p className="form-error admin-action-error">{decorationError}</p>}
        </section>
        {detailCharacter && (
          <section className={`nested-modal character-detail ${detailOwned ? "" : "unowned"}`}>
            <button className="close-button" onClick={() => setDetailCharacter(null)}><X size={18} /></button>
            <div className="character-detail-art">
              <img src={detailCharacter.portrait} alt={detailCharacter.name} />
            </div>
            <div className="character-detail-copy">
              <h3>{detailCharacter.name}</h3>
              <div className="skill-title-row">
                <strong>{detailCharacter.skill.name}</strong>
                <span className="skill-cost-badge">代价 {formatSkillCost(detailCharacter.skill)}</span>
              </div>
              <p>{detailCharacter.skill.description}</p>
              <p className="acquisition-method"><strong>获得途径</strong>{detailCharacter.acquisitionMethod || "初始可用"}</p>
            </div>
          </section>
        )}
        {showReplays && (
          <section className="nested-modal replay-dialog">
            <button className="close-button" onClick={() => setShowReplays(false)}><X size={18} /></button>
            <h3>对局回放</h3>
            <div className="replay-list">
              {records.length === 0 && <p className="quiet-text">暂无已结束的对局记录。</p>}
              {records.map((record) => (
                <button className="replay-item" key={record.id} onClick={() => onOpenReplay(record.id)}>
                  <strong>{record.blackName} vs {record.whiteName}</strong>
                  <span>{record.resultText} · {record.moveCount}手 · {formatDateTime(record.createdAt)}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

function MatchModal({ user, startedAt, onCancel, characters }) {
  const [now, setNow] = useState(Date.now());
  const character = findCharacter(characters, user?.selectedCharacter);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="modal-backdrop">
      <section className="small-modal">
        <img className="match-portrait" src={character.portrait} alt={character.name} />
        <h2>匹配中</h2>
        <p>{Math.floor((now - startedAt) / 1000)} 秒</p>
        <button onClick={onCancel}>取消匹配</button>
      </section>
    </div>
  );
}

function MatchSuccessModal({ startedAt, audioSettings, onComplete }) {
  const [now, setNow] = useState(Date.now());
  const completedRef = useRef(false);
  const remaining = Math.max(0, 3 - Math.floor((now - startedAt) / 1000));

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

function OpeningModal({ room, player }) {
  const [now, setNow] = useState(Date.now());
  const remaining = Math.max(0, Math.ceil(((room.openingEndsAt ?? now) - now) / 1000));
  const colorText = player?.color === COLORS.black ? "黑" : player?.color === COLORS.white ? "白" : "";

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

function ShopModal({ token, user, onPurchased, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("character");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [purchasingId, setPurchasingId] = useState("");

  useEffect(() => {
    let alive = true;
    if (!token || !user) {
      setLoading(false);
      setItems([]);
      setError("请先登录");
      return () => {
        alive = false;
      };
    }
    setLoading(true);
    setError("");
    api("/api/shop", { token })
      .then((data) => {
        if (alive) setItems(data.items ?? []);
      })
      .catch((apiError) => {
        if (alive) setError(apiError.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, user]);

  async function buyItem(item) {
    setMessage("");
    setError("");
    setPurchasingId(item.id);
    try {
      const data = await api(`/api/shop/${item.id}/purchase`, { method: "POST", token });
      onPurchased(data.user);
      setMessage(`已购买 ${item.name}`);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setPurchasingId("");
    }
  }

  const visibleItems = items.filter((item) => item.category === activeCategory);
  const shopSlots = Array.from({ length: 8 }, (_, index) => visibleItems[index] ?? null);
  const categories = [
    ["character", "角色"],
    ["decoration", "装饰"]
  ];

  return (
    <div className="modal-backdrop">
      <section className="shop-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="shop-header">
          <div className="shop-title-block">
            <h2>扎希拉商店</h2>
            <p className="shop-wallet"><CircleDollarSign size={18} />{user?.coins ?? 0}</p>
          </div>
          <div className="shop-mascot-slot" aria-label="Q版立绘占位区">
            <Gem size={26} />
          </div>
        </header>
        <div className="shop-tabs" role="tablist" aria-label="商城分类">
          {categories.map(([key, label]) => (
            <button key={key} className={activeCategory === key ? "active" : ""} onClick={() => setActiveCategory(key)}>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {message && <p className="admin-success">{message}</p>}
        {error && <p className="form-error admin-action-error">{error}</p>}
        {loading && <p className="quiet-text">加载中...</p>}
        <div className="shop-grid">
          {!loading && shopSlots.map((item, index) => {
            if (!item) {
              return (
                <article className="shop-item shop-item-empty" key={`empty-${activeCategory}-${index}`}>
                  <ShoppingBag />
                  <strong>暂未上架</strong>
                </article>
              );
            }
            const owned = item.category === "character"
              ? user?.ownedCharacters?.includes(item.targetId)
              : user?.ownedDecorations?.includes(item.targetId);
            const tooExpensive = (user?.coins ?? 0) < item.finalPrice;
            const disabled = owned || !item.purchasable || tooExpensive || purchasingId === item.id;
            return (
              <article className={`shop-item ${owned ? "owned" : ""}`} key={item.id}>
                {item.category === "decoration" && getStoneDecoration(item.targetId)
                  ? <StoneDecorationPreview decoration={getStoneDecoration(item.targetId)} label={item.name} large />
                  : item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <ShoppingBag />}
                <strong>{item.name}</strong>
                <p className="shop-price">
                  {item.discountPercent > 0 && <s>{item.priceCoins}</s>}
                  <b>{item.finalPrice}</b> 金币
                </p>
                <button className="primary-action" disabled={disabled} onClick={() => buyItem(item)}>
                  {owned ? "已拥有" : purchasingId === item.id ? "购买中" : !item.purchasable ? "不可购买" : tooExpensive ? "金币不足" : "购买"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StoneDecorationPreview({ decoration, label = "", large = false }) {
  return (
    <div className={`stone-decoration-preview ${large ? "large" : ""}`} aria-label={label || decoration.name}>
      <span style={{ "--preview-stone-image": `url("${decoration.images.black}")` }} />
      <span style={{ "--preview-stone-image": `url("${decoration.images.white}")` }} />
    </div>
  );
}

function ConfirmModal({ title, message, confirmText, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop">
      <section className="confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="inline-actions confirm-actions">
          <button className="danger-action" onClick={onConfirm}>{confirmText}</button>
          <button className="secondary-action" onClick={onCancel}>取消</button>
        </div>
      </section>
    </div>
  );
}

function ResultModal({ room, user, characters, audioSettings, onClose }) {
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  const isDraw = !winnerColor;
  const winner = room.players.find((player) => player.color === winnerColor) ?? room.players[0];
  const character = findCharacter(characters, winner?.character ?? winner?.characterId);
  const currentPlayer = room.players.find((player) => player.user?.id === user?.id);
  const reward = currentPlayer ? resultRewardDelta(currentPlayer.color, winnerColor) : null;
  const signed = (value) => (value > 0 ? `+${value}` : String(value));
  const playedResultSoundRef = useRef(false);

  useEffect(() => {
    if (playedResultSoundRef.current) return;
    const sound = resolveResultSound(room, user);
    if (!sound) return;
    playedResultSoundRef.current = true;
    playEffectSound(sound, audioSettings);
  }, [room.code, room.game.winner, user?.id, audioSettings]);

  return (
    <div className="modal-backdrop">
      <section className={`result-modal ${winnerColor === COLORS.black ? "black-win" : ""} ${isDraw ? "draw-result" : ""}`}>
        {!isDraw && (
          <div className="result-winner">
            <img src={character.portrait} alt={character.name} />
            <strong>{winner?.user.username}</strong>
          </div>
        )}
        <div className="result-summary">
          <h2>对局结果</h2>
          <p>{room.game.winner?.text ?? "对局结束"}</p>
          {reward && (
            <div className="result-rewards" aria-label="本局收益">
              <span><strong>积分</strong>{signed(reward.rating)}</span>
              <span><strong>金币</strong>{signed(reward.coins)}</span>
            </div>
          )}
          <button onClick={onClose}>确认</button>
        </div>
      </section>
    </div>
  );
}

function SkillBanner({ banner, characters, audioSettings }) {
  const playedVoiceBannerRef = useRef("");
  const character = findCharacter(characters, banner.character ?? banner.characterId);
  useEffect(() => {
    if (!banner?.id || playedVoiceBannerRef.current === banner.id) return;
    const voice = resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character });
    if (voice.type !== "audio" && !voice.text) return;
    playedVoiceBannerRef.current = banner.id;
    playSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character, audioSettings });
  }, [banner, character, audioSettings]);

  return (
    <div className="skill-burst" aria-live="polite">
      <img src={character.portrait} alt={banner.characterName ?? character.name} />
      <div>
        <span>{banner.characterName ?? character.name}</span>
        <strong>{banner.skillName ?? character.skill.name}</strong>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="panel">
      <header>{icon}<h2>{title}</h2></header>
      {children}
    </section>
  );
}

function Stat({ label, value, icon = null }) {
  return <div className="stat"><span>{icon}{label}</span><strong>{value}</strong></div>;
}

function formatSkillCost(skillOrCost) {
  if (skillOrCost && typeof skillOrCost === "object") {
    const costType = skillOrCost.costType ?? "numeric";
    const costValue = String(skillOrCost.costValue ?? skillOrCost.cost ?? 0);
    return costType === "numeric" ? `${costValue || 0}子` : costValue;
  }
  return typeof skillOrCost === "number" ? `${skillOrCost}子` : skillOrCost;
}

function Toast({ text, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);
  return <div className="toast">{text}</div>;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

createRoot(document.getElementById("root")).render(<App />);
