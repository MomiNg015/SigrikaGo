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
  Pause,
  Play,
  Plus,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Swords,
  UserRound,
  Volume2,
  Upload,
  X
} from "lucide-react";
import { CHARACTERS, mergeCharacters } from "./shared/characters.js";
import { BOARD_SIZE, COLORS, createGameState, passMove, playMove, useSkill } from "./shared/game.js";
import "./styles.css";

const API_BASE = "";
const SOCKET_BASE = "http://localhost:3001";
const DEFAULT_AUDIO_SETTINGS = {
  master: 80,
  bgm: 60,
  sfx: 80,
  voice: 80
};

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
  const [showSettings, setShowSettings] = useState(false);
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const [watchCode, setWatchCode] = useState("");
  const [pendingSkill, setPendingSkill] = useState(false);
  const [replayRecords, setReplayRecords] = useState([]);
  const [replayStep, setReplayStep] = useState(null);
  const [dismissedResultRoom, setDismissedResultRoom] = useState("");
  const [characters, setCharacters] = useState(CHARACTERS);
  const [adminTab, setAdminTab] = useState("overview");
  const characterListView = Object.values(characters);

  useEffect(() => {
    if (!token) return;
    api("/api/me", { token })
      .then((data) => {
        setUser(data.user);
        setView("home");
        api("/api/characters", { token })
          .then((data) => {
            setCharacters(mergeCharacters(data.characters, data.disabledSlugs));
          })
          .catch(() => setCharacters(CHARACTERS));
      })
      .catch(() => {
        localStorage.removeItem("sigrika-token");
        setToken("");
        setCharacters(CHARACTERS);
      });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    const nextSocket = io(SOCKET_BASE, { auth: { token } });
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

  useEffect(() => {
    localStorage.setItem("sigrika-audio-settings", JSON.stringify(audioSettings));
  }, [audioSettings]);

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
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
      {view === "login" && <AuthScreen onAuth={handleAuth} />}
      {view === "home" && user && (
        <HomeScreen
          user={user}
          characters={characters}
          onLogout={logout}
          onSelectCharacter={selectCharacter}
          onStartMatch={startMatch}
          onOpenHouse={() => setShowHouse(true)}
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
          onBack={() => setView("home")}
          onOpenReplay={openAdminReplay}
        />
      )}
      {view === "admin" && user?.role !== "admin" && (
        <HomeScreen
          user={user}
          characters={characters}
          onLogout={logout}
          onSelectCharacter={selectCharacter}
          onStartMatch={startMatch}
          onOpenHouse={() => setShowHouse(true)}
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
      {room?.game.phase === "finished" && dismissedResultRoom !== room.code && (
        <ResultModal room={room} characters={characters} onClose={() => setDismissedResultRoom(room.code)} />
      )}
      {matchStart && <MatchModal user={user} startedAt={matchStart} onCancel={() => {
        socket?.emit("match:leave");
        setMatchStart(null);
      }} characters={characters} />}
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

function AdminConsole({ user, token, tab, setTab, onBack, onOpenReplay }) {
  const tabs = ["overview", "users", "characters", "shop", "decorations", "audit"];
  const tabLabels = {
    overview: "概览",
    users: "用户管理",
    characters: "角色管理",
    shop: "商城管理",
    decorations: "装饰管理",
    audit: "审计日志"
  };
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [adminCharacters, setAdminCharacters] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [decorations, setDecorations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    if (tab !== "overview") return;
    setAdminError("");
    adminApi("/summary", token)
      .then(setSummary)
      .catch((error) => setAdminError(error.message));
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "users") return;
    refreshUsers();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "characters") return;
    refreshCharacters();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "audit") return;
    refreshAuditLogs();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "shop") return;
    refreshShopItems();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "decorations") return;
    refreshDecorations();
  }, [tab, token]);

  async function refreshUsers(nextSelectedId = selectedUser?.id) {
    setAdminError("");
    try {
      const data = await adminApi("/users", token);
      const nextUsers = data.users ?? [];
      setUsers(nextUsers);
      if (nextSelectedId) {
        setSelectedUser(nextUsers.find((candidate) => candidate.id === nextSelectedId) ?? null);
      }
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshCharacters() {
    setAdminError("");
    try {
      const data = await adminApi("/characters", token);
      setAdminCharacters(data.characters ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshAuditLogs() {
    setAdminError("");
    try {
      const data = await adminApi("/audit-logs", token);
      setAuditLogs(data.auditLogs ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshShopItems() {
    setAdminError("");
    try {
      const data = await adminApi("/shop-items", token);
      setShopItems(data.items ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  async function refreshDecorations() {
    setAdminError("");
    try {
      const data = await adminApi("/decorations", token);
      setDecorations(data.decorations ?? []);
    } catch (error) {
      setAdminError(error.message);
    }
  }

  return (
    <main className="admin-screen">
      <aside className="admin-sidebar">
        <strong>SigrikaGo Admin</strong>
        {tabs.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {tabLabels[item]}
          </button>
        ))}
        <button onClick={onBack}>返回大厅</button>
      </aside>
      <section className="admin-main">
        <header><span>{user.username}</span><strong>{tabLabels[tab]}</strong></header>
        {adminError && <p className="form-error admin-error">{adminError}</p>}
        {tab === "overview" && <AdminOverview summary={summary} />}
        {tab === "users" && (
          <>
            <AdminUsers users={users} onSelect={setSelectedUser} />
            {selectedUser && (
              <UserEditor
                user={selectedUser}
                token={token}
                onClose={() => setSelectedUser(null)}
                onRefresh={refreshUsers}
                onOpenReplay={onOpenReplay}
              />
            )}
          </>
        )}
        {tab === "characters" && (
          <AdminCharacters characters={adminCharacters} token={token} onSaved={refreshCharacters} />
        )}
        {tab === "shop" && (
          <AdminShopItems items={shopItems} token={token} onSaved={refreshShopItems} onClearError={() => setAdminError("")} />
        )}
        {tab === "decorations" && (
          <AdminDecorations decorations={decorations} token={token} onSaved={refreshDecorations} />
        )}
        {tab === "audit" && <AdminAudit logs={auditLogs} />}
      </section>
    </main>
  );
}

function AdminOverview({ summary }) {
  const cards = [
    ["用户", summary?.summary?.users ?? 0],
    ["封禁", summary?.summary?.bannedUsers ?? 0],
    ["角色", summary?.summary?.characters ?? 0],
    ["棋谱", summary?.summary?.gameRecords ?? 0]
  ];
  return (
    <div className="admin-grid">
      {cards.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
    </div>
  );
}

function AdminUsers({ users, onSelect }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>权限</th>
            <th>状态</th>
            <th>段位</th>
            <th>积分</th>
            <th>金币</th>
            <th>胜负</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} onClick={() => onSelect(user)}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{user.rank}</td>
              <td>{user.rating}</td>
              <td>{user.coins}</td>
              <td>{user.wins}/{user.losses}</td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="7">暂无用户</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminCharacters({ characters, token, onSaved }) {
  const [draft, setDraft] = useState(null);

  function startNewCharacter() {
    setDraft(emptyCharacterDraft());
  }

  function selectCharacter(character) {
    setDraft(buildCharacterDraft(character));
  }

  return (
    <div className="admin-character-layout">
      <section className="admin-character-list">
        <button className="admin-add-button" onClick={startNewCharacter}>
          <Plus size={18} />新增角色
        </button>
        <div className="admin-character-cards">
          {characters.map((character) => (
            <button
              key={character.dbId ?? character.id}
              className={`admin-character-card ${draft?.dbId === character.dbId ? "selected" : ""}`}
              onClick={() => selectCharacter(character)}
            >
              <img src={character.portrait} alt={character.name} />
              <span>
                <strong>{character.name}</strong>
                <small>{character.id}</small>
              </span>
              <em>{character.enabled ? "启用" : "停用"}</em>
            </button>
          ))}
          {characters.length === 0 && <p className="quiet-text">暂无角色。</p>}
        </div>
      </section>
      <section className="admin-character-editor">
        {draft ? (
          <CharacterEditor
            draft={draft}
            setDraft={setDraft}
            token={token}
            onCancel={() => setDraft(null)}
            onSaved={async (savedCharacter) => {
              await onSaved();
              if (savedCharacter) setDraft(buildCharacterDraft(savedCharacter));
            }}
          />
        ) : (
          <div className="admin-empty-state">
            <strong>选择一个角色</strong>
            <p className="quiet-text">从左侧选择角色，或新建角色后编辑技能和肖像。</p>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminShopItems({ items, token, onSaved, onClearError }) {
  const [draft, setDraft] = useState(emptyShopItemDraft());
  const [message, setMessage] = useState("");

  async function save(event) {
    event.preventDefault();
    onClearError();
    setMessage("");
    const validated = validateShopItemDraft(draft);
    if (!validated.ok) {
      setMessage(validated.error);
      return;
    }
    const id = draft.id;
    const data = await adminApi(id ? `/shop-items/${id}` : "/shop-items", token, {
      method: id ? "PATCH" : "POST",
      body: validated.value
    });
    setDraft(buildShopItemDraft(data.item));
    setMessage("保存成功");
    await onSaved();
  }

  async function disableItem(item) {
    await adminApi(`/shop-items/${item.id}`, token, { method: "DELETE" });
    await onSaved();
  }

  return (
    <div className="admin-management-grid">
      <section className="admin-table-wrap">
        <button className="admin-add-button" onClick={() => { onClearError(); setMessage(""); setDraft(emptyShopItemDraft()); }}><Plus size={18} />新增商品</button>
        <table className="admin-table">
          <thead><tr><th>商品</th><th>类别</th><th>价格</th><th>状态</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} onClick={() => { onClearError(); setMessage(""); setDraft(buildShopItemDraft(item)); }}>
                <td>{item.name}</td><td>{shopCategoryLabel(item.category)}</td><td>{item.finalPrice}/{item.priceCoins}</td><td>{item.enabled ? "展示" : "隐藏"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <form className="admin-character-form" onSubmit={save}>
        <h2>{draft.id ? "编辑商品" : "新增商品"}</h2>
        {message && <p className={message === "保存成功" ? "admin-success" : "form-error admin-action-error"}>{message}</p>}
        <div className="admin-character-form-grid">
          <label><AdminFieldLabel text="商品名" tip="商城中显示的商品名称。" /><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label><AdminFieldLabel text="类别" tip="购买后获得角色或装饰。" /><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option value="character">角色</option><option value="decoration">装饰</option></select></label>
          <label><AdminFieldLabel text="目标标识" tip="角色 slug 或装饰 slug。" /><input value={draft.targetId} onChange={(e) => setDraft({ ...draft, targetId: e.target.value })} /></label>
          <label><AdminFieldLabel text="金币价格" tip="购买所需原价金币。" /><input type="number" value={draft.priceCoins} onChange={(e) => setDraft({ ...draft, priceCoins: e.target.value })} /></label>
          <label><AdminFieldLabel text="折扣" tip="0 到 100 的折扣百分比。" /><input type="number" min="0" max="100" value={draft.discountPercent} onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })} /></label>
          <label><AdminFieldLabel text="排序" tip="商品显示顺序。" /><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.purchasable} onChange={(e) => setDraft({ ...draft, purchasable: e.target.checked })} /><AdminFieldLabel text="可购买" tip="关闭后商品可展示但不能购买。" /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><AdminFieldLabel text="展示" tip="关闭后不在商城显示。" /></label>
          <label className="wide-field"><AdminFieldLabel text="图片地址" tip="商城卡片图片。" /><input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></label>
          <label className="wide-field"><AdminFieldLabel text="商品描述" tip="商城中显示的商品说明。" /><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        </div>
        <div className="inline-actions">
          <button className="primary-action" type="submit">保存</button>
          {draft.id && <button className="secondary-action" type="button" onClick={() => disableItem(draft)}>下架</button>}
        </div>
      </form>
    </div>
  );
}

function AdminDecorations({ decorations, token, onSaved }) {
  const [draft, setDraft] = useState(emptyDecorationDraft());
  const [message, setMessage] = useState("");

  async function save(event) {
    event.preventDefault();
    setMessage("");
    const body = decorationDraftToBody(draft);
    if (!body) {
      setMessage("请填写装饰标识、名称和正确排序");
      return;
    }
    const data = await adminApi(draft.id ? `/decorations/${draft.id}` : "/decorations", token, {
      method: draft.id ? "PATCH" : "POST",
      body
    });
    setDraft(buildDecorationDraft(data.decoration));
    setMessage("保存成功");
    await onSaved();
  }

  return (
    <div className="admin-management-grid">
      <section className="admin-table-wrap">
        <button className="admin-add-button" onClick={() => setDraft(emptyDecorationDraft())}><Plus size={18} />新增装饰</button>
        <table className="admin-table">
          <thead><tr><th>装饰</th><th>标识</th><th>状态</th></tr></thead>
          <tbody>{decorations.map((decoration) => <tr key={decoration.id} onClick={() => setDraft(buildDecorationDraft(decoration))}><td>{decoration.name}</td><td>{decoration.slug}</td><td>{decoration.enabled ? "启用" : "停用"}</td></tr>)}</tbody>
        </table>
      </section>
      <form className="admin-character-form" onSubmit={save}>
        <h2>{draft.id ? "编辑装饰" : "新增装饰"}</h2>
        {message && <p className={message === "保存成功" ? "admin-success" : "form-error admin-action-error"}>{message}</p>}
        <div className="admin-character-form-grid">
          <label><AdminFieldLabel text="装饰标识" tip="装饰唯一 slug，用于购买后写入用户拥有列表。" /><input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></label>
          <label><AdminFieldLabel text="装饰名称" tip="棋舍里显示的装饰名称。" /><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label><AdminFieldLabel text="图片地址" tip="装饰预览图片。" /><input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></label>
          <label><AdminFieldLabel text="排序" tip="装饰显示顺序。" /><input type="number" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><AdminFieldLabel text="启用" tip="关闭后不展示该装饰。" /></label>
          <label className="wide-field"><AdminFieldLabel text="装饰描述" tip="棋舍和商城中展示的装饰说明。" /><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        </div>
        <button className="primary-action" type="submit">保存</button>
      </form>
    </div>
  );
}

function CharacterEditor({ draft, setDraft, token, onCancel, onSaved }) {
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function updateDraft(field, value) {
    setActionError("");
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateSkill(field, value) {
    setActionError("");
    setDraft((current) => ({
      ...current,
      skill: {
        ...current.skill,
        [field]: value
      }
    }));
  }

  function updateSkillEffect(effectType) {
    setActionError("");
    setDraft((current) => ({
      ...current,
      skill: {
        ...current.skill,
        effectType,
        targetRule: targetRuleForEffect(effectType)
      }
    }));
  }

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    setActionError("");
    try {
      const url = await uploadPortrait(file, token);
      setDraft((current) => ({
        ...current,
        portraitUrl: url,
        portraitSource: "upload"
      }));
    } catch (error) {
      setActionError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function saveCharacter(event) {
    event.preventDefault();
    const body = characterDraftToBody(draft);
    if (!body) {
      setActionError("排序和使用次数必须是整数；数值代价只能填数字，特殊代价需要填写文本");
      return;
    }

    setSaving(true);
    setActionError("");
    setSuccessMessage("");
    try {
      const id = draft.dbId ?? draft.originalSlug;
      const data = await adminApi(id ? `/characters/${id}` : "/characters", token, {
        method: id ? "PATCH" : "POST",
        body
      });
      setSuccessMessage("保存成功");
      await onSaved(data.character);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-character-form" onSubmit={saveCharacter}>
      <div className="admin-form-heading">
        <div>
          <h2>{draft.dbId ? "编辑角色" : "新增角色"}</h2>
          <p className="quiet-text">{draft.originalSlug || "new-character"}</p>
        </div>
        <div className="inline-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>取消</button>
          <button className="primary-action" type="submit" disabled={saving}>{saving ? "保存中" : "保存"}</button>
        </div>
      </div>
      {actionError && <p className="form-error admin-action-error">{actionError}</p>}
      {successMessage && <p className="admin-success">{successMessage}</p>}
      <div className="admin-character-form-grid">
        <label><AdminFieldLabel text="角色标识" tip="角色的唯一 slug，用于存档、拥有角色和出战角色匹配。" />
          <input value={draft.slug} onChange={(event) => updateDraft("slug", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="角色名称" tip="显示在棋舍、对局资料和技能演出中的角色名。" />
          <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="立绘地址" tip="角色立绘图片地址，可以是资源路径或上传后生成的路径。" />
          <input value={draft.portraitUrl} onChange={(event) => updateDraft("portraitUrl", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="立绘来源" tip="标记立绘来自外部路径还是后台上传。" />
          <select value={draft.portraitSource} onChange={(event) => updateDraft("portraitSource", event.target.value)}>
            <option value="url">路径</option>
            <option value="upload">上传</option>
          </select>
        </label>
        <label><AdminFieldLabel text="主题色" tip="角色卡片和视觉提示使用的代表色。" />
          <input type="color" value={draft.palette} onChange={(event) => updateDraft("palette", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="排序" tip="角色在列表中的显示顺序，数字越小越靠前。" />
          <input type="number" value={draft.sortOrder} onChange={(event) => updateDraft("sortOrder", event.target.value)} />
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.enabled} onChange={(event) => updateDraft("enabled", event.target.checked)} />
          <AdminFieldLabel text="启用" tip="关闭后该角色不会出现在玩家可选角色中。" />
        </label>
        <label className="admin-upload-field"><AdminFieldLabel text="上传立绘" tip="上传 png、jpg、webp 或 gif 作为角色立绘。" />
          <span>
            <Upload size={18} />
            {uploading ? "上传中" : "选择文件"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => handleUpload(event.target.files?.[0])} />
          </span>
        </label>
      </div>
      {draft.portraitUrl && (
        <div className="admin-portrait-preview">
          <img src={draft.portraitUrl} alt={draft.name || "character portrait"} />
        </div>
      )}
      <h3>技能</h3>
      <div className="admin-character-form-grid">
        <label><AdminFieldLabel text="技能效果" tip="决定技能实际执行的规则类型。" />
          <select value={draft.skill.effectType} onChange={(event) => updateSkillEffect(event.target.value)}>
            <option value="erase-point">抹除交叉点</option>
            <option value="flip-stone">棋子反色</option>
            <option value="hidden-hand">隐藏手</option>
          </select>
        </label>
        <label><AdminFieldLabel text="技能名" tip="展示给玩家看的技能名称。" />
          <input value={draft.skill.name} onChange={(event) => updateSkill("name", event.target.value)} />
        </label>
        <label className="wide-field"><AdminFieldLabel text="技能描述" tip="棋舍角色详情中展示的技能说明。" />
          <textarea value={draft.skill.description} onChange={(event) => updateSkill("description", event.target.value)} />
        </label>
        <label className="wide-field"><AdminFieldLabel text="技能系统信息" tip="发动技能后写入系统聊天。可用 {player}、{character}、{skill}、{point}、{color}。" />
          <textarea value={draft.skill.systemMessage} onChange={(event) => updateSkill("systemMessage", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="使用次数" tip="每局可使用该技能的次数，范围 0 到 9。" />
          <input type="number" min="0" max="9" value={draft.skill.uses} onChange={(event) => updateSkill("uses", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="目标规则" tip="限制技能可以点选空点还是已有棋子。" />
          <select value={draft.skill.targetRule} onChange={(event) => updateSkill("targetRule", event.target.value)}>
            <option value="empty-point">空交叉点</option>
            <option value="stone">棋子</option>
          </select>
        </label>
        <label className="admin-checkbox">
          <input type="checkbox" checked={draft.skill.freeTurn} onChange={(event) => updateSkill("freeTurn", event.target.checked)} />
          <AdminFieldLabel text="不消耗回合" tip="开启后释放技能不会交出当前回合。" />
        </label>
        <label><AdminFieldLabel text="代价类别" tip="数值会在数子时扣除；特殊只展示文本，暂时不影响规则。" />
          <select value={draft.skill.costType} onChange={(event) => updateSkill("costType", event.target.value)}>
            <option value="numeric">数值</option>
            <option value="special">特殊</option>
          </select>
        </label>
        <label><AdminFieldLabel text="代价说明" tip="数值类别只能填写数字；特殊类别可填写展示文本。" />
          <input
            type={draft.skill.costType === "numeric" ? "number" : "text"}
            value={draft.skill.costValue}
            onChange={(event) => updateSkill("costValue", event.target.value)}
          />
        </label>
        <label className="wide-field"><AdminFieldLabel text="技能参数" tip="保留给扩展技能使用的 JSON 参数。" />
          <textarea value={draft.skill.paramsJson} onChange={(event) => updateSkill("paramsJson", event.target.value)} />
        </label>
      </div>
    </form>
  );
}

function AdminAudit({ logs }) {
  return (
    <div className="admin-table-wrap audit-table-wrap">
      <table className="admin-table audit-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>管理员</th>
            <th>动作</th>
            <th>目标</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>{log.adminUserId ?? "-"}</td>
              <td>{log.action}</td>
              <td>{log.targetType ?? "-"} · {log.targetId ?? "-"}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan="4">暂无审计日志</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UserEditor({ user, token, onClose, onRefresh, onOpenReplay }) {
  const [draft, setDraft] = useState(() => buildUserDraft(user));
  const [banReason, setBanReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userReplays, setUserReplays] = useState([]);
  const [loadingReplays, setLoadingReplays] = useState(false);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(buildUserDraft(user));
    setBanReason("");
    setNewPassword("");
    setUserReplays([]);
    setActionError("");
  }, [user]);

  function updateDraft(field, value) {
    setActionError("");
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function runAction(action) {
    setSaving(true);
    setActionError("");
    try {
      await action();
      await onRefresh(user.id);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveUser(event) {
    event.preventDefault();
    const rating = parseAdminInteger(draft.rating);
    if (rating == null) {
      setActionError("积分必须是 32-bit signed int 范围内的整数");
      return;
    }
    const coins = parseAdminInteger(draft.coins);
    if (coins == null) {
      setActionError("金币必须是 32-bit signed int 范围内的整数");
      return;
    }
    await runAction(() => adminApi(`/users/${draft.id}`, token, {
      method: "PATCH",
      body: {
        role: draft.role,
        rank: draft.rank,
        rating,
        coins,
        ownedCharacters: draft.ownedCharactersText.split(",").map((item) => item.trim()).filter(Boolean),
        selectedCharacter: draft.selectedCharacter
      }
    }));
  }

  async function banUser() {
    const reason = banReason.trim();
    if (reason.length < 2) {
      setActionError("封禁原因至少需要 2 个字符");
      return;
    }
    if (!window.confirm(`确认封禁 ${user.username}？`)) return;
    await runAction(() => adminApi(`/users/${user.id}/ban`, token, {
      method: "POST",
      body: { reason }
    }));
  }

  async function unbanUser() {
    if (!window.confirm(`确认解封 ${user.username}？`)) return;
    await runAction(() => adminApi(`/users/${user.id}/unban`, token, { method: "POST" }));
  }

  async function resetPassword() {
    if (newPassword.length < 4) {
      setActionError("新密码至少需要 4 个字符");
      return;
    }
    if (!window.confirm(`确认重置 ${user.username} 的密码？`)) return;
    await runAction(async () => {
      await adminApi(`/users/${user.id}/reset-password`, token, {
        method: "POST",
        body: { password: newPassword }
      });
      setNewPassword("");
    });
  }

  async function loadUserReplays() {
    setLoadingReplays(true);
    setActionError("");
    try {
      const data = await adminApi(`/users/${user.id}/replays`, token);
      setUserReplays(data.records ?? []);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setLoadingReplays(false);
    }
  }

  return (
    <aside className="admin-drawer">
      <button className="close-button" onClick={onClose}><X size={18} /></button>
      <h2>{user.username}</h2>
      <p className="quiet-text">{user.status} · {user.wins}/{user.losses}</p>
      {actionError && <p className="form-error admin-action-error">{actionError}</p>}
      <form className="admin-form" onSubmit={saveUser}>
        <label><AdminFieldLabel text="权限" tip="控制该账号是普通玩家还是管理员。" />
          <select value={draft.role} onChange={(event) => updateDraft("role", event.target.value)}>
            <option value="player">玩家</option>
            <option value="admin">管理员</option>
          </select>
        </label>
        <label><AdminFieldLabel text="段位" tip="显示在大厅、对局信息和个人棋舍中的段位文本。" />
          <input value={draft.rank} onChange={(event) => updateDraft("rank", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="积分" tip="用户的匹配积分，必须是整数。" />
          <input type="number" value={draft.rating} onChange={(event) => updateDraft("rating", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="金币" tip="用户当前拥有的金币数量，必须是整数。" />
          <input type="number" value={draft.coins} onChange={(event) => updateDraft("coins", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="拥有角色" tip="该用户已解锁的角色 slug，多个角色用英文逗号分隔。" />
          <input value={draft.ownedCharactersText} onChange={(event) => updateDraft("ownedCharactersText", event.target.value)} />
        </label>
        <label><AdminFieldLabel text="出战角色" tip="该用户当前默认出战角色的 slug。" />
          <input value={draft.selectedCharacter} onChange={(event) => updateDraft("selectedCharacter", event.target.value)} />
        </label>
        <button className="primary-action" type="submit" disabled={saving}>保存</button>
      </form>
      <div className="admin-replay-zone">
        <div className="admin-section-title">
          <AdminFieldLabel text="用户棋谱" tip="查看并回放该用户参与过的任意对局。" />
          <button className="secondary-action" onClick={loadUserReplays} disabled={loadingReplays}>
            {loadingReplays ? "加载中" : "加载棋谱"}
          </button>
        </div>
        <div className="admin-replay-list">
          {userReplays.map((record) => (
            <button key={record.id} className="admin-replay-item" onClick={() => onOpenReplay(record.id)}>
              <strong>{record.blackName} vs {record.whiteName}</strong>
              <span>{record.resultText} · {record.moveCount}手 · {formatDateTime(record.createdAt)}</span>
            </button>
          ))}
          {!loadingReplays && userReplays.length === 0 && <p className="quiet-text">尚未加载或暂无棋谱。</p>}
        </div>
      </div>
      <div className="admin-danger-zone">
        <label><AdminFieldLabel text="封禁原因" tip="封禁账号时记录的原因，至少 2 个字符。" />
          <input value={banReason} onChange={(event) => {
            setActionError("");
            setBanReason(event.target.value);
          }} />
        </label>
        <div className="inline-actions">
          <button className="danger-action" onClick={banUser} disabled={saving || user.status === "banned"}>封禁</button>
          <button className="secondary-action" onClick={unbanUser} disabled={saving || user.status !== "banned"}>解封</button>
        </div>
        <label><AdminFieldLabel text="新密码" tip="为该用户重置登录密码，至少 4 个字符。" />
          <input type="password" value={newPassword} onChange={(event) => {
            setActionError("");
            setNewPassword(event.target.value);
          }} />
        </label>
        <button className="secondary-action" onClick={resetPassword} disabled={saving}>重置密码</button>
      </div>
    </aside>
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

function HomeScreen({ user, characters, onLogout, onStartMatch, onOpenHouse, onOpenWatch, onOpenShop, onOpenSettings, onOpenAdmin }) {
  return (
    <main className="home-screen">
      <header className="topbar">
        <div>
          <p>SigrikaGo</p>
          <h1>大厅</h1>
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
  const isReplay = replayStep !== null;
  const displayRoom = isReplay ? replayRoomAt(room, replayStep) : room;
  const me = displayRoom.players.find((p) => p.user.id === user.id);
  const opponent = displayRoom.players.find((p) => p.user.id !== user.id) ?? displayRoom.players[1];
  const role = isReplay ? "spectator" : displayRoom.role;
  const activePlayer = displayRoom.players.find((p) => p.color === displayRoom.game.turn);
  const scoring = displayRoom.game.scoring;
  const drawRequest = displayRoom.game.drawRequest;
  const soundMoveRef = useRef(null);
  const voiceRef = useRef({});
  const winnerColor = displayRoom.game.winner?.winnerColor ?? displayRoom.game.winner?.color;
  const skillPreview = displayRoom.game.pendingSkill;

  useEffect(() => {
    if (isReplay) return;
    const lastMove = [...displayRoom.game.history].reverse().find((entry) => entry.type === "move");
    if (!lastMove || soundMoveRef.current === lastMove.moveNumber) return;
    soundMoveRef.current = lastMove.moveNumber;
    playStoneSound(audioSettings);
  }, [displayRoom.game.history, isReplay, audioSettings]);

  useEffect(() => {
    if (isReplay || !activePlayer) return;
    const timer = activePlayer.time;
    const periodKey = `${activePlayer.color}-periods`;
    const mainKey = `${activePlayer.color}-main`;
    const previousPeriods = voiceRef.current[periodKey];
    const previousMain = voiceRef.current[mainKey];
    if (typeof previousMain === "number" && previousMain > 0 && timer.main <= 0) {
      speakText("开始读秒", audioSettings);
    }
    if (timer.main <= 0 && timer.periodRemaining <= 10 && timer.periodRemaining > 0) {
      const countdownKey = `${activePlayer.color}-${timer.periods}-${timer.periodRemaining}`;
      if (!voiceRef.current[countdownKey]) {
        voiceRef.current[countdownKey] = true;
        playCountdownBeep(timer.periodRemaining, audioSettings);
      }
    }
    if (typeof previousPeriods === "number" && timer.periods < previousPeriods) {
      speakText(`还剩${timer.periods}次读秒`, audioSettings);
    }
    voiceRef.current[mainKey] = timer.main;
    voiceRef.current[periodKey] = timer.periods;
  }, [activePlayer, isReplay, audioSettings]);

  function handlePoint(point) {
    if (isReplay) return;
    if (skillPreview) return;
    if (displayRoom.game.phase === "marking-dead") return handleScoringPoint(point);
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
              onPoint={handlePoint}
              onScoringPoint={displayRoom.game.phase === "marking-dead" ? handleScoringPoint : null}
              onNeutral={(id) => onScoringAction({ type: "mark-neutral", pointId: id })}
            />
          </div>
          <div className="status-slot">
            {isReplay && (
              <ReplayBar
                step={replayStep}
                max={room.game.history.length}
                onStep={setReplayStep}
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
            skillLocked={Boolean(skillPreview)}
            skillUses={me ? displayRoom.game.skillUses[me.color] ?? 0 : 0}
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
      {skillPreview && <SkillBanner banner={skillPreview} characters={characters} />}
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
          const hiddenClass = point.hiddenHand
            ? point.hiddenHand.exposed ? "hidden-hand exposed-hidden-hand" : "hidden-hand"
            : "";
          const skillEffectClass = point.skillEffect ?? "";
          return (
          <button
            key={point.id}
            className={`point ${point.valid ? "" : "erased"} ${point.stone ?? ""} ${hiddenClass} ${skillEffectClass} ${isStarPoint(point.x, point.y) ? "star" : ""}`}
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

function PlayerInfo({ player, game, characters, align, isWinner = false, isActiveTurn = false, isDrawResult = false, isSkillTargeting = false }) {
  if (!player) return <aside className="player-info empty" />;
  const character = findCharacter(characters, player.character ?? player.characterId);
  const skillUses = game.skillUses[player.color] ?? 0;
  const skillCost = game.skillCosts?.[player.color] ?? 0;
  return (
    <aside className={`player-info ${align} ${isWinner ? "winner" : ""} ${isActiveTurn ? "active-turn" : ""} ${isDrawResult ? "draw-result" : ""}`}>
      <img src={character.portrait} alt={character.name} />
      <div className="player-meta">
        <button className="name-button">{player.user.username}</button>
        <span>{player.user.rank} · {player.user.rating}</span>
        <span className={`color-badge ${player.color}`} title={player.color === COLORS.black ? "执黑" : "执白"} />
      </div>
      <TimeBar time={player.time} />
      <div className="captures">提子 {player.captures} · 代价 {skillCost}</div>
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

function ActionBar({ role, phase, me, isMyTurn, pendingSkill, setPendingSkill, skillLocked = false, skillUses, onPass, onCountingRequest, onDrawRequest, onResign, onBack }) {
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
      <button onClick={onDrawRequest} disabled={phase !== "playing" || skillLocked}>申请和棋</button>
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
  const stats = deriveHouseStats(user, records);
  const owned = new Set(user.ownedCharacters ?? []);
  const emptySlots = Array.from({ length: Math.max(0, 10 - characterListView.length) }, (_, index) => index);

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
          {characterListView.map((character) => (
            <div
              className={`character-card portrait-card ${user.selectedCharacter === character.id ? "selected" : ""}`}
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
              {!owned.has(character.id) && <span>未获得</span>}
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
          <section className="nested-modal character-detail">
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

function ShopModal({ token, user, onPurchased, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("character");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [purchasingId, setPurchasingId] = useState("");

  useEffect(() => {
    let alive = true;
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
  }, [token]);

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

function ResultModal({ room, characters, onClose }) {
  const winnerColor = room.game.winner?.winnerColor ?? room.game.winner?.color;
  const isDraw = !winnerColor;
  const winner = room.players.find((player) => player.color === winnerColor) ?? room.players[0];
  const character = findCharacter(characters, winner?.character ?? winner?.characterId);
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
          <button onClick={onClose}>确认</button>
        </div>
      </section>
    </div>
  );
}

function SkillBanner({ banner, characters }) {
  const character = findCharacter(characters, banner.character ?? banner.characterId);
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

function AdminFieldLabel({ text, tip }) {
  return <span className="admin-field-label" title={tip}>{text}</span>;
}

function formatSkillCost(skillOrCost) {
  if (skillOrCost && typeof skillOrCost === "object") {
    const costType = skillOrCost.costType ?? "numeric";
    const costValue = String(skillOrCost.costValue ?? skillOrCost.cost ?? 0);
    return costType === "numeric" ? `${costValue || 0}子` : costValue;
  }
  return typeof skillOrCost === "number" ? `${skillOrCost}子` : skillOrCost;
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
  if (text.startsWith("黑胜") || text.startsWith("黑中盘胜") || text.startsWith("黑超时胜")) return COLORS.black;
  if (text.startsWith("白胜") || text.startsWith("白中盘胜") || text.startsWith("白超时胜")) return COLORS.white;
  return null;
}

function buildUserDraft(user) {
  return {
    id: user.id,
    role: user.role ?? "player",
    rank: user.rank ?? "",
    rating: user.rating ?? 0,
    coins: user.coins ?? 0,
    ownedCharactersText: (user.ownedCharacters ?? []).join(", "),
    selectedCharacter: user.selectedCharacter ?? ""
  };
}

function emptyCharacterDraft() {
  return {
    dbId: "",
    originalSlug: "",
    slug: "",
    name: "",
    portraitUrl: "",
    portraitSource: "url",
    palette: "#5d7fe8",
    enabled: true,
    sortOrder: 0,
    skill: {
      effectType: "erase-point",
      name: "",
      description: "",
      uses: 1,
      freeTurn: false,
      targetRule: "empty-point",
      paramsJson: "{}",
      costType: "numeric",
      costValue: "0",
      systemMessage: "{color}{player}使用了{character}的“{skill}”技能，目标是{point}。"
    }
  };
}

function buildCharacterDraft(character) {
  const skill = character.skill ?? {};
  return {
    dbId: character.dbId ?? "",
    originalSlug: character.id ?? "",
    slug: character.id ?? "",
    name: character.name ?? "",
    portraitUrl: character.portrait ?? "",
    portraitSource: character.portraitSource ?? "url",
    palette: character.palette ?? "#5d7fe8",
    enabled: character.enabled ?? true,
    sortOrder: character.sortOrder ?? 0,
    skill: {
      effectType: skill.effectType ?? "erase-point",
      name: skill.name ?? "",
      description: skill.description ?? "",
      uses: skill.uses ?? 1,
      freeTurn: skill.freeTurn ?? false,
      targetRule: skill.targetRule ?? targetRuleForEffect(skill.effectType ?? "erase-point"),
      paramsJson: skill.paramsJson ?? JSON.stringify(skill.params ?? {}),
      costType: skill.costType ?? "numeric",
      costValue: String(skill.costValue ?? skill.cost ?? 0),
      systemMessage: skill.systemMessage ?? "{color}{player}使用了{character}的“{skill}”技能，目标是{point}。"
    }
  };
}

function characterDraftToBody(draft) {
  const sortOrder = parseAdminInteger(draft.sortOrder);
  const uses = parseAdminInteger(draft.skill.uses);
  if (sortOrder == null || uses == null || uses < 0 || uses > 9) return null;
  const costType = draft.skill.costType === "special" ? "special" : "numeric";
  const costValue = String(draft.skill.costValue ?? "").trim();
  if (costType === "numeric" && !/^-?\d+(\.\d+)?$/.test(costValue)) return null;
  if (costType === "special" && !costValue) return null;
  return {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    portraitUrl: draft.portraitUrl.trim(),
    portraitSource: draft.portraitSource,
    palette: draft.palette,
    enabled: Boolean(draft.enabled),
    sortOrder,
    skill: {
      effectType: draft.skill.effectType,
      name: draft.skill.name.trim(),
      description: draft.skill.description.trim(),
      uses,
      freeTurn: Boolean(draft.skill.freeTurn),
      targetRule: draft.skill.targetRule,
      paramsJson: draft.skill.paramsJson,
      costType,
      costValue,
      systemMessage: draft.skill.systemMessage.trim()
    }
  };
}

function emptyShopItemDraft() {
  return { id: "", name: "", category: "character", targetId: "", priceCoins: 100, discountPercent: 0, purchasable: true, enabled: true, sortOrder: 0, description: "", imageUrl: "" };
}

function buildShopItemDraft(item) {
  return { ...emptyShopItemDraft(), ...item };
}

function validateShopItemDraft(draft) {
  const priceCoins = parseAdminInteger(draft.priceCoins);
  const discountPercent = parseAdminInteger(draft.discountPercent);
  const sortOrder = parseAdminInteger(draft.sortOrder);
  const errors = [];
  if (!draft.name.trim()) errors.push("商品名");
  if (!draft.targetId.trim()) errors.push("目标标识");
  if (priceCoins == null || priceCoins < 0) errors.push("金币价格必须是 0 或更大的整数");
  if (discountPercent == null || discountPercent < 0 || discountPercent > 100) errors.push("折扣必须是 0 到 100 的整数");
  if (sortOrder == null) errors.push("排序必须是整数");
  if (errors.length) {
    return { ok: false, error: `请检查：${errors.join("、")}` };
  }
  return {
    ok: true,
    value: {
      name: draft.name.trim(),
      category: draft.category,
      targetId: draft.targetId.trim(),
      priceCoins,
      discountPercent,
      purchasable: Boolean(draft.purchasable),
      enabled: Boolean(draft.enabled),
      sortOrder,
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim()
    }
  };
}

function emptyDecorationDraft() {
  return { id: "", slug: "", name: "", description: "", imageUrl: "", enabled: true, sortOrder: 0 };
}

function buildDecorationDraft(decoration) {
  return { ...emptyDecorationDraft(), ...decoration };
}

function decorationDraftToBody(draft) {
  const sortOrder = parseAdminInteger(draft.sortOrder);
  if (!draft.slug.trim() || !draft.name.trim() || sortOrder == null) return null;
  return {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    imageUrl: draft.imageUrl.trim(),
    enabled: Boolean(draft.enabled),
    sortOrder
  };
}

function shopCategoryLabel(category) {
  return category === "decoration" ? "装饰" : "角色";
}

function targetRuleForEffect(effectType) {
  return effectType === "flip-stone" ? "stone" : "empty-point";
}

function parseAdminInteger(value) {
  const text = String(value ?? "").trim();
  if (!/^-?\d+$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isSafeInteger(number)) return null;
  if (number < -2147483648 || number > 2147483647) return null;
  return number;
}

function canPreviewSkill(game, player, point) {
  if (!player || game.phase !== "playing" || game.turn !== player.color) return false;
  if ((game.skillUses[player.color] ?? 0) <= 0) return false;
  if (!point?.valid) return false;
  const skill = player.character?.skill ?? CHARACTERS[player.characterId]?.skill;
  const effectType = skill?.effectType ?? skill?.id;
  if (effectType === "erase-point") return !point.stone;
  if (effectType === "flip-stone") return Boolean(point.stone);
  return false;
}

function findCharacter(characters, characterOrId) {
  const characterId = typeof characterOrId === "string" ? characterOrId : characterOrId?.id;
  const fallback = CHARACTERS[characterId] ?? CHARACTERS.sigrika;
  if (characterOrId && typeof characterOrId === "object") {
    return {
      ...fallback,
      ...characterOrId,
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

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const isHtml = text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html");
    throw new Error(isHtml ? "接口返回了前端页面而不是 JSON，请刷新页面并确认后端服务已启动。" : "接口返回格式不是 JSON。");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "请求失败");
  return data;
}

async function adminApi(path, token, options = {}) {
  return api(`/api/admin${path}`, { ...options, token });
}

async function uploadPortrait(file, token) {
  const form = new FormData();
  form.append("portrait", file);
  const response = await fetch(`${API_BASE}/api/admin/uploads/character-portrait`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "上传失败");
  return data.url;
}

function loadAudioSettings() {
  try {
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...JSON.parse(localStorage.getItem("sigrika-audio-settings") ?? "{}")
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

function audioVolume(settings, channel) {
  return Math.max(0, Math.min(1, ((settings?.master ?? DEFAULT_AUDIO_SETTINGS.master) / 100) * ((settings?.[channel] ?? 100) / 100)));
}

function playStoneSound(audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(260, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(95, context.currentTime + 0.08);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22 * volume, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.13);
}

function playCountdownBeep(second, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "sfx");
  if (volume <= 0) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = second <= 3 ? "square" : "sine";
  oscillator.frequency.setValueAtTime(second <= 3 ? 880 : 620, context.currentTime);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime((second <= 3 ? 0.2 : 0.13) * volume, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.11);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}

function speakText(text, audioSettings = DEFAULT_AUDIO_SETTINGS) {
  const volume = audioVolume(audioSettings, "voice");
  if (volume <= 0) return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.05;
  utterance.volume = volume;
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
      result = useSkill(game, entry.color, player?.character?.skill ?? player?.characterId, entry.id);
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



