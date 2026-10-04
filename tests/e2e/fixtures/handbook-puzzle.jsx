import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import HouseModal from "../../../src/modals/HouseModal.jsx";
import { CHARACTERS, characterListFromCatalog } from "../../../src/shared/characters.js";
const params = new URLSearchParams(location.search);
const characters = characterListFromCatalog(CHARACTERS);
const ownership = params.get("owned");
const initialUser = { id: "handbook-fixture", selectedCharacter: "sigrika",
  ownedCharacters: ownership === "none" ? [] : ownership === "partial" ? ["sigrika", "denia", "aemeath", "lynae"] : characters.map(({ id }) => id),
  ownedDecorations: [], itemEffects: params.has("candy") ? { deniaRainbowGlow: true } : {},
  sigrikaCandyArc: { corrupted: params.has("corrupt") } };
function Fixture() {
  const [user, setUser] = useState(initialUser);
  const [open, setOpen] = useState(true);
  return <div className="app-shell player-theme-enabled theme-bright-school">
    {!open && <button type="button" onClick={() => setOpen(true)}>打开部员手册</button>}
    {open && <HouseModal user={user} characterListView={characters} audioSettings={{ muted: true }} musicTracks={[]}
      onClose={() => setOpen(false)} onUserChange={setUser} onApplyDecoration={async () => {}} />}
  </div>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
