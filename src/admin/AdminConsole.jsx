import React, { useEffect, useState } from "react";
import { adminApi } from "../api/client.js";
import AdminShell from "./AdminShell.jsx";
import AdminAudit from "./AdminAudit.jsx";
import AdminCharacters from "./AdminCharacters.jsx";
import AdminDecorations from "./AdminDecorations.jsx";
import AdminFeedback from "./AdminFeedback.jsx";
import AdminOverview from "./AdminOverview.jsx";
import AdminShopItems from "./AdminShopItems.jsx";
import AdminSiteSettings from "./AdminSiteSettings.jsx";
import AdminUsers, { UserEditor } from "./AdminUsers.jsx";

export default function AdminConsole({ user, token, tab, setTab, onCurrentUserChange, onCharactersChanged, onSiteSettingsChanged, onNotice, onBack, onOpenReplay }) {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [adminCharacters, setAdminCharacters] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [decorations, setDecorations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminError, setAdminError] = useState("");

  function notify(message, tone = "danger") {
    if (onNotice) onNotice(message, tone);
    else setAdminError(message);
  }

  useEffect(() => {
    if (tab !== "overview") return;
    setAdminError("");
    adminApi("/summary", token)
      .then(setSummary)
      .catch((error) => notify(error.message));
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
    if (tab !== "feedback") return;
    refreshFeedbackMessages();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "shop" && tab !== "items") return;
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
      notify(error.message);
    }
  }

  async function refreshCharacters() {
    setAdminError("");
    try {
      const data = await adminApi("/characters", token);
      setAdminCharacters(data.characters ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshAuditLogs() {
    setAdminError("");
    try {
      const data = await adminApi("/audit-logs", token);
      setAuditLogs(data.auditLogs ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshFeedbackMessages() {
    setAdminError("");
    try {
      const data = await adminApi("/feedback", token);
      setFeedbackMessages(data.feedbackMessages ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshShopItems() {
    setAdminError("");
    try {
      const data = await adminApi("/shop-items", token);
      setShopItems(data.items ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshDecorations() {
    setAdminError("");
    try {
      const data = await adminApi("/decorations", token);
      setDecorations(data.decorations ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <AdminShell user={user} tab={tab} setTab={setTab} onBack={onBack} error={adminError}>
      {tab === "overview" && <AdminOverview summary={summary} />}
      {tab === "users" && (
        <>
          <AdminUsers users={users} onSelect={setSelectedUser} />
          {selectedUser && (
            <UserEditor
              user={selectedUser}
              currentUserId={user.id}
              token={token}
              onClose={() => setSelectedUser(null)}
              onRefresh={refreshUsers}
              onCurrentUserChange={onCurrentUserChange}
              onNotice={notify}
              onOpenReplay={onOpenReplay}
            />
          )}
        </>
      )}
      {tab === "characters" && (
        <AdminCharacters
          characters={adminCharacters}
          token={token}
          onSaved={async () => {
            await refreshCharacters();
            await onCharactersChanged();
          }}
          onNotice={notify}
        />
      )}
      {tab === "shop" && (
        <AdminShopItems items={shopItems} token={token} onSaved={refreshShopItems} onClearError={() => setAdminError("")} onNotice={notify} />
      )}
      {tab === "items" && (
        <AdminShopItems
          items={shopItems.filter((item) => item.category === "item")}
          token={token}
          onSaved={refreshShopItems}
          onClearError={() => setAdminError("")}
          onNotice={notify}
          fixedCategory="item"
          title="道具管理"
          metaSuffix="个道具"
        />
      )}
      {tab === "decorations" && (
        <AdminDecorations decorations={decorations} token={token} onSaved={refreshDecorations} onNotice={notify} />
      )}
      {tab === "settings" && <AdminSiteSettings token={token} onSaved={onSiteSettingsChanged} onNotice={notify} />}
      {tab === "feedback" && <AdminFeedback messages={feedbackMessages} />}
      {tab === "audit" && <AdminAudit logs={auditLogs} />}
    </AdminShell>
  );
}

