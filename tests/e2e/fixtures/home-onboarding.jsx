import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import HomeScreen from "../../../src/home/HomeScreen.jsx";
import AppOverlays from "../../../src/app/AppOverlays.jsx";
import HomeOnboarding from "../../../src/home/onboarding/HomeOnboarding.jsx";
import { useOverlayState } from "../../../src/app/useOverlayState.js";
import { CHARACTERS, characterListFromCatalog } from "../../../src/shared/characters.js";
import { DEFAULT_SITE_SETTINGS } from "../../../src/shared/siteSettings.js";
const noop = () => {};
const windowDelay = Number(new URLSearchParams(location.search).get("windowDelay")) || 0;
const user = { id: "guide-test", username: "新部员", role: "user", selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "denia"],
  ownedDecorations: [], ownedItems: {}, coins: 500, rating: 1000, rank: "18级", wins: 0, losses: 0, draws: 0, itemEffects: {} };
function Fixture() {
  const overlays = useOverlayState();
  const [active, setActive] = useState(true);
  const [result, setResult] = useState("");
  const blocked = () => { window.__unexpectedAction = true; };
  const open = setter => windowDelay ? setTimeout(() => setter(true), windowDelay) : setter(true);
  return <div className="app-shell player-theme-enabled theme-bright-school">
    <HomeScreen homeOnboardingActive={active} user={user} characters={CHARACTERS} audioSettings={{ muted: true }} siteSettings={DEFAULT_SITE_SETTINGS}
      matchModePickerOpen={overlays.showMatchModePicker} onMatchModePickerOpenChange={value => value ? open(overlays.setShowMatchModePicker) : overlays.setShowMatchModePicker(false)}
      onOpenHouse={() => open(overlays.setShowHouse)} onOpenResume={() => open(overlays.setShowResume)}
      onOpenRecruitment={() => open(overlays.setShowRecruitment)} onOpenShop={() => open(overlays.setShowShop)}
      onOpenMailbox={() => open(overlays.setShowMailbox)} onStartMatch={blocked} onStartPractice={blocked} />
    <AppOverlays {...overlays} user={user} characters={CHARACTERS} characterListView={characterListFromCatalog(CHARACTERS)}
      token="fixture" audioSettings={{ muted: true }} musicTracks={[]} toasts={[]} siteSettings={DEFAULT_SITE_SETTINGS}
      showToast={noop} updateUser={noop} onMailboxSummaryChange={noop} selectCharacter={blocked} />
    {active && <HomeOnboarding character={CHARACTERS.sigrika} overlaySetters={overlays.overlaySetters}
      onFinish={(outcome) => { setResult(outcome); setActive(false); }} />}
    <output data-testid="outcome">{result}</output>
  </div>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
