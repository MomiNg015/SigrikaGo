import WindowTitleSticker from "../modals/WindowTitleSticker.jsx";
import { useState } from "react";
import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { modeOrderedEntries } from "../shared/gameModes.js";
import { PRACTICE_DIFFICULTY_OPTIONS } from "../shared/practiceMode.js";
import { UsersRound } from "lucide-react";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import { ModalDialog } from "../modals/modalComponents.jsx";
import HomeFooter from "./components/HomeFooter.jsx";
import HomeHeader from "./components/HomeHeader.jsx";
import HomeStage from "./components/HomeStage.jsx";
import PlayerPlaque from "./components/PlayerPlaque.jsx";
import { HomeActionButton } from "./homeComponents.jsx";
import IrisDatabase from "./IrisDatabase.jsx";
import MatchModeRuleText from "./MatchModeRuleText.jsx";
import MatchModeWatermark from "./MatchModeWatermark.jsx";
import {
  SIGRIKA_CANDY_DUEL_AVAILABILITY,
  SIGRIKA_CANDY_PHASES
} from "../shared/sigrikaCandyArc.js";
import { useSigrikaCandyDuelAvailability } from "./useSigrikaCandyDuelAvailability.js";

export default function HomeScreen({ user, characters, audioSettings, siteSettings = DEFAULT_SITE_SETTINGS, lobbyStats = {}, recruitmentReady = false, mailboxBadgeCount = 0, announcementUnread = false, matchModePickerOpen = false, socket, onNotice, onMatchModePickerOpenChange, onLogout, onStartMatch, onStartPractice, onStartSigrikaDuel, onOpenMatch, onPreloadPlayableReady, onOpenHouse, onOpenResume, onOpenWarehouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenRecruitment, onOpenFriends, onOpenSettings, onOpenAnnouncements, onOpenMailbox, onOpenMessageBoard, onOpenOnboardingStory, onOpenAdmin }) {
  const selectedCharacter = characters[user.selectedCharacter] ?? CHARACTERS[user.selectedCharacter] ?? CHARACTERS.sigrika;
  const sigrikaCorrupted = Boolean(user.sigrikaCandyArc?.corrupted);
  const sigrikaDuelActive = user.sigrikaCandyArc?.phase === SIGRIKA_CANDY_PHASES.duelActive;
  const {
    availability: sigrikaDuelAvailability,
    setAvailability: setSigrikaDuelAvailability,
    watch: watchSigrikaDuel,
    watchPending: sigrikaDuelWatchPending
  } = useSigrikaCandyDuelAvailability({
    enabled: sigrikaCorrupted,
    ownerActive: sigrikaDuelActive,
    pickerOpen: matchModePickerOpen,
    socket,
    onNotice,
    onPreloadPlayableReady
  });
  const matchmakingCounts = Object.fromEntries(modeOrderedEntries().map((mode) => [
    mode.id,
    Number(lobbyStats.matchmakingCounts?.[mode.id] ?? (mode.id === "spark" ? lobbyStats.matchmakingCount : 0) ?? 0)
  ]));

  return (
    <>
      <main className={`home-screen home-terminal-screen${sigrikaCorrupted ? " is-sigrika-corrupted-home" : ""}`}>
        <HomeHeader
          isAdmin={user.role === "admin"}
          sigrikaCorrupted={sigrikaCorrupted}
          siteTitle={siteSettings.homeTitle}
          siteVersion={siteSettings.homeVersion}
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
          <PlayerPlaque character={selectedCharacter} user={user} onOpenResume={onOpenResume} disabled={sigrikaCorrupted} />
          <HomeStage
            sigrikaCorrupted={sigrikaCorrupted}
            onOpenFriends={onOpenFriends}
            onOpenHouse={onOpenHouse}
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
            sigrikaCorrupted={sigrikaCorrupted}
            sigrikaDuelAvailability={sigrikaDuelAvailability}
            sigrikaDuelWatchPending={sigrikaDuelWatchPending}
            matchmakingCounts={matchmakingCounts}
            onClose={() => onMatchModePickerOpenChange?.(false)}
            onPreloadPlayableReady={onPreloadPlayableReady}
            onPracticeStart={(options) => {
              onMatchModePickerOpenChange?.(false);
              onStartPractice?.(options);
            }}
            onStartSigrikaDuel={(intent = "start") => {
              if (intent === "watch") {
                watchSigrikaDuel();
                return;
              }
              onMatchModePickerOpenChange?.(false);
              onStartSigrikaDuel?.({
                onStatusChange: (status) => {
                  setSigrikaDuelAvailability(status);
                  if (status === SIGRIKA_CANDY_DUEL_AVAILABILITY.occupied) {
                    onMatchModePickerOpenChange?.(true);
                  }
                }
              });
            }}
            onSelect={(mode) => {
              onMatchModePickerOpenChange?.(false);
              onStartMatch(mode);
            }}
          />
        )}

        {!sigrikaCorrupted && <IrisDatabase
          audioSettings={audioSettings}
          greeting={siteSettings.irisGreeting}
          links={siteSettings.irisLinks}
        />}
      </main>
      <HomeFooter disabled={sigrikaCorrupted} footerText={siteSettings.footerText} siteTitle={siteSettings.homeTitle} />
    </>
  );
}

function MatchModePicker({ matchmakingCounts, onClose, onPreloadPlayableReady, onPracticeStart, onSelect, onStartSigrikaDuel, sigrikaCorrupted = false, sigrikaDuelAvailability = SIGRIKA_CANDY_DUEL_AVAILABILITY.available, sigrikaDuelWatchPending = false }) {
  const [practiceDifficultyOpen, setPracticeDifficultyOpen] = useState(false);
  const [sigrikaDuelConfirmOpen, setSigrikaDuelConfirmOpen] = useState(false);
  const sigrikaDuelOccupied = sigrikaDuelAvailability === SIGRIKA_CANDY_DUEL_AVAILABILITY.occupied;
  const sigrikaDuelOwned = sigrikaDuelAvailability === SIGRIKA_CANDY_DUEL_AVAILABILITY.owned;

  return (
    <div
      className="modal-backdrop match-mode-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={`small-modal match-mode-modal ${sigrikaCorrupted ? "is-sigrika-corrupted" : "window-sticker-host"}`} onClick={(event) => event.stopPropagation()} aria-label="选择对弈模式">
        <WindowTitleSticker titleKey="match-mode" enabled={!sigrikaCorrupted} />
        <div className="match-mode-options">
          {modeOrderedEntries().map((mode) => (
            <div className={`match-mode-option-wrap ${mode.id === "spark" ? "has-practice-entry" : ""}`} key={mode.id}>
              <button
                className="match-mode-option"
                disabled={sigrikaCorrupted}
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
                <button
                  aria-label="准时宝陪练"
                  className="practice-entry-button"
                  type="button"
                  disabled={sigrikaCorrupted}
                  onClick={() => setPracticeDifficultyOpen(true)}
                >
                  <img
                    src="/assets/home/home-practice-zhunshibao.webp"
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                  />
                </button>
              )}
            </div>
          ))}
        </div>
        {sigrikaCorrupted && (
          <button
            aria-busy={sigrikaDuelWatchPending || undefined}
            className={`sigrika-corruption-duel-button${sigrikaDuelOccupied ? " is-spectate" : ""}`}
            disabled={sigrikaDuelWatchPending}
            type="button"
            onClick={() => {
              if (sigrikaDuelOccupied) {
                onStartSigrikaDuel("watch");
                return;
              }
              if (sigrikaDuelOwned) {
                onStartSigrikaDuel("start");
                return;
              }
              setSigrikaDuelConfirmOpen(true);
            }}
          >
            {sigrikaDuelOccupied
              ? "西格莉卡？正在对局中。。。"
              : sigrikaDuelOwned
                ? "继续与西格莉卡？决战"
                : "与西格莉卡？决战"}
          </button>
        )}
        <HomeActionButton variant="secondary" type="button" onClick={onClose}>取消</HomeActionButton>
        {practiceDifficultyOpen && (
          <PracticeDifficultyDialog
            onClose={() => setPracticeDifficultyOpen(false)}
            onSelect={(difficulty) => onPracticeStart({
              difficulty,
              playerColor: "random"
            })}
          />
        )}
      </section>
      {sigrikaDuelConfirmOpen && (
        <ConfirmModal
          title="确认参与决战"
          message="本对局为高难度对局，用时为30分钟包干制，确定参与吗？"
          confirmText="确定"
          atmosphere="sigrika-duel"
          onCancel={() => setSigrikaDuelConfirmOpen(false)}
          onConfirm={() => {
            setSigrikaDuelConfirmOpen(false);
            onStartSigrikaDuel("start");
          }}
        />
      )}
    </div>
  );
}

function PracticeDifficultyDialog({ onClose, onSelect }) {
  return (
    <div
      className="nested-modal-backdrop practice-difficulty-backdrop"
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <ModalDialog
        ariaLabelledBy="practice-difficulty-title"
        className="nested-modal practice-difficulty-modal window-sticker-host"
        onClick={(event) => event.stopPropagation()}
        onClose={onClose}
      >
        <div className="practice-difficulty-heading window-sticker-header">
          <WindowTitleSticker titleKey="practice" id="practice-difficulty-title" />
          <p>
            <span>随机猜先。</span>
            <br />
            <span>吃掉准时宝22颗子或数子胜即算胜利！</span>
          </p>
        </div>
        <div className="practice-difficulty-options">
          {PRACTICE_DIFFICULTY_OPTIONS.map((difficulty, index) => (
            <button
              className={`practice-difficulty-option practice-difficulty-${difficulty.id}`}
              key={difficulty.id}
              type="button"
              onClick={() => onSelect(difficulty.id)}
            >
              <span className="practice-difficulty-index" aria-hidden="true">0{index + 1}</span>
              <span className="practice-difficulty-copy">
                <strong>{difficulty.label}</strong>
                <small>{difficulty.description}</small>
              </span>
            </button>
          ))}
        </div>
        <HomeActionButton variant="secondary" type="button" onClick={onClose}>返回</HomeActionButton>
      </ModalDialog>
    </div>
  );
}
