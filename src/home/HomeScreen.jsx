import { useState } from "react";
import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { modeOrderedEntries } from "../shared/gameModes.js";
import { UsersRound } from "lucide-react";
import HomeFooter from "./components/HomeFooter.jsx";
import HomeHeader from "./components/HomeHeader.jsx";
import HomeStage from "./components/HomeStage.jsx";
import { HomeActionButton } from "./homeComponents.jsx";
import MatchModeRuleText from "./MatchModeRuleText.jsx";
import MatchModeWatermark from "./MatchModeWatermark.jsx";

export default function HomeScreen({ user, characters, siteSettings = DEFAULT_SITE_SETTINGS, lobbyStats = {}, recruitmentReady = false, mailboxBadgeCount = 0, announcementUnread = false, matchModePickerOpen = false, onMatchModePickerOpenChange, onLogout, onStartMatch, onStartPractice, onOpenMatch, onPreloadPlayableReady, onOpenHouse, onOpenResume, onOpenWarehouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenRecruitment, onOpenFriends, onOpenSettings, onOpenAnnouncements, onOpenMailbox, onOpenMessageBoard, onOpenOnboardingStory, onOpenAdmin }) {
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
            onPracticeStart={(options) => {
              onMatchModePickerOpenChange?.(false);
              onStartPractice?.(options);
            }}
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

function MatchModePicker({ matchmakingCounts, onClose, onPreloadPlayableReady, onPracticeStart, onSelect }) {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [difficulty, setDifficulty] = useState("beginner");
  const [playerColor, setPlayerColor] = useState("random");
  return (
    <div className="modal-backdrop match-mode-backdrop" onClick={onClose}>
      <section className="small-modal match-mode-modal" onClick={(event) => event.stopPropagation()} aria-label="选择对弈模式">
        <h2>{practiceOpen ? "准时宝对弈" : "选择对弈模式"}</h2>
        {practiceOpen ? (
          <div className="practice-setup" aria-label="人机练习设置">
            <p className="practice-setup-note">人机练习 · 不计成长 · 不保存棋谱</p>
            <fieldset>
              <legend>难度</legend>
              <label><input type="radio" name="practice-difficulty" value="beginner" checked={difficulty === "beginner"} onChange={(event) => setDifficulty(event.target.value)} />入门</label>
              <label><input type="radio" name="practice-difficulty" value="basic" checked={difficulty === "basic"} onChange={(event) => setDifficulty(event.target.value)} />基础</label>
            </fieldset>
            <fieldset>
              <legend>玩家执色</legend>
              {[{ value: "black", label: "黑" }, { value: "white", label: "白" }, { value: "random", label: "随机" }].map((option) => (
                <label key={option.value}><input type="radio" name="practice-color" value={option.value} checked={playerColor === option.value} onChange={(event) => setPlayerColor(event.target.value)} />{option.label}</label>
              ))}
            </fieldset>
            <div className="practice-setup-actions">
              <HomeActionButton variant="secondary" type="button" onClick={() => setPracticeOpen(false)}>返回</HomeActionButton>
              <HomeActionButton variant="primary" type="button" onClick={() => onPracticeStart({ difficulty, playerColor })}>开始练习</HomeActionButton>
            </div>
          </div>
        ) : (
          <>
            <div className="match-mode-options">
              {modeOrderedEntries().map((mode) => (
                <div className={`match-mode-option-wrap ${mode.id === "spark" ? "has-practice-entry" : ""}`} key={mode.id}>
                  <button
                    className="match-mode-option"
                    type="button"
                    onFocus={() => onPreloadPlayableReady?.(mode.id)}
                    onPointerEnter={() => onPreloadPlayableReady?.(mode.id)}
                    onClick={() => onSelect(mode.id)}
                  >
                    <MatchModeWatermark mode={mode} />
                    <span className="match-mode-copy">
                      <strong>{mode.title}</strong>
                      <MatchModeRuleText rulesText={mode.rulesText} />
                    </span>
                    <span className="match-mode-count" aria-label={`匹配中 ${Number(matchmakingCounts[mode.id] ?? 0)} 人`}>
                      <UsersRound size={16} aria-hidden="true" />
                      <b>{Number(matchmakingCounts[mode.id] ?? 0)}</b>
                    </span>
                  </button>
                  {mode.id === "spark" && (
                    <button className="practice-entry-button" type="button" onClick={() => setPracticeOpen(true)}>准时宝对弈</button>
                  )}
                </div>
              ))}
            </div>
            <HomeActionButton variant="secondary" type="button" onClick={onClose}>取消</HomeActionButton>
          </>
        )}
      </section>
    </div>
  );
}
