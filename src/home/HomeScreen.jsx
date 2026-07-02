import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { modeOrderedEntries } from "../shared/gameModes.js";
import HomeFooter from "./components/HomeFooter.jsx";
import HomeHeader from "./components/HomeHeader.jsx";
import HomeStage from "./components/HomeStage.jsx";
import { HomeActionButton } from "./homeComponents.jsx";
import MatchModeRuleText from "./MatchModeRuleText.jsx";

export default function HomeScreen({ user, characters, siteSettings = DEFAULT_SITE_SETTINGS, lobbyStats = {}, recruitmentReady = false, mailboxBadgeCount = 0, announcementUnread = false, matchModePickerOpen = false, onMatchModePickerOpenChange, onLogout, onStartMatch, onOpenMatch, onPreloadPlayableReady, onOpenHouse, onOpenResume, onOpenWarehouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenRecruitment, onOpenFriends, onOpenSettings, onOpenAnnouncements, onOpenMailbox, onOpenMessageBoard, onOpenOnboardingStory, onOpenAdmin }) {
  const selectedCharacter = characters[user.selectedCharacter] ?? CHARACTERS[user.selectedCharacter] ?? CHARACTERS.sigrika;
  const onlineCount = Number(lobbyStats.onlineCount ?? 0);
  const matchmakingCounts = Object.fromEntries(modeOrderedEntries().map((mode) => [
    mode.id,
    Number(lobbyStats.matchmakingCounts?.[mode.id] ?? (mode.id === "spark" ? lobbyStats.matchmakingCount : 0) ?? 0)
  ]));

  return (
    <>
      <main className="home-screen home-terminal-screen">
        <HomeHeader
          isAdmin={user.role === "admin"}
          onlineCount={onlineCount}
          siteSubtitle={siteSettings.homeSubtitle}
          siteTitle={siteSettings.homeTitle}
          mailboxBadgeCount={mailboxBadgeCount}
          announcementUnread={announcementUnread}
          onLogout={onLogout}
          onOpenAdmin={onOpenAdmin}
          onOpenAnnouncements={onOpenAnnouncements}
          onOpenMailbox={onOpenMailbox}
          onOpenMessageBoard={onOpenMessageBoard}
          onOpenOnboardingStory={onOpenOnboardingStory}
          onOpenSettings={onOpenSettings}
        />

        <section className="home-main-panel home-terminal-main">
          <HomeStage
            selectedCharacter={selectedCharacter}
            user={user}
            onOpenFriends={onOpenFriends}
            onOpenHouse={onOpenHouse}
            onOpenResume={onOpenResume}
            onOpenLeaderboard={onOpenLeaderboard}
            onOpenShop={onOpenShop}
            recruitmentReady={recruitmentReady}
            onOpenRecruitment={onOpenRecruitment}
            onOpenWarehouse={onOpenWarehouse}
            onOpenWatch={onOpenWatch}
            onPreloadPlayableReady={onPreloadPlayableReady}
            onStartMatch={() => {
              onPreloadPlayableReady?.();
              onOpenMatch?.();
              onMatchModePickerOpenChange?.(true);
            }}
          />
        </section>

        {matchModePickerOpen && (
          <MatchModePicker
            matchmakingCounts={matchmakingCounts}
            onClose={() => onMatchModePickerOpenChange?.(false)}
            onPreloadPlayableReady={onPreloadPlayableReady}
            onSelect={(mode) => {
              onMatchModePickerOpenChange?.(false);
              onStartMatch(mode);
            }}
          />
        )}

      </main>
      <HomeFooter footerText={siteSettings.footerText} siteTitle={siteSettings.homeTitle} />
    </>
  );
}

function MatchModePicker({ matchmakingCounts, onClose, onPreloadPlayableReady, onSelect }) {
  return (
    <div className="modal-backdrop match-mode-backdrop" onClick={onClose}>
      <section className="small-modal match-mode-modal" onClick={(event) => event.stopPropagation()} aria-label="选择对弈模式">
        <h2>选择对弈模式</h2>
        <div className="match-mode-options">
          {modeOrderedEntries().map((mode) => (
            <button
              className="match-mode-option"
              type="button"
              key={mode.id}
              onFocus={() => onPreloadPlayableReady?.(mode.id)}
              onPointerEnter={() => onPreloadPlayableReady?.(mode.id)}
              onClick={() => onSelect(mode.id)}
            >
              <span className="match-mode-copy">
                <strong>{mode.title}</strong>
                <MatchModeRuleText rulesText={mode.rulesText} />
              </span>
              <span className="match-mode-count">
                <b>{Number(matchmakingCounts[mode.id] ?? 0)}</b>
                <small>匹配中</small>
              </span>
            </button>
          ))}
        </div>
        <HomeActionButton variant="secondary" type="button" onClick={onClose}>取消</HomeActionButton>
      </section>
    </div>
  );
}
