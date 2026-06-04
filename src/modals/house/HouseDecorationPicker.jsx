import { getStoneDecoration } from "../../shared/stoneDecorations.js";
import StoneDecorationPreview from "../StoneDecorationPreview.jsx";

export default function HouseDecorationPicker({
  applyingDecoration,
  decorationError,
  ownedDecorations,
  selectedStoneDecoration,
  onApplyDecoration
}) {
  return (
    <section className="owned-decoration-section decoration-applied-box decorations-section">
      <div className="owned-decoration-header">
        <h3>装饰</h3>
        {selectedStoneDecoration && (
          <button className="secondary-action compact-action" disabled={applyingDecoration === "default"} onClick={() => onApplyDecoration("")}>
            恢复初始装饰
          </button>
        )}
      </div>
      <div className="owned-decoration-list">
        {ownedDecorations.length === 0 && <p className="quiet-text">暂无装饰。</p>}
        {ownedDecorations.map((decorationId) => {
          const decoration = getStoneDecoration(decorationId);
          const selected = selectedStoneDecoration === decorationId;
          const decorationLabel = decoration?.name ?? decorationId;
          return (
            <button
              className={`owned-decoration-chip ${selected ? "selected" : ""}`}
              key={decorationId}
              disabled={selected || applyingDecoration === decorationId}
              aria-label={decorationLabel}
              aria-pressed={selected}
              title={decorationLabel}
              onClick={() => onApplyDecoration(decorationId)}
            >
              {decoration ? <StoneDecorationPreview decoration={decoration} /> : null}
              <strong>{selected ? "使用中" : applyingDecoration === decorationId ? "应用中" : "应用"}</strong>
            </button>
          );
        })}
      </div>
      {decorationError && <p className="form-error admin-action-error">{decorationError}</p>}
    </section>
  );
}
