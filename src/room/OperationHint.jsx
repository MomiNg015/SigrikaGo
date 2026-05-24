import { GAME_PHASES } from "../shared/game.js";
import ScoringBreakdown from "./ScoringBreakdown.jsx";

export default function OperationHint({ room, user, scoring, drawRequest }) {
  const phase = room.game.phase;
  const isDrawRequester = drawRequest?.requestedBy === user.id;
  const isCountingRequester = scoring?.requestedBy === user.id;
  const confirmed = scoring?.confirmedBy?.includes(user.id);
  const accepted = scoring?.resultAcceptedBy?.includes(user.id);

  let title = "操作提示";
  let text = "";
  let requiresMyAction = false;

  if (phase === GAME_PHASES.drawRequested && drawRequest) {
    title = "和棋申请";
    text = isDrawRequester ? "已发送和棋申请，等待对方在行动区确认。" : "对方申请和棋，请在行动区选择同意或不同意。";
    requiresMyAction = !isDrawRequester;
  } else if (phase === GAME_PHASES.countingRequested && scoring) {
    title = "数子申请";
    text = isCountingRequester ? "已发送数子申请，等待对方在行动区确认。" : "对方申请数子，请在行动区选择同意或不同意。";
    requiresMyAction = !isCountingRequester;
  } else if (phase === GAME_PHASES.markingDead && scoring) {
    title = "死子确认";
    text = confirmed ? "你已确认死子，等待双方确认完成。" : "点选棋盘上的疑似死子或空点标记后，在行动区确认。";
    requiresMyAction = !confirmed;
  } else if (phase === GAME_PHASES.resultReview && scoring) {
    title = "结果确认";
    text = accepted ? "你已同意结果，等待对方确认。" : "请核对数子结果，并在行动区同意或不同意。";
    requiresMyAction = !accepted;
  } else if (phase === GAME_PHASES.playing) {
    const activePlayer = room.players.find((player) => player.color === room.game.turn);
    requiresMyAction = activePlayer?.user.id === user.id;
    text = requiresMyAction ? "轮到你行棋，可在棋盘落子或使用下方行动。" : "等待对方行棋。";
  } else if (phase === GAME_PHASES.finished) {
    title = "对局结束";
    text = room.game.winner?.text ?? "对局已经结束。";
  } else if (phase === GAME_PHASES.opening) {
    text = "等待双方确认开局。";
  } else if (phase === GAME_PHASES.skillPreview) {
    text = "技能效果展示中，请稍候。";
  }

  const score = scoring?.result ?? room.game.winner;
  if (!text) return null;
  return (
    <section className={`operation-hint ${requiresMyAction ? "my-action" : ""}`} aria-live="polite">
      <strong>{title}</strong>
      <p>{text}</p>
      {(phase === GAME_PHASES.resultReview || phase === GAME_PHASES.finished) && score?.formula && (
        <ScoringBreakdown result={score} compact />
      )}
    </section>
  );
}
