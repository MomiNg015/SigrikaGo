import WindowLoadingState from "./WindowLoadingState.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Award, MonitorPlay, Palette } from "lucide-react";
import { api } from "../api/client.js";
import ProfileTablet from "./ProfileTablet.jsx";
import ProfileResumeView, { orderedProfileModes } from "./ProfileResumeView.jsx";
import { useReplayPagination } from "./useReplayPagination.js";
import { PROFILE_CUSTOMIZATION_ENABLED } from "../shared/profileFeatures.js";

export default function ResumeModal({ user, token, characterListView, onClose, onOpenAchievements, onOpenPersonalization, onOpenReplay }) {
  const [mode, setMode] = useState("spark");
  const [requestedMode, setRequestedMode] = useState("spark");
  const [requestNonce, setRequestNonce] = useState(0);
  const [failedMode, setFailedMode] = useState("");
  const [showReplays, setShowReplays] = useState(false);
  const [replayMode, setReplayMode] = useState("spark");
  const [profilesByKey, setProfilesByKey] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const profileCacheRef = useRef(new Map());
  const pendingRequestsRef = useRef(new Map());
  const requestSequenceRef = useRef(0);
  const profileKey = `${user.id}:${mode}`;
  const requestKey = `${user.id}:${requestedMode}`;
  const profile = profilesByKey[profileKey] ?? null;
  const modeFallback = useMemo(() => userForMode(user, mode), [mode, user]);
  const modeUser = profile ? { ...user, ...profile, itemEffects: user.itemEffects ?? profile.itemEffects } : modeFallback;
  const stats = profile?.recordStats
    ? { ...profile.recordStats, rating: profile.rating }
    : modeRecordStats(user, mode);
  const characterStats = profile?.characterStats ?? [];
  const replayPagination = useReplayPagination({
    enabled: showReplays,
    endpoint: `/api/replays?mode=${encodeURIComponent(replayMode)}${replayMode === "team" ? "" : "&scope=regular"}`,
    token
  });

  useEffect(() => {
    requestSequenceRef.current += 1;
    setMode("spark");
    setRequestedMode("spark");
    setFailedMode("");
    setProfileError("");
    setProfileLoading(false);
  }, [user.id]);

  useEffect(() => {
    if (!token || !user.id) return undefined;
    const requestedUserId = user.id;
    const requestedModeId = requestedMode;
    const sequence = ++requestSequenceRef.current;
    const cachedProfile = profileCacheRef.current.get(requestKey);
    if (cachedProfile) {
      setProfilesByKey((current) => current[requestKey] ? current : { ...current, [requestKey]: cachedProfile });
      setMode(requestedModeId);
      setFailedMode("");
      setProfileError("");
      setProfileLoading(false);
      return undefined;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError("");
    setFailedMode("");
    let request = pendingRequestsRef.current.get(requestKey);
    if (!request) {
      request = api(`/api/users/${requestedUserId}/profile?mode=${encodeURIComponent(requestedModeId)}`, { token });
      pendingRequestsRef.current.set(requestKey, request);
    }

    request
      .then((data) => {
        const nextProfile = data.profile ?? null;
        if (!nextProfile) return;
        profileCacheRef.current.set(requestKey, nextProfile);
        if (!active || requestSequenceRef.current !== sequence || user.id !== requestedUserId) return;
        setProfilesByKey((current) => ({ ...current, [requestKey]: nextProfile }));
        setMode(requestedModeId);
        setFailedMode("");
      })
      .catch((error) => {
        if (active && requestSequenceRef.current === sequence && user.id === requestedUserId) {
          setFailedMode(requestedModeId);
          setProfileError(error.message);
        }
      })
      .finally(() => {
        if (pendingRequestsRef.current.get(requestKey) === request) {
          pendingRequestsRef.current.delete(requestKey);
        }
        if (active && requestSequenceRef.current === sequence) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestKey, requestNonce, requestedMode, token, user.id]);

  function changeMode(nextMode) {
    if (profileLoading || nextMode === mode) return;
    if (nextMode === requestedMode && profileError) {
      setRequestNonce((value) => value + 1);
      return;
    }
    setRequestedMode(nextMode);
  }

  function retryFailedMode() {
    if (!failedMode || profileLoading) return;
    if (failedMode === requestedMode) setRequestNonce((value) => value + 1);
    else setRequestedMode(failedMode);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <ProfileTablet
        className="house-modal resume-modal profile-dossier-modal profile-folder-modal window-bookmark-host"
        title="履历"
        titleId="resume-modal-title"
        closeLabel="关闭履历"
        onClose={onClose}
        studentEntry
        replay={showReplays ? { characters: characterListView, currentUser: modeUser, onOpenReplay, pagination: replayPagination } : null}
        onCloseReplay={() => setShowReplays(false)}
        screenActions={(
          <div className="profile-identity-actions" role="group" aria-label="履历操作">
            <button data-button-role="tool" type="button" className="resume-mini-action achievement-entry-action" aria-label="成就" title={PROFILE_CUSTOMIZATION_ENABLED ? "成就" : "成就暂未开放"} disabled={!PROFILE_CUSTOMIZATION_ENABLED} onClick={onOpenAchievements}>
              <Award size={20} aria-hidden="true" />
              <span>成就</span>
            </button>
            <button data-button-role="tool" type="button" className="resume-mini-action profile-personalization-button personalization-entry-action" aria-label="个性化" title={PROFILE_CUSTOMIZATION_ENABLED ? "个性化" : "个性化暂未开放"} disabled={!PROFILE_CUSTOMIZATION_ENABLED} onClick={onOpenPersonalization}>
              <Palette size={20} aria-hidden="true" />
              <span>个性化</span>
            </button>
          </div>
        )}
      >
        <ProfileResumeView
          token={token}
          onOpenReplay={onOpenReplay}
          context="self"
          user={modeUser}
          characters={characterListView}
          mode={mode}
          modePending={profileLoading}
          onModeChange={changeMode}
          stats={stats}
          recentResults={modeUser.recentResults}
          characterStats={characterStats}
          recentAction={(
            <button data-button-role="tool" className="profile-replay-button resume-replay-action" type="button" aria-label="对局回放" title="对局回放" onClick={() => { setReplayMode(mode); setShowReplays(true); }}>
              <MonitorPlay size={18} aria-hidden="true" />
              <span>对局回放</span>
            </button>
          )}
          status={(profileLoading || profileError) ? (
            <div className="profile-mode-feedback">
              {profileLoading && (
                <WindowLoadingState compact>
                  正在载入{profileModeTitle(requestedMode)}战绩，当前仍显示{profileModeTitle(mode)}。
                </WindowLoadingState>
              )}
              {profileError && (
                <>
                  <p className="room-people-error" role="alert">{profileError}</p>
                  <button data-button-role="tool" type="button" className="profile-retry-button" onClick={retryFailedMode}>重新加载</button>
                </>
              )}
            </div>
          ) : null}
        />

      </ProfileTablet>
    </div>
  );
}

function profileModeTitle(mode) {
  if (mode === "team") return "队际赛";
  return orderedProfileModes().find((entry) => entry.id === mode)?.shortTitle ?? "当前模式";
}

function modeRecordStats(user, mode) {
  const stats = user.modeStats?.[mode] ?? {};
  const wins = Number(stats.wins ?? 0);
  const losses = Number(stats.losses ?? 0);
  const draws = Number(stats.draws ?? 0);
  return {
    totalGames: wins + losses + draws,
    wins,
    losses,
    draws,
    rating: Number(stats.rating ?? user.rating ?? 1000)
  };
}

function userForMode(user, mode) {
  const stats = user.modeStats?.[mode];
  if (!stats) return user;
  return {
    ...user,
    rating: stats.rating,
    stars: stats.stars ?? 2,
    rank: stats.rank ?? user.rank ?? "3段",
    recentResults: stats.recentResults ?? [],
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws
  };
}
