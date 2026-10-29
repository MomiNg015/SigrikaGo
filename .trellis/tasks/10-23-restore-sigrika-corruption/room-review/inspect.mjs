import { chromium } from "playwright";
import { createSigrikaCandyDuelRoom } from "../../../../server/roomFactory.js";
import { buildRoomView } from "../../../../server/roomView.js";
import { CHARACTERS } from "../../../../src/shared/characters.js";
const user={id:"special-review",username:"星炬同学",selectedCharacter:"sigrika",rank:"3段",sigrikaCandyArc:{corrupted:true}};
const room=createSigrikaCandyDuelRoom({user,characterId:"sigrika",character:CHARACTERS.sigrika},{code:"SIG01",random:()=>0,now:()=>1000});
Object.assign(room.sigrikaCandyDuel,{openingPresentationStage:"done",presentation:null});
room.preload=null;room.openingEndsAt=null;room.game.phase="playing";room.game.turn=room.sigrikaCandyDuel.humanColor;
const browser=await chromium.launch({channel:"chrome"});
for(const width of [1280,844,768]) {
 const page=await browser.newPage({viewport:{width,height:width===1440?900:width===1280?720:width===844?390:844},reducedMotion:"reduce"});
 await page.addInitScript(payload=>window.__interfaceSpecialRoomPayload=payload,{user,room:buildRoomView(room,user.id)});
 await page.goto("http://127.0.0.1:5175/tests/e2e/fixtures/interface-polish.html?surface=room");
 await page.locator(".room-screen").waitFor();await page.evaluate(()=>document.fonts.ready);
 await page.locator(".portrait-wrap img").evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
 await page.waitForTimeout(300);
 const capture=async name=>page.screenshot({path:`.trellis/tasks/10-23-restore-sigrika-corruption/room-review/${name}-${width}.png`,fullPage:true});
 await capture("after-corrupted");
 console.log(width,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,players:document.querySelector(".room-scoreboard-players").textContent,points:[...document.querySelectorAll(".point")].filter(e=>{let b=e.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest(".point")===e}).length})));
 console.log(await page.evaluate(()=>[".room-screen",".room-header",".mobile-room-viewport",".mobile-player-slot",".player-info",".portrait-wrap",".mobile-room-dock",".action-bar",".board-stage"].map(s=>{let e=document.querySelector(s);if(!e)return null;let c=getComputedStyle(e),b=e.getBoundingClientRect();return {s,x:b.x,y:b.y,w:b.width,h:b.height,display:c.display,areas:c.gridTemplateAreas,columns:c.gridTemplateColumns,rows:c.gridTemplateRows}})));
 if(false){
  await page.getByRole("button",{name:"认输",exact:true}).click();await capture("resign");
  console.log("dialog",await page.locator(".sigrika-duel-confirm-modal").innerText());
  await page.getByRole("button",{name:"取消",exact:true}).click();
  await page.locator(".chat-toggle-button").click();await capture("log");
 }
 await page.close();
}
await browser.close();
