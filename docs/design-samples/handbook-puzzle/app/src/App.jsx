import { useEffect, useRef, useState } from 'react';
import catalogData from '../../catalog.json';
import geometry from '../../geometry.json';

const importedArt = import.meta.glob(['../../assets/characters/*.png', '!../../assets/characters/qa-*.png'], { eager: true, query: '?url', import: 'default' });
const characters = catalogData.map(character => ({ ...character,
  src: character.id === 'baconbits' ? character.src : importedArt[`../../assets/characters/${character.id}.png`],
}));
const characterOrder = ['lynae', 'aemeath', 'mornye', 'nabomo', 'changli', 'sigrika', 'baconbits', 'qiuyuan', 'chisa', 'denia'];
const orderedCharacters = characterOrder.map(id => characters.find(character => character.id === id));
const initiallyLocked = new Set(['nabomo', 'qiuyuan']);

function Outline({ points }) {
  const coordinates = points.map(point => point.join(',')).join(' ');
  return <svg className="piece-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <polygon points={coordinates} className="seam" vectorEffect="non-scaling-stroke" />
    <polygon points={coordinates} className="theme-edge" vectorEffect="non-scaling-stroke" />
    <polygon points={coordinates} className="focus-edge" vectorEffect="non-scaling-stroke" />
  </svg>;
}

function Piece({ character, polygon, owned, boardSize, mobile, onOpen }) {
  const { bbox, portraitRegion } = polygon;
  const localPoints = polygon.points.map(([x, y]) => [(x - bbox.x) * 100 / bbox.width, (y - bbox.y) * 100 / bbox.height]);
  const anchor = portraitRegion.center;
  const cropSize = boardSize.width * (mobile ? 0.465 : 0.285);
  const scale = cropSize / character.crop[2];
  const visibleTop = character.id === 'baconbits' ? 175 : 0;
  const anchorPixelY = Math.max(anchor[1] * boardSize.height / 100,
    bbox.y * boardSize.height / 100 + (character.focal[1] - visibleTop) * scale + 4);
  const artStyle = {
    width: character.imageSize[0] * scale,
    height: character.imageSize[1] * scale,
    left: (anchor[0] - bbox.x) * boardSize.width / 100 - character.focal[0] * scale,
    top: anchorPixelY - bbox.y * boardSize.height / 100 - character.focal[1] * scale,
    '--source': `url("${character.src}")`,
  };
  return <button className={`piece ${owned ? 'owned' : 'locked'}`}
    type="button" data-character={character.id}
    title={owned ? character.name : '未拥有的部员'}
    aria-label={owned ? `查看${character.name}的部员档案` : '查看未拥有部员的档案'}
    onClick={event => onOpen(character, owned, event.currentTarget)}
    style={{ left: `${bbox.x}%`, top: `${bbox.y}%`, width: `${bbox.width}%`, height: `${bbox.height}%`,
      clipPath: `polygon(${localPoints.map(([x, y]) => `${x}% ${y}%`).join(',')})`, '--theme': character.color }}>
    {owned ? <img className="portrait" src={character.src} alt="" draggable="false" style={artStyle} />
      : <span className="silhouette portrait" style={artStyle} aria-hidden="true" />}
    {!owned && <span className="question" style={{ left: `${(anchor[0] - bbox.x) * 100 / bbox.width}%`,
        top: anchorPixelY - bbox.y * boardSize.height / 100 }} aria-hidden="true">?</span>}
    <Outline points={localPoints} />
  </button>;
}

function Detail({ detail, onClose }) {
  const dialogRef = useRef(null);
  const { character, owned } = detail;
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={dialogRef} className="detail-dialog" aria-labelledby="detail-title"
    style={{ '--theme': owned ? character.color : '#9a9690' }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="detail-header">
      <h2 id="detail-title">{owned ? character.name : '未拥有的部员'}</h2>
      <button className="return-button" type="button" onClick={onClose} autoFocus>返回拼图</button>
    </div>
    <div className="detail-body">
      <div className={`detail-art ${owned ? '' : 'detail-locked'}`}>
        {owned ? <img src={character.src} alt={`${character.name}完整立绘`} />
          : <><span className="detail-silhouette" style={{ '--source': `url("${character.src}")` }} /><span className="detail-question" aria-hidden="true">?</span></>}
      </div>
      <div className="detail-text">
        {owned ? <>
          <p className="character-description">{character.description}</p>
          {character.cv && <p className="meta">CV：{character.cv}</p>}
          <section className="skill-section">
            <h3>{character.skill.name}</h3>
            <p>{character.skill.description}</p>
            <p className="meta">{Number(character.skill.cost) > 0 ? `消耗 ${character.skill.cost} 点超频` : '无需超频'}{character.skill.uses > 0 ? ` · 每盘 ${character.skill.uses} 次` : ''}</p>
          </section>
          <section className="acquisition"><h3>获得途径</h3><p>{character.acquisition}</p></section>
        </> : <><h3>档案尚未解锁</h3><p>获得这位部员后，就能查看完整的立绘和档案。</p></>}
      </div>
    </div>
  </dialog>;
}

export function App() {
  const [scenario, setScenario] = useState('partial');
  const [detail, setDetail] = useState(null);
  const [boardSize, setBoardSize] = useState({ width: 1000, height: 600 });
  const [mobile, setMobile] = useState(() => window.innerWidth <= 680);
  const boardRef = useRef(null);
  const returnTarget = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setBoardSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      setMobile(window.innerWidth <= 680);
    });
    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, []);
  const owned = character => scenario === 'all' || (scenario === 'partial' && !initiallyLocked.has(character.id));
  const ownedCount = orderedCharacters.filter(owned).length;
  const openDetail = (character, isOwned, target) => {
    returnTarget.current = target;
    setDetail({ character, owned: isOwned });
  };
  const closeDetail = () => {
    setDetail(null);
    requestAnimationFrame(() => returnTarget.current?.focus({ preventScroll: true }));
  };
  const layout = geometry[mobile ? 'mobile' : 'desktop'];
  return <main className="sample-page">
    <div className="sample-toolbar">
      <span>群像拼图 · 交互样板</span>
      <label>查看状态 <select value={scenario} onChange={event => setScenario(event.target.value)}>
        <option value="partial">拥有 8 / 10</option><option value="all">全部拥有</option><option value="none">全部未拥有</option>
      </select></label>
    </div>
    <section className="handbook" aria-labelledby="handbook-title">
      <header className="book-header"><h1 id="handbook-title">部员手册</h1><span className="section-label">角色</span></header>
      <div className="puzzle-board" ref={boardRef} aria-label="部员群像拼图">
        {orderedCharacters.map((character, index) => <Piece key={character.id} character={character}
          polygon={layout[index]} owned={owned(character)} boardSize={boardSize} mobile={mobile} onOpen={openDetail} />)}
      </div>
      <footer className="book-footer"><span>已拥有 <strong>{ownedCount}</strong> / 10</span><span>点击拼块，查看部员档案</span></footer>
    </section>
    {detail && <Detail detail={detail} onClose={closeDetail} />}
  </main>;
}
