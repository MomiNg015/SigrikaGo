import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import { CHARACTERS, mergeCharacters } from "./shared/characters.js";
import { latestSkillCharacterId, resolveBackgroundMusic } from "./shared/musicLibrary.js";
import { deploymentSocketBase, loginPreloadAssets, preloadLoginAssets } from "./shared/preloadAssets.js";
import { DEFAULT_SITE_SETTINGS } from "./shared/siteSettings.js";
import { BackgroundMusic, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, playDoorbellSound } from "./audio/playback.jsx";
import AdminConsole from "./admin/AdminConsole.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import HomeScreen from "./home/HomeScreen.jsx";
import { DuelRequestBanner, Toast } from "./modals/FeedbackModals.jsx";
import FriendsModal from "./modals/FriendsModal.jsx";
import { MatchModal, MatchSuccessModal, ResultModal } from "./modals/GameLifecycleModals.jsx";
import HouseModal from "./modals/HouseModal.jsx";
import LeaderboardModal from "./modals/LeaderboardModal.jsx";
import MessageBoardModal from "./modals/MessageBoardModal.jsx";
import ShopModal from "./modals/ShopModal.jsx";
import SettingsModal from "./modals/SettingsModal.jsx";
import WatchModal from "./modals/WatchModal.jsx";
import RoomScreen from "./room/RoomScreen.jsx";
import { adminApi, api } from "./api/client.js";
import "./styles.css";

const SOCKET_BASE = deploymentSocketBase();

function App() {
  const [token, setToken] = useState(localStorage.getItem("sigrika-token") ?? "");
  const [user, setUser] = useState(null);
  const [view, setView] = useState(token ? "preloading" : "login");
  const [room, setRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState("danger");
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
  const [assetProgress, setAssetProgress] = useState(0);
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
    let cancelled = false;
    api("/api/me", { token })
      .then(async (data) => {
        if (cancelled) return;
        setUser(data.user);
        setView("preloading");
        setAssetProgress(0);
        const nextCharacters = await loadPublicCharacters(token);
        if (cancelled) return;
        setCharacters(nextCharacters);
        const startedAt = Date.now();
        await preloadLoginAssets(loginPreloadAssets({
          characters: nextCharacters,
          ownedCharacters: data.user.ownedCharacters,
          musicSelections: data.user.musicSelections
        }), {
          onProgress: (progress) => {
            if (!cancelled) setAssetProgress(progress);
          }
        });
        const elapsed = Date.now() - startedAt;
        if (elapsed < 900) await new Promise((resolve) => setTimeout(resolve, 900 - elapsed));
        if (!cancelled) setView("home");
      })
      .catch(() => {
        if (cancelled) return;
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
    return () => {
      cancelled = true;
    };
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
      showToast("房间已关闭。");
    });
    nextSocket.on("error:toast", (message) => {
      if (String(message).includes("房间不存在")) {
        setRoom(null);
        setReplayStep(null);
        setPendingSkill(false);
        setMatchSuccess(null);
        setView("home");
      }
      showToast(message);
    });
    nextSocket.on("duel:incoming", (request) => {
      setIncomingDuel(request);
      playDoorbellSound(audioSettingsRef.current);
    });
    nextSocket.on("duel:closed", ({ requestId }) => {
      setIncomingDuel((current) => current?.requestId === requestId ? null : current);
    });
    nextSocket.on("duel:rejected", ({ username }) => {
      showToast(`${username}拒绝了你的对局申请`);
    });
    nextSocket.on("duel:unavailable", ({ reason }) => {
      showToast(reason === "playing" ? "对方正在对局中。" : "对方不在线。");
    });
    setSocket(nextSocket);
    return () => nextSocket.close();
  }, [token, user]);

  useEffect(() => {
    if (!showHouse || !token) return;
    api("/api/replays", { token })
      .then((data) => setReplayRecords(data.records))
      .catch((error) => showToast(error.message));
  }, [showHouse, token]);

  useEffect(() => {
    localStorage.setItem("sigrika-audio-settings", JSON.stringify(audioSettings));
  }, [audioSettings]);

  function handleAuth(nextToken, nextUser) {
    localStorage.setItem("sigrika-token", nextToken);
    setView("preloading");
    setAssetProgress(0);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function refreshPublicCharacters() {
    try {
      const data = await api("/api/characters", { token });
      setCharacters(mergeCharacters(data.characters, data.disabledSlugs));
    } catch {
      setCharacters(CHARACTERS);
    }
  }

  async function loadPublicCharacters(authToken) {
    try {
      const data = await api("/api/characters", { token: authToken });
      return mergeCharacters(data.characters, data.disabledSlugs);
    } catch {
      return CHARACTERS;
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

  function showToast(message, tone = "danger") {
    setToastTone(tone);
    setToast(message);
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
      {toast && <Toast text={toast} tone={toastTone} onClose={() => setToast("")} />}
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
      {view === "preloading" && <AssetPreloadScreen progress={assetProgress} />}
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
      {showMessageBoard && (
        <MessageBoardModal
          token={token}
          onSubmitted={() => showToast("感谢您的反馈！", "success")}
          onClose={() => setShowMessageBoard(false)}
        />
      )}
    </div>
  );
}

function AssetPreloadScreen({ progress }) {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <main className="asset-preload-screen">
      <section className="asset-preload-panel">
        <div className="preload-mark" />
        <p>资源准备中</p>
        <div className="preload-bar" aria-label={`资源加载 ${percent}%`}>
          <span style={{ width: `${percent}%` }} />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
