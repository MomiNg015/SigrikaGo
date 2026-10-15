import { useState } from "react";
import { createRoot } from "react-dom/client";
import WarehouseModal from "../../../src/modals/WarehouseModal.jsx";
import RecruitmentModal from "../../../src/modals/RecruitmentModal.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import "../../../src/styles.css";
import "./quantity-variants.css";
import "./title-variants.css";

const params = new URLSearchParams(location.search);
const inventory = [
  ["rainbow-bean-candy", "彩虹豆豆跳跳糖", "rainbow-bean-candy.webp", 3, "character", true, true],
  ["campus-recruitment-poster", "招募海报", "recruitment-poster.webp", 5, "self", false, true],
  ["radio-recruitment-ticket", "电台招募券", "radio-recruitment-ticket.webp", 2, "self", false, true],
  ["aemeath-flight-snow-memorial-ticket", "飞行雪纪念票", "aemeath-flight-snow-memorial-ticket.webp", 1, "self", false, true],
  ["magic-clock", "魔法时钟", "magic-clock.svg", 2, "self", false, false],
  ["gacha-coin-bag", "金币袋", "gacha-coin-bag.svg", 1, "self", true, true]
].map(([itemId, name, image, quantity, targetType, usable, actionVisible]) => ({ itemId, name, quantity, targetType, usable, actionVisible, imageUrl: `/assets/items/${image}`, description: itemId === "rainbow-bean-candy" ? "给部员尝一颗，开启一段意想不到的故事。" : `${name}，可在对应的道具流程中使用。` }));
let items = params.has("empty") ? [] : params.has("many") ? Array.from({ length: 30 }, (_, i) => ({ ...inventory[i % 6], itemId: `${inventory[i % 6].itemId}-${i}`, name: `${inventory[i % 6].name} ${i + 1}` })) : inventory;
if (params.has("long")) items = items.map(i => ({ ...i, name: `${i.name}特别珍藏纪念道具`, description: i.description.repeat(20) }));
if (params.has("largeCounts")) items = items.map((item, index) => ({ ...item, quantity: [9999, 128, 99, 1, 1000, 12][index % 6] }));
const sampleUser = { id: "warehouse-preview", ownedCharacters: params.has("targets") ? ["sigrika", "denia", "aemeath", "lynae", "mornye", "chisa", "qiuyuan"] : ["sigrika", "denia", "aemeath"], itemEffects: {} };
const actualFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url !== "string" || !url.startsWith("/api/")) return actualFetch(url, options);
  if (options?.headers?.Authorization !== "Bearer warehouse-preview") throw new Error("Preview API is isolated");
  if (url === "/api/recruitment") return Response.json({ items: inventory.filter(i => i.usable === false && i.actionVisible).map(i => ({ ...i, itemType: i.itemId })), utilities: [], task: null });
  if (url.endsWith("/use")) {
    const id = url.split("/")[3];
    items = items.map(i => i.itemId === id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0);
  }
  return Response.json({ items, user: sampleUser });
};
function Preview() {
  const [user, setUser] = useState(sampleUser);
  const [open, setOpen] = useState(true);
  const [recruitmentOpen, setRecruitmentOpen] = useState(false);
  return <div className="app-shell player-theme-enabled theme-bright-school" data-title-style={params.get("titleStyle") || undefined} data-quantity-style={params.get("quantity") || undefined} style={{ minHeight: "100dvh", backgroundImage: "url('/assets/home/multipurpose-classroom-bg.webp')" }}>
    {open ? <WarehouseModal token="warehouse-preview" user={user} characters={CHARACTERS} onUserChange={setUser} onClose={() => setOpen(false)} onOpenRecruitment={() => { setOpen(false); setRecruitmentOpen(true); }}/> : !recruitmentOpen && <button type="button" onClick={() => setOpen(true)}>打开仓库</button>}
    {recruitmentOpen && <RecruitmentModal token="warehouse-preview" user={user} characters={CHARACTERS} onUserChange={setUser} onClose={() => setRecruitmentOpen(false)}/>}
  </div>;
}
createRoot(document.getElementById("root")).render(<Preview/>);
