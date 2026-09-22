import WindowEmptyState from "../WindowEmptyState.jsx";
import { RotateCcw } from "lucide-react";
import { getStoneDecoration } from "../../shared/stoneDecorations.js";
import StoneDecorationPreview from "../StoneDecorationPreview.jsx";

export default function HouseDecorationPicker({
  panelId,
  labelledBy,
  applyingDecoration,
  decorationError,
  ownedDecorations,
  selectedStoneDecoration,
  onApplyDecoration
}) {
  return (
    <section className="owned-decoration-section decoration-applied-box decorations-section" id={panelId}
      role={panelId ? "tabpanel" : undefined} aria-labelledby={labelledBy}
      tabIndex={panelId ? 0 : undefined}>
      <div className="owned-decoration-header">
        <h3>装饰</h3>
        {selectedStoneDecoration && (
          <button
            className="secondary-action compact-action decoration-reset-action"
            disabled={applyingDecoration === "default"}
            onClick={() => onApplyDecoration("")}
            aria-label="恢复初始装饰"
            title="恢复初始装饰"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
      <div className="owned-decoration-list">
        {ownedDecorations.length === 0 && <WindowEmptyState compact>暂无装饰。</WindowEmptyState>}
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
              aria-busy={applyingDecoration === decorationId || undefined}
              title={decorationLabel}
              onClick={() => onApplyDecoration(decorationId)}
            >
              {decoration ? <StoneDecorationPreview decoration={decoration} /> : null}
            </button>
          );
        })}
      </div>
      {decorationError && <p className="form-error admin-action-error">{decorationError}</p>}
    </section>
  );
}
