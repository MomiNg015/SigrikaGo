export const directions = [
  { id: "score", title: "左侧计分牌", note: "手数像悬挂的计分牌，房间与黑白方收在旁边。" },
  { id: "flag", title: "中央对阵旗", note: "黑白分列两侧，手数占据中轴，强调对弈仪式感。" },
  { id: "record", title: "横向棋谱栏", note: "用大字和横线组织信息，留出最多棋盘空间。" },
];

function Count({ moves }) {
  return <div className={`bh-count ${moves >= 100 ? "bh-three-digits" : ""}`} aria-label={`第 ${moves} 手`}><span className="bh-count-prefix">第</span><strong key={moves}>{moves}</strong><span className="bh-count-unit">手</span></div>;
}

function Side({ color, name }) {
  return <div className={`bh-side bh-${color}`}><i aria-hidden="true"/><span><small>{color === "black" ? "黑方" : "白方"}</small><b title={name}>{name}</b></span></div>;
}

function RoomLabel({ team }) {
  return <div className="bh-room-label"><span>星炬</span><span>123456</span>{team && <span>第 2 局</span>}</div>;
}

export default function HeaderDesign({ variant, moves, longNames, team }) {
  const black = longNames ? "西格莉卡·星辉符文继承者" : "西格莉卡";
  const white = longNames ? "达妮娅·泡泡魔法研究员" : "达妮娅";
  if (variant === "score") return <div className="bh-design bh-score">
    <Count moves={moves}/><div className="bh-score-info"><RoomLabel team={team}/><div className="bh-pair"><Side color="black" name={black}/><span className="bh-versus">对</span><Side color="white" name={white}/></div></div>
  </div>;
  if (variant === "flag") return <div className="bh-design bh-flag">
    <RoomLabel team={team}/><div className="bh-match"><Side color="black" name={black}/><Count moves={moves}/><Side color="white" name={white}/></div>
  </div>;
  return <div className="bh-design bh-record">
    <div className="bh-record-info"><RoomLabel team={team}/><div className="bh-pair"><Side color="black" name={black}/><Side color="white" name={white}/></div></div><Count moves={moves}/>
  </div>;
}
