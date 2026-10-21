import { useCandyEffectCancellation } from "./useCandyEffectCancellation.js";
import WindowTitleSticker from "../modals/WindowTitleSticker.jsx";
import TeamLineupPicker, { availableTeamCharacters, candyBlockedCharacters } from "./TeamLineupPicker.jsx";
import MatchCharacterPicker from "./MatchCharacterPicker.jsx";
import MatchCharacterSlots from "./MatchCharacterSlots.jsx";
import { MATCH_CHARACTER_NOTICE, useMatchCharacterSelection } from "./useMatchCharacterSelection.js";
import { TEAM_MINIMUM_NOTICE } from "../shared/teamMatch.js";
import { teamLineupSlots } from "./teamLineupSlots.js";
import { useEffect, useRef, useState } from "react";
import { CHARACTERS } from "../shared/characters.js";
import { studentIdentityCharacterId } from "../shared/studentIdentity.js";
import { DEFAULT_SITE_SETTINGS } from "../shared/siteSettings.js";
import { modeOrderedEntries } from "../shared/gameModes.js";
import PracticeDifficultyDialog from "./PracticeDifficultyDialog.jsx";
import { CAPTURE_CHALLENGE_MODE } from "../shared/captureChallenge.js";
import { Info } from "lucide-react";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import HomeFooter from "./components/HomeFooter.jsx";
import HomeHeader from "./components/HomeHeader.jsx";
import TopAnnouncement from "./components/TopAnnouncement.jsx";
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

export default function HomeScreen({ user, token, onUserChange, characters, audioSettings, siteSettings = DEFAULT_SITE_SETTINGS, recruitmentReady = false, mailboxBadgeCount = 0, announcementUnread = false, matchModePickerOpen = false, socket, onNotice, onMatchModePickerOpenChange, onLogout, onSelectCharacter, onStartMatch, onStartPractice, onStartSigrikaDuel, onOpenMatch, onPreloadPlayableReady, onOpenHouse, onOpenResume, onOpenWarehouse, onOpenLeaderboard, onOpenWatch, onOpenShop, onOpenRecruitment, onOpenFriends, onOpenSettings, onOpenAnnouncements, onOpenMailbox, onOpenMessageBoard, onOpenOnboardingStory, onOpenAdmin }) {
  const { available, selections, select } = useMatchCharacterSelection(user, characters);
  const cancellation = useCandyEffectCancellation({ token, user, onUserChange, onNotice });
  const blocked = candyBlockedCharacters(user, characters, available);
  const identityId = studentIdentityCharacterId(user, { regularSelection: selections.regular });
  const selectedCharacter = characters[identityId] ?? CHARACTERS[identityId] ?? CHARACTERS.sigrika;
  const [characterEntry, setCharacterEntry] = useState(null);
  const sigrikaCorrupted = Boolean(user.sigrikaCandyArc?.corrupted);
  const identitySync = useRef(Promise.resolve());
  const identitySyncTarget = useRef("");
  useEffect(() => {
    if (!onSelectCharacter || sigrikaCorrupted) return;
    if (!user.ownedCharacters?.includes(identityId)) return;
    const target = `${user.id ?? user.username}:${identityId}`;
    if (identitySyncTarget.current === target) return;
    const firstSync = !identitySyncTarget.current;
    identitySyncTarget.current = target;
    if (firstSync && user.selectedCharacter === identityId) return;
    // Serialize writes so rapid choices cannot leave a previous identity on the server.
    identitySync.current = identitySync.current.then(() => onSelectCharacter(identityId))
      .catch((error) => onNotice?.(error.message, "danger"));
  }, [identityId, onNotice, onSelectCharacter, sigrikaCorrupted, user.id, user.username, user.ownedCharacters, user.selectedCharacter]);
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


  function startTeamMatch(lineup) {
    const validLineup = teamLineupSlots(lineup, new Set(available.map(character => character.id)));
    if (!validLineup.every(Boolean)) { onNotice?.(MATCH_CHARACTER_NOTICE); return; }
    setCharacterEntry(null);
    onMatchModePickerOpenChange?.(false);
    onStartMatch("team", validLineup);
  }

  return (
    <>
      <TopAnnouncement enabled={siteSettings.topAnnouncementEnabled} text={siteSettings.topAnnouncementText} />
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
            user={user}
            characters={characters}
            selections={selections}
            practiceCharacterProps={{ available, blocked, user, audioSettings, cancellation, selected: selections.practice[0], onSelect: (id) => select("practice", [id]) }}
            onCharacterOpen={(entry) => {
              if (entry === "team" && availableTeamCharacters(user, characters).length < 3) {
                onNotice?.(TEAM_MINIMUM_NOTICE);
                return;
              }
              setCharacterEntry(entry);
            }}
            onNotice={onNotice}
            characterPickerOpen={Boolean(characterEntry)}
            onTeamSelect={() => startTeamMatch(selections.team)}
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
            onSelect={(mode, characterId) => {
              onMatchModePickerOpenChange?.(false);
              onStartMatch(mode, undefined, characterId);
            }}
          />
        )}

        {characterEntry === "team" && !sigrikaCorrupted && <TeamLineupPicker cancellation={cancellation} user={user} characters={characters} audioSettings={audioSettings} initialLineup={selections.team} onChange={(ids) => select("team", ids)} onClose={() => setCharacterEntry(null)} onStart={(_mode, lineup) => startTeamMatch(lineup)} />}
        {characterEntry && characterEntry !== "team" && !sigrikaCorrupted && <MatchCharacterPicker cancellation={cancellation} blocked={blocked} audioSettings={audioSettings} available={available} selected={selections[characterEntry][0]} user={user}
          onClose={() => setCharacterEntry(null)} onSelect={(id) => select(characterEntry, [id])}
          startLabel={characterEntry === "capture" ? "开始吃子挑战赛" : `开始${characterEntry === "regular" ? "星炬对弈" : characterEntry === "standard" ? "标准对弈" : "五子棋"}匹配`}
          onConfirm={() => {
            const characterId = selections[characterEntry][0];
            if (!characterId) return;
            setCharacterEntry(null);
            onMatchModePickerOpenChange?.(false);
            if (characterEntry === "capture") onStartPractice?.({ difficulty: "advanced", challenge: CAPTURE_CHALLENGE_MODE, playerColor: "random", characterId });
            else onStartMatch(characterEntry === "regular" ? "spark" : characterEntry, undefined, characterId);
          }} />}
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

function MatchModePicker({ user, characters, selections, practiceCharacterProps, onCharacterOpen, onNotice, characterPickerOpen, onClose, onPreloadPlayableReady, onPracticeStart, onSelect, onTeamSelect, onStartSigrikaDuel, sigrikaCorrupted = false, sigrikaDuelAvailability = SIGRIKA_CANDY_DUEL_AVAILABILITY.available, sigrikaDuelWatchPending = false }) {
  const [practiceDifficultyOpen, setPracticeDifficultyOpen] = useState(false);
  const [expandedMode, setExpandedMode] = useState(null);
  const categoryButtonRefs = useRef({});
  const expanded = expandedMode !== null;
  const modeOptionsRef = useRef(null);
  const [rulesHover, setRulesHover] = useState(null);
  useEffect(() => {
    const root = modeOptionsRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const titles = [...root.querySelectorAll(".match-mode-sibling strong, .match-mode-submode strong")];
    let active = true;
    const measure = () => {
      if (!active) return;
      for (const title of titles) {
        const wrapper = title.closest(".match-mode-sibling, .match-mode-submode");
        const range = document.createRange();
        range.selectNodeContents(title);
        const text = range.getBoundingClientRect();
        const card = wrapper.getBoundingClientRect();
        wrapper.style.setProperty("--match-mode-title-right", `${text.right - card.left}px`);
      }
    };
    const observer = new ResizeObserver(measure);
    titles.forEach(title => observer.observe(title));
    document.fonts?.ready.then(measure);
    measure();
    return () => { active = false; observer.disconnect(); };
  }, [expandedMode]);
  const returnToModes = () => {
    setExpandedMode(null);
    setRulesHover(null);
    categoryButtonRefs.current[expandedMode]?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const dismiss = () => setRulesHover(null);
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || practiceDifficultyOpen || characterPickerOpen) return;
      if (rulesHover) dismiss();
      else if (expandedMode) {
        setExpandedMode(null);
        categoryButtonRefs.current[expandedMode]?.focus({ preventScroll: true });
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
  }, [practiceDifficultyOpen, characterPickerOpen, rulesHover, expandedMode]);
  const startSelected = (entry, mode) => {
    const id = selections[entry][0];
    if (!id) { onNotice?.(MATCH_CHARACTER_NOTICE); return; }
    if (entry === "capture") onPracticeStart({ difficulty: "advanced", challenge: CAPTURE_CHALLENGE_MODE, playerColor: "random", characterId: id });
    else onSelect(mode, id);
  };
  const slots = (entry, title) => <MatchCharacterSlots entry={entry} title={title} selections={selections[entry]} characters={characters} user={user} onOpen={onCharacterOpen} />;
  const showRules = (event, mode) => {
    if (event.pointerType === "touch" || !window.matchMedia("(min-width: 769px) and (hover: hover) and (pointer: fine)").matches) return;
    setRulesHover({ mode, x: event.clientX, y: event.clientY });
  };
  const [sigrikaDuelConfirmOpen, setSigrikaDuelConfirmOpen] = useState(false);
  const sigrikaDuelOccupied = sigrikaDuelAvailability === SIGRIKA_CANDY_DUEL_AVAILABILITY.occupied;
  const sigrikaDuelOwned = sigrikaDuelAvailability === SIGRIKA_CANDY_DUEL_AVAILABILITY.owned;
  const categoryTitle = (mode) => mode.id === "gomoku" && !sigrikaCorrupted ? "玩些别的" : mode.title;
  const submodes = expandedMode === "standard"
    ? [{ id: "standard", title: "常规匹配", rulesText: modeOrderedEntries().find((mode) => mode.id === "standard").rulesText, onClick: () => startSelected("standard", "standard") }]
    : expandedMode === "gomoku"
      ? [{ id: "gomoku", title: "来下五子棋吗？", rulesText: modeOrderedEntries().find((mode) => mode.id === "gomoku").rulesText, onClick: () => startSelected("gomoku", "gomoku") }]
      : [
        { id: "regular", title: "常规匹配", onClick: () => startSelected("regular", "spark") },
        { id: "capture", title: "吃子挑战赛", rulesText: "100手内尽可能吃掉准时宝的棋子吧！吃得越多排名越高！", onClick: () => startSelected("capture", "spark") },
        { id: "team", title: "队际赛", rulesText: "挑选3位部员，进行一盘棋接力3个阶段的紧张刺激的队际赛！", onClick: onTeamSelect }
      ];

  return (
    <div
      className="modal-backdrop match-mode-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={`small-modal match-mode-modal ${sigrikaCorrupted ? "is-sigrika-corrupted" : "window-sticker-host"}`} onClick={(event) => event.stopPropagation()} aria-label="选择对弈模式">
        <WindowTitleSticker titleKey="match-mode" enabled={!sigrikaCorrupted} />
        <div ref={modeOptionsRef} className={`match-mode-options${sigrikaCorrupted ? "" : " match-mode-drilldown"}${expanded ? " is-expanded" : ""}`}>
          {modeOrderedEntries().map((mode) => (
            <div className={`match-mode-option-wrap ${mode.id === "spark" ? "has-practice-entry" : `match-mode-sibling match-mode-sibling-${mode.id}`} match-mode-category${expandedMode === mode.id ? " is-active-category" : ""}`} key={mode.id} inert={expanded && expandedMode !== mode.id ? true : undefined} aria-hidden={expanded && expandedMode !== mode.id ? true : undefined}>
              <button
                className="match-mode-option"
                ref={(element) => { categoryButtonRefs.current[mode.id] = element; }}
                aria-expanded={!sigrikaCorrupted ? expandedMode === mode.id : undefined}
                aria-controls={!sigrikaCorrupted ? "match-mode-submodes" : undefined}
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
                  setExpandedMode((current) => current === mode.id ? null : mode.id);
                }}
              >
                <MatchModeWatermark mode={mode.id === "gomoku" && !sigrikaCorrupted ? { ...mode, englishLabel: "other mode" } : mode} />
                <span className="match-mode-copy">
                  <strong>{categoryTitle(mode)}</strong>
                </span>
              </button>
              {!sigrikaCorrupted && (
                <button
                  className="match-mode-info-button"
                  type="button"
                  aria-label={`查看${categoryTitle(mode)}规则`}
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
                  data-home-guide="practice"
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
            <div className="match-mode-submodes" id="match-mode-submodes" inert={!expanded ? true : undefined} aria-hidden={!expanded} key={expandedMode || "collapsed"}>
              {submodes.map((submode) => (
                <div className={`match-mode-submode match-mode-submode-${submode.id}`} key={submode.id}>
                  <button className="match-mode-option" type="button" disabled={submode.disabled} onClick={submode.onClick} onFocus={() => !submode.disabled && onPreloadPlayableReady?.(expandedMode)} onPointerEnter={(event) => { if (!submode.disabled) onPreloadPlayableReady?.(expandedMode); if (submode.rulesText) showRules(event, submode); }} onPointerMove={(event) => { if (submode.rulesText) showRules(event, submode); }} onPointerLeave={() => setRulesHover(null)} onPointerDown={() => setRulesHover(null)}>
                    <span className="match-mode-copy"><strong>{submode.title}</strong></span>
                  </button>
                  {slots(submode.id, submode.title)}
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
        <HomeActionButton variant="secondary" type="button" onClick={expanded ? returnToModes : onClose}>{expanded ? "返回" : "取消"}</HomeActionButton>
        {practiceDifficultyOpen && (
          <PracticeDifficultyDialog
            characters={characters}
            characterProps={practiceCharacterProps}
            onClose={() => setPracticeDifficultyOpen(false)}
            onSelect={(difficulty) => onPracticeStart({
              difficulty,
              playerColor: "random",
              characterId: practiceCharacterProps.selected
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
