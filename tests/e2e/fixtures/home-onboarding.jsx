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
const user = { id: "guide-test", username: "新部员", role: "user", selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "denia"],
  ownedDecorations: [], ownedItems: {}, coins: 500, rating: 1000, rank: "18级", wins: 0, losses: 0, draws: 0, itemEffects: {} };
function Fixture() {
  const overlays = useOverlayState();
  const [active, setActive] = useState(true);
  const [result, setResult] = useState("");
  const blocked = () => { window.__unexpectedAction = true; };
  return <div className="app-shell player-theme-enabled theme-bright-school">
    <HomeScreen user={user} characters={CHARACTERS} audioSettings={{ muted: true }} siteSettings={DEFAULT_SITE_SETTINGS}
      matchModePickerOpen={overlays.showMatchModePicker} onMatchModePickerOpenChange={overlays.setShowMatchModePicker}
      onOpenHouse={() => overlays.setShowHouse(true)} onOpenResume={() => overlays.setShowResume(true)}
      onOpenRecruitment={() => overlays.setShowRecruitment(true)} onOpenShop={() => overlays.setShowShop(true)}
      onOpenMailbox={() => overlays.setShowMailbox(true)} onStartMatch={blocked} onStartPractice={blocked} />
    <AppOverlays {...overlays} user={user} characters={CHARACTERS} characterListView={characterListFromCatalog(CHARACTERS)}
      token="fixture" audioSettings={{ muted: true }} musicTracks={[]} toasts={[]} siteSettings={DEFAULT_SITE_SETTINGS}
      showToast={noop} updateUser={noop} onMailboxSummaryChange={noop} selectCharacter={blocked} />
    {active && <HomeOnboarding character={CHARACTERS.sigrika} overlaySetters={overlays.overlaySetters}
      onFinish={(outcome) => { setResult(outcome); setActive(false); }} />}
    <output data-testid="outcome">{result}</output>
  </div>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
