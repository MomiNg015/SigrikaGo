import { useEffect, useState } from "react";
import HomeScreen from "../../../src/home/HomeScreen.jsx";
import AppOverlays from "../../../src/app/AppOverlays.jsx";
import HomeOnboarding from "../../../src/home/onboarding/HomeOnboarding.jsx";
import { HOME_ONBOARDING_STEPS } from "../../../src/home/onboarding/homeOnboardingScript.js";
import { useOverlayState } from "../../../src/app/useOverlayState.js";
import { CHARACTERS, characterListFromCatalog } from "../../../src/shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../../../src/shared/siteSettings.js";
import ActionCue from "./ActionCue.jsx";

const noop = () => {};
const audioSettings = { master: 0, bgm: 0, sfx: 0, voice: 0, muted: true };
const user = { id: "action-cue-home", username: "新部员", role: "user", selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "denia"],
  ownedDecorations: [], ownedItems: {}, coins: 500, rating: 1000, rank: "18级", wins: 0, losses: 0, draws: 0, itemEffects: {} };
const entrySteps = { "home-handbook": "handbook", "home-match": "match-intro", "home-mailbox": "mailbox", "home-details": "skill", "home-resume": "resume-intro" };

export default function HomeScene({ target, variant, paused }) {
  const overlays = useOverlayState();
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let frame, stopped = false, lastClick = 0;
    const seek = time => {
      const guide = document.querySelector(".home-onboarding");
      const step = HOME_ONBOARDING_STEPS.find(entry => entry.id === guide?.dataset.step);
      if (step?.id === entrySteps[target] && guide.querySelector(".home-guide-spotlight")) {
        setReady(true);
        return;
      }
      // Prepare a checkpoint through real guide controls, without modifying its
      // authored script or exposing debug props on production components.
      if (step && time - lastClick > 80 && !guide.querySelector(".home-guide-status")) {
        const text = guide.querySelector(".home-guide-panel p");
        const reveal = step.text && text?.textContent !== step.text;
        const control = guide.querySelector(reveal ? ".tutorial-battle-dialogue" : step.action ? ".home-guide-target" : step.choice ? ".home-guide-choice" : ".tutorial-battle-dialogue");
        control?.click();
        lastClick = time;
      }
      if (!stopped) frame = requestAnimationFrame(seek);
    };
    frame = requestAnimationFrame(seek);
    return () => { stopped = true; cancelAnimationFrame(frame); };
  }, [target]);
  return <div className={`home-cue-scene${ready ? " is-ready" : " is-preparing"}`} data-home-ready={ready}>
    <div className="app-shell player-theme-enabled theme-bright-school">
      <HomeScreen homeOnboardingActive={active} user={user} characters={CHARACTERS} audioSettings={audioSettings} siteSettings={DEFAULT_SITE_SETTINGS}
        matchModePickerOpen={overlays.showMatchModePicker} onMatchModePickerOpenChange={overlays.setShowMatchModePicker}
        onOpenHouse={() => overlays.setShowHouse(true)} onOpenResume={() => overlays.setShowResume(true)}
        onOpenRecruitment={() => overlays.setShowRecruitment(true)} onOpenShop={() => overlays.setShowShop(true)}
        onOpenMailbox={() => overlays.setShowMailbox(true)} onStartMatch={noop} onStartPractice={noop}/>
      <AppOverlays {...overlays} user={user} characters={CHARACTERS} characterListView={characterListFromCatalog(CHARACTERS)}
        token="action-cue-local-sample" audioSettings={audioSettings} musicTracks={[]} toasts={[]} siteSettings={DEFAULT_SITE_SETTINGS}
        showToast={noop} updateUser={noop} onMailboxSummaryChange={noop} selectCharacter={noop}/>
      {active && <HomeOnboarding character={CHARACTERS.sigrika} overlaySetters={overlays.overlaySetters} onFinish={() => setActive(false)}/>}
    </div>
    {!ready && <div className="home-sample-loading" role="status">正在打开主界面引导…</div>}
    {ready && <ActionCue source="home" variant={variant} paused={paused}/>}
  </div>;
}
