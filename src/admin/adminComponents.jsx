import { Plus } from "lucide-react";

export function AdminSectionHeader({ title, meta, actionLabel, onAction, children }) {
  return (
    <div className="admin-section-header">
      <div className="admin-section-title-block">
        <h2>{title}</h2>
        {meta && <span>{meta}</span>}
      </div>
      <div className="inline-actions">
        {children}
        {actionLabel && (
          <button className="primary-action" type="button" onClick={onAction}>
            <Plus size={18} />{actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminStatusPill({ tone = "neutral", children }) {
  return <span className={`admin-status-pill ${tone}`}>{children}</span>;
}

export function AdminStat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

export function AdminFieldLabel({ text, tip }) {
  return <span className="admin-field-label" title={tip}>{text}</span>;
}
