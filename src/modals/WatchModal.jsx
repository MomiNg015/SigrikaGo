import { X } from "lucide-react";

export default function WatchModal({ code, setCode, onJoin, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="small-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>观战</h2>
        <WatchPad code={code} setCode={setCode} onJoin={onJoin} />
      </section>
    </div>
  );
}

function WatchPad({ code, setCode, onJoin }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const displayCode = Array.from({ length: 5 }, (_, index) => code[index] ?? "·").join("");

  return (
    <div className="watch-pad">
      <div className="room-code">{displayCode}</div>
      <div className="keypad">
        {keys.map((key) => (
          <button key={key} onClick={() => setCode((code + key).slice(0, 5))}>{key}</button>
        ))}
        <span aria-hidden="true" />
        <button onClick={() => setCode((code + "0").slice(0, 5))}>0</button>
        <button onClick={() => setCode(code.slice(0, -1))}>退格</button>
      </div>
      <button className="secondary-action" onClick={onJoin} disabled={code.length !== 5}>进入观战</button>
    </div>
  );
}
