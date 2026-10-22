import { createRoot } from "react-dom/client";
import { useState } from "react";
import "../../../src/styles.css";
import { CharacterDetailDialog } from "../../../src/modals/house/HouseNestedDialogs.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";

const params = new URLSearchParams(location.search);
const base = CHARACTERS[params.get("character")] ?? CHARACTERS.sigrika;
const character = { ...base, cvName: "琉音", cvUrl: "https://example.com/voice",
  ...(params.has("long") ? { name: "西格莉卡的长姓名排版测试", description: `${base.description}\n`.repeat(8) } : {}) };
function Fixture() {
  const [open, setOpen] = useState(true);
  return <div className="app-shell player-theme-enabled theme-bright-school">
    <button type="button" onClick={() => setOpen(true)}>打开角色详情</button>
    {open && <CharacterDetailDialog character={character} detailOwned={!params.has("unowned")} itemEffects={{}}
      user={{ equippedCostumes: params.has("costume") ? { [character.id]: { portraitUrl: "/assets/costumes/portraits/sigrika-costume-01.webp", portraitScalePercent: 120 } } : {} }}
      audioSettings={{ muted: true }} musicTracks={params.has("noMusic") ? [] : undefined}
      onOpenCostumes={() => {}} onPlayDetailVoice={() => {}} onClose={() => setOpen(false)} />}
  </div>;
}
createRoot(document.getElementById("root")).render(<Fixture />);
