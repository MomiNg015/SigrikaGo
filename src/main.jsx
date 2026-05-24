import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  Hash,
  MessageSquareText,
  PanelRight,
  Settings,
  Sparkles,
  X
} from "lucide-react";
import { CHARACTERS, mergeCharacters } from "./shared/characters.js";
import { COLORS, GAME_PHASES, gameViewForColor } from "./shared/game.js";
import { BOARD_SOUND_TYPES, boardSoundActionAtStep, latestBoardSoundAction } from "./shared/boardAudio.js";
import { latestSkillCharacterId, resolveBackgroundMusic } from "./shared/musicLibrary.js";
import { nextCountdownAnnouncement, nextTimeAnnouncement } from "./shared/timeAnnouncements.js";
import { DEFAULT_SITE_SETTINGS } from "./shared/siteSettings.js";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "./shared/systemVoices.js";
import { findCharacter } from "./shared/characterDisplay.js";
import { BackgroundMusic, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, playBoardSound, playDoorbellSound, preloadVoiceSound } from "./audio/playback.jsx";
import { playSystemVoice } from "./audio/systemVoicePlayback.js";
import AdminConsole from "./admin/AdminConsole.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import HomeScreen from "./home/HomeScreen.jsx";
import { ConfirmModal, DuelRequestBanner, Toast } from "./modals/FeedbackModals.jsx";
import FriendsModal from "./modals/FriendsModal.jsx";
import { MatchModal, MatchSuccessModal, OpeningModal, ResultModal } from "./modals/GameLifecycleModals.jsx";
import HouseModal from "./modals/HouseModal.jsx";
import LeaderboardModal from "./modals/LeaderboardModal.jsx";
import MessageBoardModal from "./modals/MessageBoardModal.jsx";
import ShopModal from "./modals/ShopModal.jsx";
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
  const [showFriends, setShowFriends] = useState(false);
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
  const [incomingDuel, setIncomingDuel] = useState(null);
  const matchSuccessRef = useRef(matchSuccess);
  const audioSettingsRef = useRef(audioSettings);
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
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

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
      closeAllOverlays();
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
      setReplayStep(null);
      setPendingSkill(false);
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
    nextSocket.on("duel:incoming", (request) => {
      setIncomingDuel(request);
      playDoorbellSound(audioSettingsRef.current);
    });
    nextSocket.on("duel:closed", ({ requestId }) => {
      setIncomingDuel((current) => current?.requestId === requestId ? null : current);
    });
    nextSocket.on("duel:rejected", ({ username }) => {
      setToast(`${username}拒绝了你的对局申请`);
    });
    nextSocket.on("duel:unavailable", ({ reason }) => {
      setToast(reason === "playing" ? "对方正在对局中。" : "对方不在线。");
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
    closeAllOverlays();
    setRoom(snapshot);
    setReplayStep(snapshot.game.history.length);
    setPendingSkill(false);
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

  function closeAllOverlays() {
    setShowShop(false);
    setShowHouse(false);
    setShowLeaderboard(false);
    setShowWatch(false);
    setShowFriends(false);
    setShowSettings(false);
    setShowMessageBoard(false);
  }

  return (
    <div className="app-shell">
      <BackgroundMusic track={backgroundMusic} audioSettings={audioSettings} />
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
      {incomingDuel && (
        <DuelRequestBanner
          request={incomingDuel}
          onAccept={() => {
            socket?.emit("duel:respond", { requestId: incomingDuel.requestId, accepted: true });
            setIncomingDuel(null);
          }}
          onReject={() => {
            socket?.emit("duel:respond", { requestId: incomingDuel.requestId, accepted: false });
            setIncomingDuel(null);
          }}
          onTimeout={() => {
            socket?.emit("duel:respond", { requestId: incomingDuel.requestId, accepted: false });
            setIncomingDuel(null);
          }}
        />
      )}
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
          onOpenFriends={() => setShowFriends(true)}
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
          onOpenFriends={() => setShowFriends(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenMessageBoard={() => setShowMessageBoard(true)}
          onOpenAdmin={() => setView("admin")}
        />
      )}
      {view === "room" && room && user && (
        <RoomScreen
          room={room}
          user={user}
          token={token}
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
          onOpenReplay={openReplay}
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
      {showFriends && (
        <FriendsModal
          token={token}
          socket={socket}
          characters={characters}
          onClose={() => setShowFriends(false)}
          onOpenReplay={openReplay}
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

function RoomScreen({ room, user, token, characters, replayStep, setReplayStep, pendingSkill, setPendingSkill, audioSettings, onOpenSettings, onOpenMessageBoard, onBack, onGameAction, onCountingRequest, onCountingRespond, onDrawRequest, onDrawRespond, onScoringAction, onChat, onOpenReplay }) {
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
  const roomGameInfo = blackPlayer && whitePlayer
    ? {
        black: `${blackPlayer.user.username} ${blackPlayer.user.rank}`,
        white: `${whitePlayer.user.username} ${whitePlayer.user.rank}`,
        moves: `${displayRoom.game.moveNumber}手`
      }
    : null;
  const me = role === "spectator" ? blackPlayer : displayRoom.players.find((p) => p.user.id === user.id);
  const opponent = role === "spectator" ? whitePlayer : displayRoom.players.find((p) => p.user.id !== user.id) ?? displayRoom.players[1];
  const activePlayer = displayRoom.players.find((p) => p.color === displayRoom.game.turn);
  const scoring = displayRoom.game.scoring;
  const drawRequest = displayRoom.game.drawRequest;
  const hasAnyStones = displayRoom.game.points.some((point) => Boolean(point.stone));
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
          <p className="room-title-line">
            <span className="room-code-label">房间号 {room.code}</span>
            {roomGameInfo && (
              <>
                <span className="room-info-tag black-side">黑方：{roomGameInfo.black}</span>
                <span className="room-info-tag white-side">白方：{roomGameInfo.white}</span>
                <span className="room-info-tag move-count">{roomGameInfo.moves}</span>
              </>
            )}
          </p>
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
          {!isReplay && <RoomPeopleList room={displayRoom} user={user} characters={characters} token={token} onOpenReplay={onOpenReplay} />}
          {!isReplay && !isLiveSpectator && <OperationHint room={displayRoom} user={user} scoring={scoring} drawRequest={drawRequest} />}
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
            hasAnyStones={hasAnyStones}
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
