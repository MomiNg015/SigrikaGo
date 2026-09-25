import WindowTitleSticker from "../modals/WindowTitleSticker.jsx";
import TeamLineupPicker, { availableTeamCharacters } from "./TeamLineupPicker.jsx";
import { TEAM_MINIMUM_NOTICE } from "../shared/teamMatch.js";
import { useEffect, useRef, useState } from "react";
import { CHARACTERS } from "../shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { modeOrderedEntries } from "../shared/gameModes.js";
import { PRACTICE_DIFFICULTY_OPTIONS } from "../shared/practiceMode.js";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";
import { Info, UsersRound } from "lucide-react";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import { ModalDialog } from "../modals/modalComponents.jsx";
import HomeFooter from "./components/HomeFooter.jsx";
import HomeHeader from "./components/HomeHeader.jsx";
import HomeStage from "./components/HomeStage.jsx";
import PlayerPlaque from "./components/PlayerPlaque.jsx";
import { HomeActionButton } from "./homeComponents.jsx";
import IrisDatabase from "./IrisDatabase.jsx";
import MatchModeRulesTooltip from "./MatchModeRulesTooltip.jsx";
import MatchModeWatermark from "./MatchModeWatermark.jsx";
import {
  SIGRIKA_CANDY_DUEL_AVAILABILITY,
  SIGRIKA_CANDY_PHASES
} from "../shared/sigrikaCandyArc.js";
import { useSigrikaCandyDuelAvailability } from "./useSigrikaCandyDuelAvailability.js";

export default function HomeScreen({ user, characters, audioSettings, siteSettings = DEFAULT_SITE_SETTINGS, lobbyStats = {}, recruitmentReady = false, mailboxBadgeCount = 0, announcementUnread = false, matchModePickerOpen = false, socket, onNotice, onMatchModePickerOpenChange, onLogout, onStartMatch, onStartPractice, onStartSigrikaDuel, onOpenMatch, onPreloadPlayableReady, onOpenHouse, onOpenResume, onOpenWarehouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenRecruitment, onOpenFriends, onOpenSettings, onOpenAnnouncements, onOpenMailbox, onOpenMessageBoard, onOpenOnboardingStory, onOpenAdmin }) {
  const selectedCharacter = characters[user.selectedCharacter] ?? CHARACTERS[user.selectedCharacter] ?? CHARACTERS.sigrika;
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
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
            onTeamSelect={() => {
              if (availableTeamCharacters(user, characters).length < 3) {
                onNotice?.(TEAM_MINIMUM_NOTICE);
                return;
              }
              onMatchModePickerOpenChange?.(false);
              setTeamPickerOpen(true);
            }}
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

        {teamPickerOpen && !sigrikaCorrupted && <TeamLineupPicker user={user} characters={characters} onClose={() => setTeamPickerOpen(false)} onStart={onStartMatch} />}
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

function MatchModePicker({ matchmakingCounts, onClose, onPreloadPlayableReady, onPracticeStart, onSelect, onTeamSelect, onStartSigrikaDuel, sigrikaCorrupted = false, sigrikaDuelAvailability = SIGRIKA_CANDY_DUEL_AVAILABILITY.available, sigrikaDuelWatchPending = false }) {
  const [practiceDifficultyOpen, setPracticeDifficultyOpen] = useState(false);
  const [sparkExpanded, setSparkExpanded] = useState(false);
  const sparkButtonRef = useRef(null);
  const [rulesHover, setRulesHover] = useState(null);
  const returnToModes = () => {
    setSparkExpanded(false);
    setRulesHover(null);
    sparkButtonRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const dismiss = () => setRulesHover(null);
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || practiceDifficultyOpen) return;
      if (rulesHover) dismiss();
      else if (sparkExpanded) {
        setSparkExpanded(false);
        sparkButtonRef.current?.focus({ preventScroll: true });
      }
    };
    const onOutsidePointerDown = (event) => {
      if (!event.target.closest?.(".match-mode-info-button, .match-mode-rules-tooltip")) dismiss();
    };
    document.addEventListener("pointerdown", onOutsidePointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [practiceDifficultyOpen, rulesHover, sparkExpanded]);
  const showRules = (event, mode) => {
    if (event.pointerType === "touch" || !window.matchMedia("(min-width: 769px) and (hover: hover) and (pointer: fine)").matches) return;
    setRulesHover({ mode, x: event.clientX, y: event.clientY });
  };
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
        <div className={`match-mode-options${sigrikaCorrupted ? "" : " match-mode-drilldown"}${sparkExpanded ? " is-expanded" : ""}`}>
          {modeOrderedEntries().map((mode) => (
            <div className={`match-mode-option-wrap ${mode.id === "spark" ? "has-practice-entry" : `match-mode-sibling match-mode-sibling-${mode.id}`}`} key={mode.id} inert={sparkExpanded && mode.id !== "spark" ? true : undefined} aria-hidden={sparkExpanded && mode.id !== "spark" ? true : undefined}>
              <button
                className="match-mode-option"
                ref={mode.id === "spark" ? sparkButtonRef : undefined}
                aria-expanded={mode.id === "spark" && !sigrikaCorrupted ? sparkExpanded : undefined}
                aria-controls={mode.id === "spark" && !sigrikaCorrupted ? "spark-match-submodes" : undefined}
                disabled={sigrikaCorrupted}
                type="button"
                onFocus={() => onPreloadPlayableReady?.(mode.id)}
                onPointerEnter={(event) => {
                  onPreloadPlayableReady?.(mode.id);
                  showRules(event, mode);
                }}
                onPointerMove={(event) => showRules(event, mode)}
                onPointerLeave={() => setRulesHover(null)}
                onPointerDown={() => setRulesHover(null)}
                onClick={() => {
                  setRulesHover(null);
                  if (mode.id === "spark") setSparkExpanded((current) => !current);
                  else onSelect(mode.id);
                }}
              >
                <MatchModeWatermark mode={mode} />
                <span className="match-mode-copy">
                  <strong>{mode.title}</strong>
                </span>
                <span className="match-mode-count" aria-label={`匹配中 ${Number(matchmakingCounts[mode.id] ?? 0)} 人`}>
                  <UsersRound size={16} aria-hidden="true" />
                  <b>{Number(matchmakingCounts[mode.id] ?? 0)}</b>
                </span>
              </button>
              {!sigrikaCorrupted && (
                <button
                  className="match-mode-info-button"
                  type="button"
                  aria-label={`查看${mode.title}规则`}
                  aria-expanded={Boolean(rulesHover?.tap && rulesHover.mode.id === mode.id)}
                  aria-controls={rulesHover?.tap && rulesHover.mode.id === mode.id ? "match-mode-rules-tooltip" : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    setRulesHover((current) => current?.tap && current.mode.id === mode.id
                      ? null
                      : { mode, tap: true, x: rect.left, y: rect.bottom });
                  }}
                >
                  <Info size={16} aria-hidden="true" />
                </button>
              )}
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
          {!sigrikaCorrupted && (
            <div className="match-mode-submodes" id="spark-match-submodes" inert={!sparkExpanded ? true : undefined} aria-hidden={!sparkExpanded}>
              {[
                { id: "regular", title: "常规匹配", onClick: () => onSelect("spark") },
                { id: "capture", title: "吃子挑战赛", rulesText: "100手内尽可能吃掉准时宝的棋子吧！吃得越多排名越高！", onClick: () => onPracticeStart({ difficulty: "advanced", challenge: CAPTURE_CHALLENGE_MODE, playerColor: "random" }) },
                { id: "team", title: "队际赛", rulesText: "挑选3位部员，进行一盘棋接力3个阶段的紧张刺激的队际赛！", onClick: onTeamSelect }
              ].map((submode) => (
                <div className="match-mode-submode" key={submode.id}>
                  <button className="match-mode-option" type="button" disabled={submode.disabled} onClick={submode.onClick} onFocus={() => !submode.disabled && onPreloadPlayableReady?.("spark")} onPointerEnter={(event) => { if (!submode.disabled) onPreloadPlayableReady?.("spark"); if (submode.rulesText) showRules(event, submode); }} onPointerMove={(event) => { if (submode.rulesText) showRules(event, submode); }} onPointerLeave={() => setRulesHover(null)} onPointerDown={() => setRulesHover(null)}>
                    <span className="match-mode-copy"><strong>{submode.title}</strong></span>
                    {submode.id === "regular" && (
                      <span className="match-mode-count" aria-label={`匹配中 ${Number(matchmakingCounts.spark ?? 0)} 人`}>
                        <UsersRound size={16} aria-hidden="true" /><b>{Number(matchmakingCounts.spark ?? 0)}</b>
                      </span>
                    )}
                    {submode.disabled && <span className="match-mode-count">敬请期待</span>}
                  </button>
                  {submode.rulesText && <button className="match-mode-info-button" type="button" aria-label={`查看${submode.title}规则`} aria-expanded={Boolean(rulesHover?.tap && rulesHover.mode.id === submode.id)} aria-controls={rulesHover?.tap && rulesHover.mode.id === submode.id ? "match-mode-rules-tooltip" : undefined} onClick={(event) => {
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    setRulesHover((current) => current?.tap && current.mode.id === submode.id
                      ? null
                      : { mode: submode, tap: true, x: rect.left, y: rect.bottom });
                  }}><Info size={16} aria-hidden="true" /></button>}
                </div>
              ))}
            </div>
          )}
        </div>
        {rulesHover && <MatchModeRulesTooltip hover={rulesHover} />}
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
        <HomeActionButton variant="secondary" type="button" onClick={sparkExpanded ? returnToModes : onClose}>{sparkExpanded ? "返回" : "取消"}</HomeActionButton>
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
            <span>普通陪练：</span><span>吃掉准时宝22颗子或数子胜即算胜利！</span>
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
