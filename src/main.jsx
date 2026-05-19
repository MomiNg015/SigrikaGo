import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  DoorOpen,
  Eye,
  Bell,
  Flag,
  Hash,
  Info,
  LogOut,
  MessageCircle,
  Mic2,
  MonitorPlay,
  Music,
  PanelRight,
  SkipBack,
  SkipForward,
  Send,
  Settings,
  ShoppingBag,
  Shuffle,
  Sparkles,
  StepBack,
  StepForward,
  Swords,
  Trophy,
  UserRound,
  Volume2,
  RotateCcw,
  X
} from "lucide-react";
import { CHARACTERS, mergeCharacters } from "./shared/characters.js";
import { BOARD_SIZE, COLORS, GAME_PHASES, activatePassiveSkill, createGameState, gameViewForColor, passMove, playMove, randomBlast, useSkill } from "./shared/game.js";
import { derivePlayerRecordStats } from "./shared/gameRecords.js";
import { canPreviewSkillTarget, lastMarkedAction } from "./shared/boardView.js";
import { boardSoundActionAtStep, latestBoardSoundAction } from "./shared/boardAudio.js";
import { MATCH_SUCCESS_SOUND, latestSkillCharacterId, resolveBackgroundMusic, resolveResultSound, resolveSkillVoice } from "./shared/musicLibrary.js";
import { nextCountdownAnnouncement, nextTimeAnnouncement } from "./shared/timeAnnouncements.js";
import { DEFAULT_SITE_SETTINGS } from "./shared/siteSettings.js";
import { SYSTEM_VOICE_EVENTS, resolveSystemVoice } from "./shared/systemVoices.js";
import { resultRewardDelta } from "./shared/resultRewards.js";
import { BackgroundMusic, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, playBoardSound, playEffectSound, playVoiceSound, speakText } from "./audio/playback.jsx";
import AdminConsole from "./admin/AdminConsole.jsx";
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
          onClose={() => setShowHouse(false)}
          onSelectCharacter={selectCharacter}
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
          audioSettings={audioSettings}
          setAudioSettings={setAudioSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: { username, password }
      });
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-lockup">
          <img src={CHARACTERS.sigrika.portrait} alt="西格莉卡" />
          <div>
            <p>SigrikaGo</p>
            <h1>空想围棋</h1>
          </div>
        </div>
        <form onSubmit={submit} className="auth-form">
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>登录</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>注册</button>
          </div>
          <label>用户名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" type="submit">{mode === "login" ? "进入棋舍" : "创建账号"}</button>
        </form>
      </section>
    </main>
  );
}

function HomeScreen({ user, characters, siteSettings = DEFAULT_SITE_SETTINGS, onLogout, onStartMatch, onOpenHouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenSettings, onOpenAdmin }) {
  return (
    <main className="home-screen">
      <header className="topbar">
        <div>
          <p>{siteSettings.homeSubtitle}</p>
          <h1>{siteSettings.homeTitle}</h1>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" title="设置" onClick={onOpenSettings}><Settings size={20} /></button>
          <button className="icon-button" title="退出登录" onClick={onLogout}><LogOut size={20} /></button>
        </div>
      </header>
      <section className="home-grid">
        <button className="home-entry house-entry" onClick={onOpenHouse}>
          <div className="entry-copy">
            <UserRound size={30} />
            <strong>棋舍</strong>
            <span>{user.username} · {user.rank} · {user.rating}分</span>
          </div>
          <img className="entry-portrait" src={findCharacter(characters, user.selectedCharacter).portrait} alt="出战角色" />
        </button>
        <Panel title="空想对局" icon={<Swords />}>
          <button className="match-button" onClick={onStartMatch}>
            <Sparkles size={22} />
            开始匹配
          </button>
          <p className="quiet-text">13路，中国数子规则，黑贴2又3/4子。</p>
        </Panel>
        <button className="home-entry watch-entry" onClick={onOpenWatch}>
          <Eye size={30} />
          <strong>观战</strong>
          <span>输入5位房间号进入观战席</span>
        </button>
        <button className="home-entry leaderboard-entry" onClick={onOpenLeaderboard}>
          <Trophy size={30} />
          <strong>排行榜</strong>
          <span>积分、胜负与常用角色</span>
        </button>
        <button className="home-entry shop-entry" onClick={onOpenShop}>
          <ShoppingBag size={30} />
          <strong>商城</strong>
          <span>角色、物品、装饰即将开放</span>
        </button>
        {user.role === "admin" && (
          <button className="home-entry admin-entry" onClick={onOpenAdmin}>
            <Settings size={30} />
            <strong>后台管理</strong>
            <span>用户、角色与系统配置</span>
          </button>
        )}
      </section>
    </main>
  );
}

function RoomScreen({ room, user, characters, replayStep, setReplayStep, pendingSkill, setPendingSkill, audioSettings, onOpenSettings, onBack, onGameAction, onCountingRequest, onCountingRespond, onDrawRequest, onDrawRespond, onScoringAction, onChat }) {
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
  const replayStepSoundRef = useRef(replayStep);
  const voiceRef = useRef({});
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
        character: activePlayer.character,
        params: announcement.params,
        fallbackText: announcement.text,
        audioSettings
      });
    }
    if (timer.main <= 0 && timer.periodRemaining <= 10 && timer.periodRemaining > 0) {
      const countdownKey = `${activePlayer.color}-${timer.periods}-${timer.periodRemaining}`;
      if (!voiceRef.current[countdownKey]) {
        voiceRef.current[countdownKey] = true;
        const countdownAnnouncement = nextCountdownAnnouncement({ seconds: timer.periodRemaining });
        if (countdownAnnouncement?.type === "voice") {
          playSystemVoice(countdownAnnouncement.event, {
            character: activePlayer.character,
            params: countdownAnnouncement.params,
            fallbackText: countdownAnnouncement.text,
            audioSettings
          });
        }
      }
    }
    voiceRef.current[mainKey] = timer.main;
    voiceRef.current[periodKey] = timer.periods;
  }, [activePlayer, isReplay, audioSettings]);

  useEffect(() => {
    if (isReplay) return;
    const gameStartMessage = displayRoom.chat.findLast?.((message) => message.kind === "game-start");
    if (!gameStartMessage || systemVoiceRef.current.gameStart === gameStartMessage.id) return;
    systemVoiceRef.current.gameStart = gameStartMessage.id;
    playSystemVoice(SYSTEM_VOICE_EVENTS.gameStart, {
      character: me?.character,
      audioSettings
    });
  }, [displayRoom.chat, isReplay, me?.character, audioSettings]);

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
          {!isReplay && (
            <div className={`status-slot side-status ${scoring || drawRequest ? "" : "empty-status"}`}>
              <StatusPanel
                room={displayRoom}
                user={user}
                scoring={scoring}
                drawRequest={drawRequest}
                onRespond={onCountingRespond}
                onDrawRespond={onDrawRespond}
                onConfirm={() => onScoringAction({ type: "confirm-dead" })}
                onReset={() => onScoringAction({ type: "reset-dead" })}
                onAccept={() => onScoringAction({ type: "accept-result" })}
                onReject={() => onScoringAction({ type: "reject-result" })}
              />
            </div>
          )}
        </div>
        <div className="board-column">
          <div className="board-stage">
            <Board
              game={displayRoom.game}
              showCoords={showCoords}
              showMoves={showMoves}
              pendingSkill={pendingSkill}
              previewPlayer={role === "player" ? me : null}
              onPoint={handlePoint}
              onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
              onNeutral={(id) => onScoringAction({ type: "mark-neutral", pointId: id })}
            />
          </div>
          <div className="status-slot">
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
            replayStep={boardStep ?? liveStep}
            replayMax={liveStep}
            onReplayStep={isReplay ? setReplayStep : isLiveSpectator ? setSpectatorStep : null}
            showTestTools={SHOW_TEST_TOOLS}
            onTestRandomLayout={() => onGameAction({ type: "test-random-layout" })}
            onTestRestoreSkill={() => onGameAction({ type: "test-restore-skill" })}
            onPass={() => onGameAction({ type: "pass" })}
            onCountingRequest={onCountingRequest}
            onDrawRequest={onDrawRequest}
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

function Board({ game, showCoords, showMoves, pendingSkill, previewPlayer, onPoint, onScoringPoint, onNeutral }) {
  const markedAction = lastMarkedAction(game.history);
  const moveNumbers = new Map(game.history.filter((entry) => entry.type === "move").map((entry) => [entry.id, entry.moveNumber]));
  const labels = Array.from({ length: BOARD_SIZE }, (_, index) => coordLetter(index));
  const rows = Array.from({ length: BOARD_SIZE }, (_, index) => BOARD_SIZE - index);
  const lines = buildBoardLines(game.points);
  const showScoringMarks = ["marking-dead", "result-review", "finished"].includes(game.phase);
  const territoryOwner = new Map([
    ...(showScoringMarks ? game.scoring?.territory?.black ?? [] : []).map((id) => [id, COLORS.black]),
    ...(showScoringMarks ? game.scoring?.territory?.white ?? [] : []).map((id) => [id, COLORS.white])
  ]);
  const deadStoneOwners = showScoringMarks ? game.scoring?.deadStoneOwners ?? {} : {};
  return (
    <div className={`board-wrap ${pendingSkill ? "targeting" : ""}`}>
      {showCoords && <div className="coord-row coord-top">{labels.map((label) => <span key={label}>{label}</span>)}</div>}
      {showCoords && <div className="coord-col coord-left">{rows.map((label) => <span key={label}>{label}</span>)}</div>}
      <div className="board" style={{ "--size": BOARD_SIZE }}>
        <svg className="board-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {lines.map((line) => (
            <line
              key={line.key}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </svg>
        {game.points.map((point) => {
          const emptyTerritoryOwner = !point.stone ? territoryOwner.get(point.id) : null;
          const deadOwner = point.stone ? deadStoneOwners[point.id] : null;
          const hiddenClass = point.hiddenHand
            ? point.hiddenHand.exposed ? "hidden-hand exposed-hidden-hand" : "hidden-hand"
            : "";
          const skillEffectClass = point.skillEffect ?? "";
          const previewClass = canPreviewPoint(game, previewPlayer, point, pendingSkill, Boolean(onScoringPoint)) ? "previewable" : "";
          return (
          <button
            key={point.id}
            className={`point ${point.valid ? "" : "erased"} ${point.stone ?? ""} ${hiddenClass} ${skillEffectClass} ${previewClass} ${isStarPoint(point.x, point.y) ? "star" : ""}`}
            style={{ gridColumn: point.x + 1, gridRow: point.y + 1 }}
            onPointerDown={(event) => {
              if (!onScoringPoint) return;
              event.preventDefault();
              event.stopPropagation();
              onScoringPoint(point);
            }}
            onClick={() => {
              if (!onScoringPoint) onPoint(point);
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              if (game.phase === "marking-dead") onNeutral(point.id);
            }}
            title={coordLabel(point.x, point.y)}
          >
            {point.stone && <span className="stone">{markedAction?.id === point.id && <i />}{showMoves && moveNumbers.has(point.id) && <b>{moveNumbers.get(point.id)}</b>}</span>}
            {!point.valid && <span className="void" />}
            {emptyTerritoryOwner && <span className={`territory-mark ${emptyTerritoryOwner}`} aria-label={`${emptyTerritoryOwner} territory`} />}
            {deadOwner && <span className={`dead-mark ${deadOwner}`} aria-label={`${deadOwner} dead-stone mark`} />}
            {showScoringMarks && game.scoring?.neutralPoints?.includes(point.id) && <span className="neutral-mark" aria-label="neutral point" />}
          </button>
          );
        })}
      </div>
      {showCoords && <div className="coord-col coord-right">{rows.map((label) => <span key={label}>{label}</span>)}</div>}
      {showCoords && <div className="coord-row coord-bottom">{labels.map((label) => <span key={label}>{label}</span>)}</div>}
    </div>
  );
}

function PlayerInfo({ player, game, characters, align, viewColor = COLORS.black, canSwitchView = false, onViewColor, isWinner = false, isActiveTurn = false, isDrawResult = false, isSkillTargeting = false }) {
  if (!player) return <aside className="player-info empty" />;
  const character = findCharacter(characters, player.character ?? player.characterId);
  const skillUses = game.skillUses[player.color] ?? 0;
  const skillCost = game.skillCosts?.[player.color] ?? 0;
  return (
    <aside className={`player-info ${align} ${isWinner ? "winner" : ""} ${isActiveTurn ? "active-turn" : ""} ${isDrawResult ? "draw-result" : ""}`}>
      <div className="portrait-wrap">
        {canSwitchView && (
          <button
            className={`viewpoint-button ${viewColor === player.color ? "active" : ""}`}
            type="button"
            title={`切换到${player.color === COLORS.black ? "黑方" : "白方"}视角`}
            onClick={() => onViewColor?.(player.color)}
          >
            <Eye size={18} />
          </button>
        )}
        <img src={character.portrait} alt={character.name} />
      </div>
      <div className="player-meta">
        <button className="name-button">{player.user.username}</button>
        <span>{player.user.rank} · {player.user.rating}</span>
        <span className={`color-badge ${player.color}`} title={player.color === COLORS.black ? "执黑" : "执白"} />
      </div>
      <TimeBar time={player.time} />
      <div className="captures">
        <span><strong>提子</strong>{player.captures}</span>
        <span><strong>代价</strong>{skillCost}</span>
      </div>
      <div className={`skill-chip ${skillUses <= 0 ? "spent" : ""} ${isSkillTargeting ? "targeting" : ""}`} title={character.skill.description}>
        <Sparkles size={16} />
        {character.skill.name} · {skillUses}
      </div>
    </aside>
  );
}

function TimeBar({ time }) {
  const inMain = time.main > 0;
  const isFinalByoYomi = !inMain && time.periods <= 1;
  const progress = inMain
    ? Math.max(0, Math.min(100, (time.main / (5 * 60)) * 100))
    : Math.max(0, Math.min(100, ((time.periodRemaining ?? time.byoYomi) / time.byoYomi) * 100));
  return (
    <div className={`timer ${inMain ? "main-time" : isFinalByoYomi ? "final-byo-yomi" : "byo-yomi"}`}>
      <div className="timer-text">{formatClock(time.main)} + {time.periodRemaining ?? time.byoYomi}s × {time.periods}</div>
      <div className="timer-track"><span style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

function ActionBar({ role, phase, me, isMyTurn, pendingSkill, setPendingSkill, skillLocked = false, skillUses, replayStep = 0, replayMax = 0, showTestTools = false, onReplayStep, onTestRandomLayout, onTestRestoreSkill, onPass, onCountingRequest, onDrawRequest, onResign, onBack }) {
  if (role === "spectator") {
    return (
      <nav className="action-bar">
        <button title="回到第0手" onClick={() => onReplayStep?.(0)} disabled={!onReplayStep || replayStep <= 0}>
          <SkipBack size={20} />
        </button>
        <button title="上一手" onClick={() => onReplayStep?.(Math.max(0, replayStep - 1))} disabled={!onReplayStep || replayStep <= 0}>
          <StepBack size={20} />
        </button>
        <span className="replay-step-indicator"><MonitorPlay size={16} />{replayStep}/{replayMax}</span>
        <button title="下一手" onClick={() => onReplayStep?.(Math.min(replayMax, replayStep + 1))} disabled={!onReplayStep || replayStep >= replayMax}>
          <StepForward size={20} />
        </button>
        <button title="跳到最新一手" onClick={() => onReplayStep?.(replayMax)} disabled={!onReplayStep || replayStep >= replayMax}>
          <SkipForward size={20} />
        </button>
        <button className="exit-action" onClick={onBack}><DoorOpen size={18} />退出房间</button>
      </nav>
    );
  }
  return (
    <nav className="action-bar">
      <button onClick={onPass} disabled={phase !== "playing" || skillLocked}>弃一手</button>
      <button onClick={onCountingRequest} disabled={phase !== "playing" || skillLocked}>申请数子</button>
      <button
        className={`skill-action ${pendingSkill ? "active" : ""} ${skillUses <= 0 ? "spent" : ""}`}
        onClick={() => setPendingSkill(!pendingSkill)}
        disabled={!me || phase !== "playing" || !isMyTurn || skillLocked || skillUses <= 0}
      >
        <Sparkles size={20} />技能 · {skillUses}
      </button>
      <button onClick={onDrawRequest} disabled={phase !== "playing" || skillLocked}>申请和棋</button>
      <button onClick={onResign} disabled={phase === "finished" || skillLocked}><Flag size={18} />认输</button>
      {showTestTools && (
        <TestTools
          disabled={phase !== "playing" || skillLocked || !me}
          onRandomLayout={onTestRandomLayout}
          onRestoreSkill={onTestRestoreSkill}
        />
      )}
      <button className="exit-action" onClick={onBack}><DoorOpen size={18} />退出房间</button>
    </nav>
  );
}

function TestTools({ disabled, onRandomLayout, onRestoreSkill }) {
  return (
    <span className="test-tools" aria-label="测试工具">
      <button title="随机布局" onClick={onRandomLayout} disabled={disabled}>
        <Shuffle size={18} />随机布局
      </button>
      <button title="恢复技能" onClick={onRestoreSkill} disabled={disabled}>
        <RotateCcw size={18} />恢复技能
      </button>
    </span>
  );
}

function ReplayBar({ step, max, onStep }) {
  return (
    <section className="replay-bar">
      <button onClick={() => onStep(0)} disabled={step <= 0}>开局</button>
      <button onClick={() => onStep(Math.max(0, step - 1))} disabled={step <= 0}>上一步</button>
      <input
        type="range"
        min="0"
        max={max}
        value={step}
        onChange={(event) => onStep(Number(event.target.value))}
      />
      <button onClick={() => onStep(Math.min(max, step + 1))} disabled={step >= max}>下一步</button>
      <button onClick={() => onStep(max)} disabled={step >= max}>终局</button>
      <span>{step}/{max}手</span>
    </section>
  );
}

function StatusPanel({ room, user, scoring, drawRequest, onRespond, onDrawRespond, onConfirm, onReset, onAccept, onReject }) {
  if (room.game.phase === "draw-requested" && drawRequest) {
    const isRequester = drawRequest.requestedBy === user.id;
    return (
      <section className="counting-panel">
        <strong>和棋申请</strong>
        <p>{isRequester ? "等待对方确认和棋。" : "对方向你申请和棋，是否同意"}</p>
        <div className="progress draw-progress"><span /></div>
        {!isRequester && (
          <div className="inline-actions">
            <button onClick={() => onDrawRespond(true)}>同意和棋</button>
            <button onClick={() => onDrawRespond(false)}>继续对局</button>
          </div>
        )}
      </section>
    );
  }
  if (!scoring) return null;
  const isRequester = scoring.requestedBy === user.id;
  const confirmed = scoring.confirmedBy?.includes(user.id);
  const resultAccepted = scoring.resultAcceptedBy?.includes(user.id);
  if (room.game.phase === "counting-requested") {
    return (
      <section className="counting-panel">
        <strong>数子申请</strong>
        <p>{isRequester ? "等待对方确认。" : "对方申请数子，30秒内确认。"}</p>
        <div className="progress"><span /></div>
        {!isRequester && (
          <div className="inline-actions">
            <button onClick={() => onRespond(true)}>同意数子</button>
            <button onClick={() => onRespond(false)}>继续对局</button>
          </div>
        )}
      </section>
    );
  }
  if (room.game.phase === "marking-dead") {
    return (
      <section className="counting-panel">
        <strong>确认死子</strong>
        <p>已自动标出确定地盘。点击疑似死子会按所属地盘扩展标记；点已标记棋子可取消该块。右键空点标记非目。</p>
        <div className="inline-actions">
          <button onClick={onConfirm} disabled={confirmed}>{confirmed ? "已确认" : "确认死子"}</button>
          <button className="secondary-action" onClick={onReset}>重新确认死子</button>
        </div>
      </section>
    );
  }  if (room.game.phase === "result-review") {
    return (
      <section className="counting-panel">
        <strong>{scoring.result?.text}</strong>
        <p>黑 {scoring.result?.black} 子，白 {scoring.result?.white} 子，黑贴 2又3/4 子。</p>
        <p>30秒内双方同意则结束，否则继续对局。</p>
        <div className="progress"><span /></div>
        <div className="inline-actions">
          <button onClick={onAccept} disabled={resultAccepted}>{resultAccepted ? "已同意" : "同意结果"}</button>
          <button onClick={onReject}>继续对局</button>
        </div>
      </section>
    );
  }  return null;
}

function ChatBox({ room, onChat, readonly = false }) {
  const [text, setText] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [room.chat.length]);

  return (
    <section className="chat-box">
      <header><MessageCircle size={18} />对局聊天</header>
      <div className="chat-log" ref={logRef}>
        {room.chat.map((message) => (
          <p key={message.id} className={`${message.type} ${message.kind ?? ""}`}>
            <span>[{message.moveNumber}手 {formatMessageTime(message.createdAt)}]</span>
            {message.type === "chat" && <strong>{message.username}：</strong>}
            {message.text}
          </p>
        ))}
      </div>
      {!readonly && (
        <form onSubmit={(event) => {
          event.preventDefault();
          onChat(text);
          setText("");
        }}>
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="输入聊天内容" />
          <button><Send size={18} /></button>
        </form>
      )}
    </section>
  );
}

function HouseModal({ user, records, characterListView, onClose, onSelectCharacter, onOpenReplay }) {
  const [detailCharacter, setDetailCharacter] = useState(null);
  const [showReplays, setShowReplays] = useState(false);
  const stats = derivePlayerRecordStats(user, records);
  const owned = new Set(user.ownedCharacters ?? []);
  const detailOwned = detailCharacter ? owned.has(detailCharacter.id) : false;
  const emptySlots = Array.from({ length: Math.max(0, 10 - characterListView.length) }, (_, index) => index);

  return (
    <div className="modal-backdrop">
      <section className="house-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>棋舍</h2>
        <div className="profile-grid">
          <Stat label="战绩" value={`${stats.totalGames}局 · ${stats.wins}胜${stats.losses}负${stats.draws}和`} />
          <Stat label="积分" value={stats.rating} />
          <Stat label="段位" value={user.rank} />
          <Stat label="金币" value={user.coins} />
        </div>
        <div className="character-list">
          {characterListView.map((character) => (
            <div
              className={`character-card portrait-card ${user.selectedCharacter === character.id ? "selected" : ""} ${owned.has(character.id) ? "" : "unowned"}`}
              key={character.id}
              onClick={() => setDetailCharacter(character)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") setDetailCharacter(character);
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
              <strong>未获得角色</strong>
            </div>
          ))}
        </div>
        <button className="replay-open-button" onClick={() => setShowReplays(true)}>
          <MonitorPlay size={18} />对局回放
        </button>
        <section className="owned-decoration-section">
          <h3>已拥有装饰</h3>
          <div className="owned-decoration-list">
            {(user.ownedDecorations ?? []).length === 0 && <p className="quiet-text">暂无装饰。</p>}
            {(user.ownedDecorations ?? []).map((decoration) => (
              <span className="owned-decoration-chip" key={decoration}>{decoration}</span>
            ))}
          </div>
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

function WatchModal({ code, setCode, onJoin, onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="small-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>观战</h2>
        <WatchPad code={code} setCode={setCode} onJoin={onJoin} />
      </section>
    </div>
  );
}

function LeaderboardModal({ token, characters, onClose }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api("/api/leaderboard", { token })
      .then((data) => {
        if (alive) setPlayers(data.players ?? []);
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
  }, [token]);

  return (
    <div className="modal-backdrop">
      <section className="leaderboard-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="leaderboard-header">
          <Trophy size={26} />
          <div>
            <h2>排行榜</h2>
            <p className="quiet-text">至少完成一盘对局的注册用户</p>
          </div>
        </header>
        {loading && <p className="quiet-text">加载中...</p>}
        {error && <p className="form-error admin-action-error">{error}</p>}
        {!loading && !error && players.length === 0 && <p className="quiet-text">暂无上榜用户。</p>}
        {!loading && !error && players.length > 0 && (
          <div className="leaderboard-list">
            <div className="leaderboard-heading">
              <span>排名</span>
              <span>常用角色</span>
              <span>用户名</span>
              <span>积分</span>
              <span>总对局数</span>
              <span>胜局数</span>
              <span>负局数</span>
            </div>
            {players.map((player, index) => {
              const character = findCharacter(characters, player.commonCharacter);
              return (
                <article className="leaderboard-row" key={player.id}>
                  <strong className="leaderboard-rank">#{index + 1}</strong>
                  <img src={character.portrait} alt={character.name} />
                  <div className="leaderboard-player">
                    <strong>{player.username}</strong>
                    <span>{character.name}</span>
                  </div>
                  <b>{player.rating}</b>
                  <span>{player.totalGames}</span>
                  <span>{player.wins}</span>
                  <span>{player.losses}</span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function WatchPad({ code, setCode, onJoin }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  return (
    <div className="watch-pad">
      <div className="room-code">{code.padEnd(5, "·")}</div>
      <div className="keypad">
        {keys.map((key) => (
          <button key={key} onClick={() => setCode((code + key).slice(0, 5))}>{key}</button>
        ))}
        <button onClick={() => setCode(code.slice(0, -1))}>退格</button>
      </div>
      <button className="secondary-action" onClick={onJoin} disabled={code.length !== 5}>进入观战</button>
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
  const categories = [
    ["character", "角色"],
    ["decoration", "装饰"]
  ];

  return (
    <div className="modal-backdrop">
      <section className="shop-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>商城</h2>
        <p className="shop-wallet">金币 {user?.coins ?? 0}</p>
        <div className="shop-tabs" role="tablist">
          {categories.map(([key, label]) => (
            <button key={key} className={activeCategory === key ? "active" : ""} onClick={() => setActiveCategory(key)}>
              {label}
            </button>
          ))}
        </div>
        {message && <p className="admin-success">{message}</p>}
        {error && <p className="form-error admin-action-error">{error}</p>}
        {loading && <p className="quiet-text">加载中...</p>}
        <div className="shop-grid">
          {!loading && visibleItems.map((item) => {
            const owned = item.category === "character"
              ? user?.ownedCharacters?.includes(item.targetId)
              : user?.ownedDecorations?.includes(item.targetId);
            const tooExpensive = (user?.coins ?? 0) < item.finalPrice;
            const disabled = owned || !item.purchasable || tooExpensive || purchasingId === item.id;
            return (
              <article className="shop-item" key={item.id}>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <ShoppingBag />}
                <strong>{item.name}</strong>
                <span>{item.description || shopCategoryLabel(item.category)}</span>
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
          {!loading && visibleItems.length === 0 && (
            <div className="shop-empty">
              <ShoppingBag />
              <span>暂无商品</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SettingsModal({ audioSettings, setAudioSettings, onClose }) {
  const [tab, setTab] = useState("audio");
  const audioItems = [
    { key: "master", label: "主音量", icon: <Volume2 size={18} /> },
    { key: "bgm", label: "背景音乐", icon: <Music size={18} /> },
    { key: "sfx", label: "提示声", icon: <Bell size={18} /> },
    { key: "voice", label: "语音", icon: <Mic2 size={18} /> }
  ];
  return (
    <div className="modal-backdrop">
      <section className="settings-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>设置</h2>
        <div className="settings-tabs" role="tablist">
          <button className={tab === "audio" ? "active" : ""} onClick={() => setTab("audio")}><Volume2 size={16} />音频</button>
          <button className={tab === "about" ? "active" : ""} onClick={() => setTab("about")}><Info size={16} />关于</button>
        </div>
        {tab === "audio" && (
          <div className="settings-panel">
            {audioItems.map((item) => (
              <label className="volume-row" key={item.key}>
                <span>{item.icon}{item.label}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings[item.key]}
                  onChange={(event) => setAudioSettings((settings) => ({
                    ...settings,
                    [item.key]: Number(event.target.value)
                  }))}
                />
                <strong>{audioSettings[item.key]}</strong>
              </label>
            ))}
          </div>
        )}
        {tab === "about" && <div className="settings-panel about-panel" />}
      </section>
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
    const voiceSrc = resolveSkillVoice(banner);
    if (!voiceSrc) return;
    playedVoiceBannerRef.current = banner.id;
    playVoiceSound(voiceSrc, audioSettings);
  }, [banner, audioSettings]);

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

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function formatSkillCost(skillOrCost) {
  if (skillOrCost && typeof skillOrCost === "object") {
    const costType = skillOrCost.costType ?? "numeric";
    const costValue = String(skillOrCost.costValue ?? skillOrCost.cost ?? 0);
    return costType === "numeric" ? `${costValue || 0}子` : costValue;
  }
  return typeof skillOrCost === "number" ? `${skillOrCost}子` : skillOrCost;
}

function canPreviewSkill(game, player, point) {
  return canPreviewSkillTarget({ game, player, point, fallbackCharacters: CHARACTERS });
}

function canPreviewPoint(game, player, point, pendingSkill, isScoringMode) {
  if (isScoringMode) return false;
  if (!player || game.phase !== "playing" || game.turn !== player.color) return false;
  if (pendingSkill) return canPreviewSkill(game, player, point);
  return Boolean(point?.valid && !point.stone);
}

function findCharacter(characters, characterOrId) {
  const characterId = typeof characterOrId === "string" ? characterOrId : characterOrId?.id;
  const fallback = CHARACTERS[characterId] ?? CHARACTERS.sigrika;
  if (characterOrId && typeof characterOrId === "object") {
    return {
      ...fallback,
      ...characterOrId,
      acquisitionMethod: characterOrId.acquisitionMethod ?? fallback.acquisitionMethod ?? "",
      skill: {
        ...fallback.skill,
        ...(characterOrId.skill ?? {})
      }
    };
  }
  return characters[characterId] ?? fallback;
}

function Toast({ text, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);
  return <div className="toast">{text}</div>;
}

function playSystemVoice(event, { character, params, fallbackText, audioSettings }) {
  const voice = resolveSystemVoice(event, { character, params });
  if (voice.type === "audio" && voice.src) {
    playVoiceSound(voice.src, audioSettings);
    return;
  }
  const text = voice.text || fallbackText;
  if (text) speakText(text, audioSettings);
}

function coordLabel(x, y) {
  return `${coordLetter(x)}${BOARD_SIZE - y}`;
}

function coordLetter(x) {
  return "ABCDEFGHJKLMN"[x];
}

function buildBoardLines(points) {
  const valid = new Set(points.filter((point) => point.valid).map((point) => point.id));
  const lines = [];
  const center = (value) => ((value + 0.5) / BOARD_SIZE) * 100;

  for (const point of points) {
    if (!point.valid) continue;
    const right = `${point.x + 1},${point.y}`;
    if (point.x < BOARD_SIZE - 1 && valid.has(right)) {
      lines.push({
        key: `${point.id}-h`,
        x1: center(point.x),
        y1: center(point.y),
        x2: center(point.x + 1),
        y2: center(point.y)
      });
    }
    const down = `${point.x},${point.y + 1}`;
    if (point.y < BOARD_SIZE - 1 && valid.has(down)) {
      lines.push({
        key: `${point.id}-v`,
        x1: center(point.x),
        y1: center(point.y),
        x2: center(point.x),
        y2: center(point.y + 1)
      });
    }
  }

  return lines;
}

function replayRoomAt(room, step, viewColor = COLORS.black) {
  const game = replayGameAt(room, step);
  const replayPlayers = room.players.map((player) => ({
    ...player,
    captures: 0,
    time: player.time ?? { main: 0, byoYomi: 30, periodRemaining: 30, periods: 0 }
  }));

  for (const player of replayPlayers) {
    player.captures = game.captures[player.color] ?? 0;
  }

  return {
    ...room,
    role: "spectator",
    players: replayPlayers,
    game: gameViewForColor(game, viewColor),
    chat: room.chat.filter((message) => message.moveNumber <= game.moveNumber)
  };
}

function replayGameAt(room, step) {
  let game = createGameState(room.game.players);
  for (const entry of room.game.history.slice(0, step)) {
    let result = null;
    if (entry.type === "move") result = playMove(game, entry.color, entry.id, {
      colorIllusion: Object.hasOwn(entry, "colorIllusion") ? entry.colorIllusion : null
    });
    if (entry.type === "pass") result = passMove(game, entry.color);
    if (entry.type === "skill") {
      const player = room.players.find((candidate) => candidate.color === entry.color);
      const skill = player?.character?.skill ?? player?.characterId;
      if (entry.effectType === "color-illusion-passive") {
        result = activatePassiveSkill(game, entry.color, skill);
      } else if (entry.effectType === "random-blast") {
        result = randomBlast(game, entry.color, {
          skill,
          skillName: entry.skill,
          consumesTurn: false,
          centerId: entry.id
        });
      } else {
        result = useSkill(game, entry.color, skill, entry.id);
      }
    }
    if (result?.ok) game = result.state;
  }
  return game;
}

function isStarPoint(x, y) {
  return ((x === 3 || x === 9) && (y === 3 || y === 9)) || (x === 6 && y === 6);
}

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
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

function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

createRoot(document.getElementById("root")).render(<App />);
