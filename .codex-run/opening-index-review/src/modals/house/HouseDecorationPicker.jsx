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
      <div className="owned-decoration-list">
        <button
          className={`owned-decoration-chip ${!selectedStoneDecoration ? "selected" : ""}`}
          disabled={!selectedStoneDecoration || applyingDecoration === "default"}
          aria-label="默认棋子"
          aria-pressed={!selectedStoneDecoration}
          aria-busy={applyingDecoration === "default" || undefined}
          title="默认棋子"
          onClick={() => onApplyDecoration("")}
        >
          <StoneDecorationPreview />
        </button>
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
