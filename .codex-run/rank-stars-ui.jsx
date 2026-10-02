import React from "react";
import { createRoot } from "react-dom/client";
import "/src/styles.css";
import ProfileResumeView from "/src/modals/ProfileResumeView.jsx";
import PlayerInfo from "/src/room/PlayerInfo.jsx";
import {createGameState} from "/src/shared/game.js";
import {CHARACTERS} from "/src/shared/characters.js";
import LeaderboardRow from "/src/modals/leaderboard/LeaderboardRow.jsx";
const mode = new URLSearchParams(location.search).get("view") ?? "profile";
const rank = new URLSearchParams(location.search).get("rank") ?? "8段";
const characters = [{ id: "sigrika", name: "西格莉卡", portrait: "/assets/characters/portraits/sigrika.webp" }];
const user = {id:"qa", username:"段位测试",rank,stars:3,rating:1200,selectedCharacter:"sigrika"};
const rows = ["9段","8段","6段","3段"].map((rank,index)=>({...user,id:String(index),username:"测试玩家"+index,rank,stars:3,rating:1200,totalGames:12,wins:7,losses:4,draws:1,commonCharacter:"sigrika"}));
const battlePlayers=rows.map((u,index)=>({user:u,color:index%2?"white":"black",characterId:"sigrika",time:600,captures:0}));
const game=createGameState(battlePlayers.slice(0,2).map(p=>({userId:p.user.id,color:p.color,characterId:p.characterId})),{mode:"spark"});
createRoot(document.getElementById("root")).render(<div className="app-shell player-theme-enabled theme-bright-school">
{mode==="battle" ? <div className={innerWidth<=768 ? "room-screen mobile-room-screen" : "room-screen"}>{battlePlayers.map(player=><PlayerInfo key={player.user.id} player={player} game={game} characters={CHARACTERS} align="left" />)}</div> : <div className="modal-backdrop"><section className={mode==="profile" ? "house-modal resume-modal profile-dossier-modal window-sticker-host window-bookmark-host" : "leaderboard-modal window-sticker-host window-bookmark-host"}>
<header className="resume-header"><h2>段位测试</h2></header>
{mode === "profile" ? <ProfileResumeView context="self" user={user} characters={characters} mode="spark" onModeChange={()=>{}} stats={{totalGames:12,wins:7,losses:4,draws:1}} recentResults={["win","loss","win"]} />
: <div className="leaderboard-table ranked-leaderboard"><div className="leaderboard-heading">{["排名","常用角色","用户名","段位","总对局数","胜局数","负局数","胜率"].map(x=><span key={x}>{x}</span>)}</div><div className="leaderboard-list">{rows.map((player,index)=><LeaderboardRow key={player.id} player={player} rank={index+1} characters={characters}/>)}</div></div>}
</section></div>}</div>);
