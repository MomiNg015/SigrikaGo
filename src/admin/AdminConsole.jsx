import React, { useEffect, useState } from "react";
import { adminApi } from "../api/client.js";
import "../styles/admin.css";
import AdminShell from "./AdminShell.jsx";
import AdminAudit from "./AdminAudit.jsx";
import AdminAchievements from "./AdminAchievements.jsx";
import AdminAnnouncements from "./AdminAnnouncements.jsx";
import AdminCharacters from "./AdminCharacters.jsx";
import AdminDecorations from "./AdminDecorations.jsx";
import AdminFeedback from "./AdminFeedback.jsx";
import AdminGachaPools from "./AdminGachaPools.jsx";
import AdminMailbox from "./AdminMailbox.jsx";
import AdminMusicTracks from "./AdminMusicTracks.jsx";
import AdminOnboardingStory from "./AdminOnboardingStory.jsx";
import AdminOverview from "./AdminOverview.jsx";
import AdminOperations from "./AdminOperations.jsx";
import AdminRecruitmentSettings from "./AdminRecruitmentSettings.jsx";
import AdminReports from "./AdminReports.jsx";
import AdminShopItems from "./AdminShopItems.jsx";
import AdminSiteSettings from "./AdminSiteSettings.jsx";
import AdminUsers, { UserEditor } from "./AdminUsers.jsx";

export default function AdminConsole({ user, token, tab, setTab, musicTracks, onCurrentUserChange, onCharactersChanged, onMusicTracksChanged, onSiteSettingsChanged, onNotice, onBack, onOpenReplay }) {
  const [overviewData, setOverviewData] = useState(null);
  const [operationsData, setOperationsData] = useState(null);
  const [operationsRange, setOperationsRange] = useState("7d");
  const [adminLoading, setAdminLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [adminCharacters, setAdminCharacters] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [feedbackMessages, setFeedbackMessages] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [decorations, setDecorations] = useState([]);
  const [gachaPools, setGachaPools] = useState([]);
  const [mailboxBatches, setMailboxBatches] = useState([]);
  const [achievementData, setAchievementData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminError, setAdminError] = useState("");

  function notify(message, tone = "danger") {
    if (onNotice) onNotice(message, tone);
    else setAdminError(message);
  }

  useEffect(() => {
    if (tab !== "overview") return;
    refreshOverview();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "operations") return;
    refreshOperations();
  }, [tab, token, operationsRange]);

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
    if (tab !== "reports") return;
    refreshUserReports();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "shop" && tab !== "items") return;
    refreshShopItems();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "decorations") return;
    refreshDecorations();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "music") return;
    refreshMusicTracks();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "gacha") return;
    refreshGachaContext();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "achievements") return;
    refreshAchievements();
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "onboarding") return;
    Promise.all([refreshCharacters(), refreshShopItems()]);
  }, [tab, token]);

  useEffect(() => {
    if (tab !== "mailbox") return;
    refreshMailboxContext();
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

  async function refreshOverview() {
    setAdminError("");
    setAdminLoading(true);
    try {
      setOverviewData(await adminApi("/analytics/overview", token));
    } catch (error) {
      notify(error.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function refreshOperations() {
    setAdminError("");
    setAdminLoading(true);
    try {
      setOperationsData(await adminApi(`/analytics/operations?range=${encodeURIComponent(operationsRange)}`, token));
    } catch (error) {
      notify(error.message);
    } finally {
      setAdminLoading(false);
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

  async function refreshUserReports() {
    setAdminError("");
    try {
      const data = await adminApi("/user-reports", token);
      setUserReports(data.reports ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshMusicTracks() {
    setAdminError("");
    try {
      await onMusicTracksChanged?.();
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshGachaPools() {
    setAdminError("");
    try {
      const data = await adminApi("/gacha-pools", token);
      setGachaPools(data.pools ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshGachaContext() {
    await Promise.all([
      refreshGachaPools(),
      refreshCharacters(),
      refreshDecorations(),
      refreshShopItems(),
      refreshMusicTracks()
    ]);
  }

  async function refreshAchievements() {
    setAdminError("");
    try {
      const data = await adminApi("/achievements", token);
      setAchievementData(data);
    } catch (error) {
      notify(error.message);
    }
  }

  async function refreshMailboxContext() {
    setAdminError("");
    try {
      const [batchData] = await Promise.all([
        adminApi("/mailbox/batches", token),
        refreshShopItems()
      ]);
      setMailboxBatches(batchData.batches ?? []);
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <AdminShell user={user} tab={tab} setTab={setTab} onBack={onBack} error={adminError}>
      {tab === "overview" && (
        <AdminOverview
          data={overviewData}
          loading={adminLoading && !overviewData}
          onRefresh={refreshOverview}
          onNavigate={setTab}
        />
      )}
      {tab === "operations" && (
        <AdminOperations
          data={operationsData}
          loading={adminLoading && !operationsData}
          range={operationsRange}
          onRangeChange={setOperationsRange}
          onRefresh={refreshOperations}
          onNavigate={setTab}
        />
      )}
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
      {tab === "music" && (
        <AdminMusicTracks tracks={musicTracks} token={token} onSaved={refreshMusicTracks} onNotice={notify} />
      )}
      {tab === "gacha" && (
        <AdminGachaPools
          pools={gachaPools}
          token={token}
          resourceCatalogs={{
            characters: adminCharacters,
            decorations,
            items: shopItems.filter((item) => item.category === "item"),
            musicTracks
          }}
          onSaved={refreshGachaContext}
          onNotice={notify}
        />
      )}
      {tab === "recruitment" && <AdminRecruitmentSettings token={token} onNotice={notify} />}
      {tab === "announcements" && <AdminAnnouncements token={token} onNotice={notify} />}
      {tab === "onboarding" && <AdminOnboardingStory token={token} characters={adminCharacters} items={shopItems.filter((item) => item.category === "item")} onNotice={notify} />}
      {tab === "mailbox" && (
        <AdminMailbox
          token={token}
          initialLoaded
          initialBatches={mailboxBatches}
          shopItems={shopItems.filter((item) => item.category === "item")}
          onNotice={notify}
        />
      )}
      {tab === "achievements" && (
        <AdminAchievements
          data={achievementData}
          token={token}
          onSaved={refreshAchievements}
          onNotice={notify}
        />
      )}
      {tab === "settings" && <AdminSiteSettings token={token} onSaved={onSiteSettingsChanged} onNotice={notify} />}
      {tab === "feedback" && <AdminFeedback messages={feedbackMessages} />}
      {tab === "reports" && <AdminReports reports={userReports} />}
      {tab === "audit" && <AdminAudit logs={auditLogs} />}
    </AdminShell>
  );
}

