import { useEffect, useMemo, useRef, useState } from "react";
import { COLORS } from "../shared/game.js";
import { roomPeople } from "./roomView.js";

export default function RoomPeopleList({ room }) {
  const [activeId, setActiveId] = useState("");
  const panelRef = useRef(null);
  const people = useMemo(() => roomPeople(room), [room]);

  useEffect(() => {
    if (!activeId) return;
    const close = (event) => {
      if (!panelRef.current?.contains(event.target)) setActiveId("");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeId]);

  return (
    <section className="room-people" ref={panelRef}>
      <strong>房间成员</strong>
      <div className="room-people-table">
        {people.map((person) => (
          <div className="room-person-wrap" key={person.id}>
            <button className={`room-person ${person.role}`} type="button" onClick={() => setActiveId((id) => id === person.id ? "" : person.id)}>
              <span className="room-person-name">
                {person.color && <i className={`room-color-dot ${person.color}`} aria-label={person.color === COLORS.black ? "执黑" : "执白"} />}
                {person.username}
              </span>
              <span>{person.rank}</span>
              <span>{person.rating}分</span>
            </button>
            {activeId === person.id && (
              <div className="room-person-popover">
                <button type="button">信息</button>
                <button type="button">申请好友</button>
                <button type="button">加入黑名单</button>
                <button type="button">密谈</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
