import { createRoot } from 'react-dom/client';
import '../../../src/styles.css';
import { CHARACTERS } from '../../../src/shared/characters.js';
import MatchModal from '../../../src/modals/gameLifecycle/MatchModal.jsx';
import ResultModal from '../../../src/modals/gameLifecycle/ResultModal.jsx';
import SkillBanner from '../../../src/modals/SkillBanner.jsx';
import AssetPreloadScreen from '../../../src/app/AssetPreloadScreen.jsx';
import FriendsList from '../../../src/modals/friends/FriendsList.jsx';
import { ReplayList } from '../../../src/modals/ReplayList.jsx';
import WarehouseTargetModal from '../../../src/modals/warehouse/WarehouseTargetModal.jsx';
import StoryPlayerModal from '../../../src/modals/StoryPlayerModal.jsx';
import RecruitmentModal from '../../../src/modals/RecruitmentModal.jsx';
import LeaderboardRow from '../../../src/modals/leaderboard/LeaderboardRow.jsx';
import WatchRoomRow from '../../../src/modals/watch/WatchRoomRow.jsx';

const query = new URLSearchParams(location.search);
const character = CHARACTERS[query.get('character') || 'sigrika'];
const characters = Object.values(CHARACTERS);
const noop = () => {};
const audioSettings = { master: 0 };
const user = { id: 'portrait-review', username: '星炬同学', selectedCharacter: character.id, characterId: character.id, ownedCharacters: Object.keys(CHARACTERS), rank: '3段', stars: 2, rating: 1250 };
const room = { mode: 'spark', rated: false, players: [{ color: 'black', user, characterId: character.id }, { color: 'white', user: { ...user, id: 'opponent', username: '围棋部同学' }, characterId: 'denia' }], game: { phase: 'finished', winner: { winnerColor: 'black', text: '黑方获胜' } } };
const shared = { characters: CHARACTERS, user, audioSettings, onClose: noop };
const node = { id: 'portrait', characterId: character.id, text: '欢迎来到星炬围棋部。一起开始今天的对局吧！', options: [] };
const surfaces = {
  match: <MatchModal {...shared} startedAt={Date.now()} onCancel={noop} />,
  result: <ResultModal {...shared} room={room} />,
  loading: <AssetPreloadScreen {...shared} character={character} progress={.6} />,
  skill: <SkillBanner {...shared} banner={{ id: 'review', characterId: character.id }} />,
  story: <StoryPlayerModal {...shared} script={{ startNodeId: node.id, nodes: [node] }} typewriterDisabled />,
  target: <WarehouseTargetModal {...shared} ownedCharacters={characters} targetItem={{ itemId: 'review' }} onUseItem={noop} />,
  recruitment: <RecruitmentModal {...shared} token="portrait-fixture" onUserChange={noop} onNotice={noop} />,
  leaderboard: <div className="modal-backdrop"><section className="modal-panel leaderboard-modal"><div className="leaderboard-list">{characters.map((c, index) => <LeaderboardRow key={c.id} {...shared} rank={index + 1} player={{ ...user, id: c.id, username: c.name, commonCharacter: c.id, totalGames: 20, wins: 12, losses: 8 }} />)}</div></section></div>,
  watch: <div className="modal-backdrop"><section className="modal-panel watch-modal"><div className="watch-table">{characters.map((c, index) => <WatchRoomRow key={c.id} {...shared} onJoinRoom={noop} room={{ code: `1234${index}`, onlineCount: 2, moveNumber: 20, status: 'playing', black: { user: { ...user, username: c.name }, characterId: c.id, connected: true }, white: { user, characterId: 'denia', connected: true } }} />)}</div></section></div>,
  friends: <div className="modal-backdrop"><section className="modal-panel friends-modal"><FriendsList {...shared} rows={characters.map(c => ({ ...user, id: c.id, characterId: c.id, username: c.name, status: 'online' }))} activeTab="friends" onToggleAction={noop} /></section></div>,
  replay: <div className="modal-backdrop"><section className="modal-panel replay-dialog"><ReplayList {...shared} records={characters.map((c, index) => ({ id: c.id, blackCharacter: c.id, whiteCharacter: characters[(index + 1) % characters.length].id, blackName: c.name, whiteName: characters[(index + 1) % characters.length].name, resultText: '黑方获胜', moveCount: 100, createdAt: '2026-10-09T00:00:00Z' }))} /></section></div>,
};
createRoot(document.getElementById('root')).render(surfaces[query.get('surface') || 'match']);
