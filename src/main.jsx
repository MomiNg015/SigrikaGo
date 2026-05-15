import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  DoorOpen,
  Eye,
  Flag,
  Hash,
  LogOut,
  MessageCircle,
  MonitorPlay,
  PanelRight,
  Pause,
  Play,
  Send,
  ShoppingBag,
  Sparkles,
  Swords,
  UserRound,
  X
} from "lucide-react";
import { CHARACTERS, characterList } from "./shared/characters.js";
import { BOARD_SIZE, COLORS, createGameState, passMove, playMove, useSkill } from "./shared/game.js";
import "./styles.css";

const API_BASE = "http://localhost:3001";

function App() {
  const [token, setToken] = useState(localStorage.getItem("sigrika-token") ?? "");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState("");
  const [matchStart, setMatchStart] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showHouse, setShowHouse] = useState(false);
  const [showWatch, setShowWatch] = useState(false);
  const [watchCode, setWatchCode] = useState("");
  const [pendingSkill, setPendingSkill] = useState(false);
  const [replayRecords, setReplayRecords] = useState([]);
  const [replayStep, setReplayStep] = useState(null);
  const [dismissedResultRoom, setDismissedResultRoom] = useState("");

  useEffect(() => {
    if (!token) return;
    api("/api/me", { token })
      .then((data) => {
        setUser(data.user);
        setView("home");
      })
      .catch(() => {
        localStorage.removeItem("sigrika-token");
        setToken("");
      });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    const nextSocket = io(API_BASE, { auth: { token } });
    nextSocket.on("match:waiting", ({ startedAt }) => setMatchStart(startedAt));
    nextSocket.on("match:found", (roomView) => {
      setRoom(roomView);
      setReplayStep(null);
      setMatchStart(null);
      setView("room");
    });
    nextSocket.on("room:update", (roomView) => {
      setRoom(roomView);
      setView("room");
    });
    nextSocket.on("room:closed", () => {
      setRoom(null);
      setView("home");
      setToast("房间已关闭。");
    });
    nextSocket.on("error:toast", setToast);
    setSocket(nextSocket);
    return () => nextSocket.close();
  }, [token, user]);

  useEffect(() => {
    if (!showHouse || !token) return;
    api("/api/replays", { token })
      .then((data) => setReplayRecords(data.records))
      .catch((error) => setToast(error.message));
  }, [showHouse, token]);

  function handleAuth(nextToken, nextUser) {
    localStorage.setItem("sigrika-token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setView("home");
  }

  function logout() {
    localStorage.removeItem("sigrika-token");
    socket?.close();
    setToken("");
    setUser(null);
    setRoom(null);
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

  async function openReplay(recordId) {
    const data = await api(`/api/replays/${recordId}`, { token });
    const snapshot = data.record.snapshot;
    setRoom(snapshot);
    setReplayStep(snapshot.game.history.length);
    setPendingSkill(false);
    setShowHouse(false);
    setView("room");
  }

  return (
    <div className="app-shell">
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
      {view === "login" && <AuthScreen onAuth={handleAuth} />}
      {view === "home" && user && (
        <HomeScreen
          user={user}
          onLogout={logout}
          onSelectCharacter={selectCharacter}
          onStartMatch={startMatch}
          onOpenHouse={() => setShowHouse(true)}
          onOpenWatch={() => setShowWatch(true)}
          onOpenShop={() => setShowShop(true)}
        />
      )}
      {view === "room" && room && user && (
        <RoomScreen
          room={room}
          user={user}
          replayStep={replayStep}
          setReplayStep={setReplayStep}
          pendingSkill={pendingSkill}
          setPendingSkill={setPendingSkill}
          onBack={() => {
            setReplayStep(null);
            setView("home");
          }}
          onGameAction={emitGame}
          onCountingRequest={() => socket?.emit("counting:request", { roomCode: room.code })}
          onCountingRespond={(accepted) => socket?.emit("counting:respond", { roomCode: room.code, accepted })}
          onScoringAction={emitScoring}
          onChat={(text) => socket?.emit("chat:send", { roomCode: room.code, text })}
        />
      )}
      {room?.game.phase === "finished" && dismissedResultRoom !== room.code && (
        <ResultModal room={room} onClose={() => setDismissedResultRoom(room.code)} />
      )}
      {matchStart && <MatchModal user={user} startedAt={matchStart} onCancel={() => {
        socket?.emit("match:leave");
        setMatchStart(null);
      }} />}
      {showHouse && user && (
        <HouseModal
          user={user}
          records={replayRecords}
          onClose={() => setShowHouse(false)}
          onSelectCharacter={selectCharacter}
          onOpenReplay={openReplay}
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
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
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

function HomeScreen({ user, onLogout, onStartMatch, onOpenHouse, onOpenWatch, onOpenShop }) {
  return (
    <main className="home-screen">
      <header className="topbar">
        <div>
          <p>SigrikaGo</p>
          <h1>大厅</h1>
        </div>
        <button className="icon-button" title="退出登录" onClick={onLogout}><LogOut size={20} /></button>
      </header>
      <section className="home-grid">
        <button className="home-entry house-entry" onClick={onOpenHouse}>
          <div className="entry-copy">
            <UserRound size={30} />
            <strong>棋舍</strong>
            <span>{user.username} · {user.rank} · {user.rating}分</span>
          </div>
          <img className="entry-portrait" src={CHARACTERS[user.selectedCharacter]?.portrait} alt="出战角色" />
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
        <button className="home-entry shop-entry" onClick={onOpenShop}>
          <ShoppingBag size={30} />
          <strong>商城</strong>
          <span>角色、物品、装饰即将开放</span>
        </button>
      </section>
    </main>
  );
}

function RoomScreen({ room, user, replayStep, setReplayStep, pendingSkill, setPendingSkill, onBack, onGameAction, onCountingRequest, onCountingRespond, onScoringAction, onChat }) {
  const [showCoords, setShowCoords] = useState(true);
  const [showMoves, setShowMoves] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [skillBanner, setSkillBanner] = useState(null);
  const isReplay = replayStep !== null;
  const displayRoom = isReplay ? replayRoomAt(room, replayStep) : room;
  const me = displayRoom.players.find((p) => p.user.id === user.id);
  const opponent = displayRoom.players.find((p) => p.user.id !== user.id) ?? displayRoom.players[1];
  const role = isReplay ? "spectator" : displayRoom.role;
  const activePlayer = displayRoom.players.find((p) => p.color === displayRoom.game.turn);
  const scoring = displayRoom.game.scoring;
  const soundMoveRef = useRef(null);
  const voiceRef = useRef({});
  const skillTimerRef = useRef(null);
  const winnerColor = displayRoom.game.winner?.winnerColor ?? displayRoom.game.winner?.color;

  useEffect(() => {
    return () => {
      if (skillTimerRef.current) window.clearTimeout(skillTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isReplay) return;
    const lastMove = [...displayRoom.game.history].reverse().find((entry) => entry.type === "move");
    if (!lastMove || soundMoveRef.current === lastMove.moveNumber) return;
    soundMoveRef.current = lastMove.moveNumber;
    playStoneSound();
  }, [displayRoom.game.history, isReplay]);

  useEffect(() => {
    if (isReplay || !activePlayer) return;
    const timer = activePlayer.time;
    const periodKey = `${activePlayer.color}-periods`;
    const previousPeriods = voiceRef.current[periodKey];
    if (timer.main <= 0 && timer.periodRemaining <= 10 && timer.periodRemaining > 0) {
      const countdownKey = `${activePlayer.color}-${timer.periods}-${timer.periodRemaining}`;
      if (!voiceRef.current[countdownKey]) {
        voiceRef.current[countdownKey] = true;
        playCountdownBeep(timer.periodRemaining);
      }
    }
    if (typeof previousPeriods === "number" && timer.periods < previousPeriods) {
      speakText(`还剩${timer.periods}次读秒`);
    }
    voiceRef.current[periodKey] = timer.periods;
  }, [activePlayer, isReplay]);

  function handlePoint(point) {
    if (isReplay) return;
    if (skillBanner) return;
    if (displayRoom.game.phase === "marking-dead") return handleScoringPoint(point);
    if (role !== "player") return;
    if (pendingSkill) {
      setPendingSkill(false);
      if (canPreviewSkill(displayRoom.game, me, point)) {
        const character = CHARACTERS[me.characterId];
        setSkillBanner({ character, skillName: character.skill.name });
        skillTimerRef.current = window.setTimeout(() => {
          onGameAction({ type: "skill", pointId: point.id });
          setSkillBanner(null);
          skillTimerRef.current = null;
        }, 2000);
        return;
      }
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
          <button className={showMoves ? "toggle active" : "toggle"} onClick={() => setShowMoves(!showMoves)} title="显示手数"><Hash size={16} /></button>
          <button className={showCoords ? "toggle active" : "toggle"} onClick={() => setShowCoords(!showCoords)} title="显示坐标"><PanelRight size={16} /></button>
        </div>
      </header>
      <section className="battle-layout">
        <PlayerInfo player={opponent} game={displayRoom.game} align="opponent" isWinner={displayRoom.game.phase === "finished" && opponent?.color === winnerColor} />
        <div className="board-column">
          <div className="board-stage">
            <Board
              game={displayRoom.game}
              showCoords={showCoords}
              showMoves={showMoves}
              pendingSkill={pendingSkill}
              onPoint={handlePoint}
              onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
              onNeutral={(id) => onScoringAction({ type: "mark-neutral", pointId: id })}
            />
          </div>
          <div className={`status-slot ${!isReplay && scoring ? "floating-status" : ""}`}>
            {isReplay && (
              <ReplayBar
                step={replayStep}
                max={room.game.history.length}
                onStep={setReplayStep}
              />
            )}
            {!isReplay && (
              <CountingPanel
                room={displayRoom}
                user={user}
                scoring={scoring}
                onRespond={onCountingRespond}
                onConfirm={() => onScoringAction({ type: "confirm-dead" })}
                onReset={() => onScoringAction({ type: "reset-dead" })}
                onAccept={() => onScoringAction({ type: "accept-result" })}
                onReject={() => onScoringAction({ type: "reject-result" })}
              />
            )}
          </div>
          <ActionBar
            role={role}
            phase={displayRoom.game.phase}
            me={me}
            isMyTurn={Boolean(me && displayRoom.game.turn === me.color)}
            pendingSkill={pendingSkill}
            setPendingSkill={setPendingSkill}
            skillLocked={Boolean(skillBanner)}
            skillUses={me ? displayRoom.game.skillUses[me.color] ?? 0 : 0}
            onPass={() => onGameAction({ type: "pass" })}
            onCountingRequest={onCountingRequest}
            onResign={requestResignConfirm}
            onBack={requestExitConfirm}
          />
        </div>
        <div className="room-side">
          <PlayerInfo player={me ?? displayRoom.players[0]} game={displayRoom.game} align="self" isWinner={displayRoom.game.phase === "finished" && (me ?? displayRoom.players[0])?.color === winnerColor} />
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
      {skillBanner && <SkillBanner banner={skillBanner} />}
    </main>
  );
}

function Board({ game, showCoords, showMoves, pendingSkill, onPoint, onScoringPoint, onNeutral }) {
  const lastMove = [...game.history].reverse().find((entry) => entry.type === "move");
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
          return (
          <button
            key={point.id}
            className={`point ${point.valid ? "" : "erased"} ${point.stone ?? ""} ${isStarPoint(point.x, point.y) ? "star" : ""}`}
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
            {point.stone && <span className="stone">{lastMove?.id === point.id && <i />}{showMoves && moveNumbers.has(point.id) && <b>{moveNumbers.get(point.id)}</b>}</span>}
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

function PlayerInfo({ player, game, align, isWinner = false }) {
  if (!player) return <aside className="player-info empty" />;
  const character = CHARACTERS[player.characterId];
  const skillUses = game.skillUses[player.color] ?? 0;
  return (
    <aside className={`player-info ${align} ${isWinner ? "winner" : ""}`}>
      <img src={character.portrait} alt={character.name} />
      <div className="player-meta">
        <button className="name-button">{player.user.username}</button>
        <span>{player.user.rank} · {player.user.rating}</span>
        <span className={`color-badge ${player.color}`} title={player.color === COLORS.black ? "执黑" : "执白"} />
      </div>
      <TimeBar time={player.time} />
      <div className="captures">提子 {player.captures}</div>
      <div className={`skill-chip ${skillUses <= 0 ? "spent" : ""}`} title={character.skill.description}>
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

function ActionBar({ role, phase, me, isMyTurn, pendingSkill, setPendingSkill, skillLocked = false, skillUses, onPass, onCountingRequest, onResign, onBack }) {
  if (role === "spectator") {
    return (
      <nav className="action-bar">
        <button><MonitorPlay size={18} />回放</button>
        <button><Pause size={18} />暂停</button>
        <button><Play size={18} />继续</button>
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
      <button onClick={onResign} disabled={phase === "finished" || skillLocked}><Flag size={18} />认输</button>
      <button className="exit-action" onClick={onBack}><DoorOpen size={18} />退出房间</button>
    </nav>
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

function CountingPanel({ room, user, scoring, onRespond, onConfirm, onReset, onAccept, onReject }) {
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

function HouseModal({ user, records, onClose, onSelectCharacter, onOpenReplay }) {
  const [detailCharacter, setDetailCharacter] = useState(null);
  const [showReplays, setShowReplays] = useState(false);
  const stats = deriveHouseStats(user, records);
  const owned = new Set(user.ownedCharacters ?? []);
  const emptySlots = Array.from({ length: 4 }, (_, index) => index);

  return (
    <div className="modal-backdrop">
      <section className="house-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>棋舍</h2>
        <div className="profile-grid">
          <Stat label="战绩" value={`${stats.wins}胜${stats.losses}负`} />
          <Stat label="积分" value={stats.rating} />
          <Stat label="段位" value={user.rank} />
          <Stat label="金币" value={user.coins} />
        </div>
        <div className="character-list">
          {characterList.map((character) => (
            <button
              className={`character-card portrait-card ${user.selectedCharacter === character.id ? "selected" : ""}`}
              key={character.id}
              onClick={() => setDetailCharacter(character)}
            >
              <img src={character.portrait} alt={character.name} />
              <strong>{character.name}</strong>
              {!owned.has(character.id) && <span>未获得</span>}
            </button>
          ))}
          {emptySlots.map((slot) => (
            <button className="character-card portrait-card locked" key={`empty-${slot}`} disabled>
              <span className="locked-portrait">?</span>
              <strong>未获得角色</strong>
            </button>
          ))}
        </div>
        <button className="replay-open-button" onClick={() => setShowReplays(true)}>
          <MonitorPlay size={18} />对局回放
        </button>
        {detailCharacter && (
          <section className="nested-modal character-detail">
            <button className="close-button" onClick={() => setDetailCharacter(null)}><X size={18} /></button>
            <img src={detailCharacter.portrait} alt={detailCharacter.name} />
            <h3>{detailCharacter.name}</h3>
            <strong>{detailCharacter.skill.name}</strong>
            <p>{detailCharacter.skill.description}</p>
            <button
              className="primary-action"
              disabled={!owned.has(detailCharacter.id) || user.selectedCharacter === detailCharacter.id}
              onClick={() => {
                onSelectCharacter(detailCharacter.id);
                setDetailCharacter(null);
              }}
            >
              {user.selectedCharacter === detailCharacter.id ? "出战中" : owned.has(detailCharacter.id) ? "设为出战" : "未获得"}
            </button>
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

function MatchModal({ user, startedAt, onCancel }) {
  const [now, setNow] = useState(Date.now());
  const character = CHARACTERS[user?.selectedCharacter] ?? CHARACTERS.sigrika;
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

function ShopModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="shop-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>商城</h2>
        <div className="shop-grid">
          {["角色", "物品", "装饰"].map((type) => (
            <div className="shop-item" key={type}>
              <ShoppingBag />
              <strong>{type}</strong>
              <span>即将开放</span>
            </div>
          ))}
        </div>
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

function ResultModal({ room, onClose }) {
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  const winner = room.players.find((player) => player.color === winnerColor) ?? room.players[0];
  const character = CHARACTERS[winner?.characterId] ?? CHARACTERS.sigrika;
  return (
    <div className="modal-backdrop">
      <section className="result-modal">
        <div className="result-winner">
          <img src={character.portrait} alt={character.name} />
          <strong>{winner?.user.username}</strong>
        </div>
        <div className="result-summary">
          <h2>对局结果</h2>
          <p>{room.game.winner?.text ?? "对局结束"}</p>
          <button onClick={onClose}>确认</button>
        </div>
      </section>
    </div>
  );
}

function SkillBanner({ banner }) {
  return (
    <div className="skill-burst" aria-live="polite">
      <img src={banner.character.portrait} alt={banner.character.name} />
      <div>
        <span>{banner.character.name}</span>
        <strong>{banner.skillName}</strong>
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

function deriveHouseStats(user, records) {
  let wins = 0;
  let losses = 0;
  for (const record of records) {
    const color = record.blackName === user.username ? COLORS.black : record.whiteName === user.username ? COLORS.white : null;
    const winner = winnerColorFromRecord(record);
    if (!color || !winner) continue;
    if (color === winner) wins += 1;
    else losses += 1;
  }
  return {
    wins,
    losses,
    rating: 1000 + wins * 20
  };
}

function winnerColorFromRecord(record) {
  const text = record.resultText ?? "";
  if (text.startsWith("黑胜") || text.includes("白方认输")) return COLORS.black;
  if (text.startsWith("白胜") || text.includes("黑方认输")) return COLORS.white;
  return null;
}

function canPreviewSkill(game, player, point) {
  if (!player || game.phase !== "playing" || game.turn !== player.color) return false;
  if ((game.skillUses[player.color] ?? 0) <= 0) return false;
  if (!point?.valid) return false;
  if (player.characterId === "sigrika") return !point.stone;
  if (player.characterId === "danea") return Boolean(point.stone);
  return false;
}

function Toast({ text, onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);
  return <div className="toast">{text}</div>;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "请求失败");
  return data;
}

function playStoneSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(260, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(95, context.currentTime + 0.08);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.13);
}

function playCountdownBeep(second) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = second <= 3 ? "square" : "sine";
  oscillator.frequency.setValueAtTime(second <= 3 ? 880 : 620, context.currentTime);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(second <= 3 ? 0.2 : 0.13, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.11);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
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

function replayRoomAt(room, step) {
  if (step >= room.game.history.length) {
    return { ...room, role: "spectator" };
  }
  let game = createGameState(room.game.players);
  const replayPlayers = room.players.map((player) => ({
    ...player,
    captures: 0,
    time: player.time ?? { main: 0, byoYomi: 30, periodRemaining: 30, periods: 0 }
  }));

  for (const entry of room.game.history.slice(0, step)) {
    let result = null;
    if (entry.type === "move") result = playMove(game, entry.color, entry.id);
    if (entry.type === "pass") result = passMove(game, entry.color);
    if (entry.type === "skill") {
      const player = replayPlayers.find((candidate) => candidate.color === entry.color);
      result = useSkill(game, entry.color, player?.characterId, entry.id);
    }
    if (result?.ok) game = result.state;
  }

  for (const player of replayPlayers) {
    player.captures = game.captures[player.color] ?? 0;
  }

  return {
    ...room,
    role: "spectator",
    players: replayPlayers,
    game,
    chat: room.chat.filter((message) => message.moveNumber <= game.moveNumber)
  };
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



