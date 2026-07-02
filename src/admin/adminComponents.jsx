import { Plus } from "lucide-react";
import Badge from "../ui/primitives/Badge.jsx";
import Button from "../ui/primitives/Button.jsx";
import EmptyState from "../ui/primitives/EmptyState.jsx";
import ScrollArea from "../ui/primitives/ScrollArea.jsx";

const ADMIN_ACTION_VARIANT_CLASSES = {
  primary: "primary-action",
  secondary: "secondary-action",
  danger: "danger-action"
};

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
          <AdminActionButton variant="primary" type="button" onClick={onAction}>
            <Plus size={18} />{actionLabel}
          </AdminActionButton>
        )}
      </div>
    </div>
  );
}

export function AdminActionButton({ variant = "primary", className, children, ...props }) {
  const variantClass = ADMIN_ACTION_VARIANT_CLASSES[variant] ?? ADMIN_ACTION_VARIANT_CLASSES.primary;

  return (
    <Button className={[variantClass, className]} {...props}>
      {children}
    </Button>
  );
}

export function AdminStatusPill({ tone = "neutral", className, children, ...props }) {
  return (
    <Badge className={["admin-status-pill", className]} tone={tone} {...props}>
      {children}
    </Badge>
  );
}

export function AdminTableEmpty({ className, children, ...props }) {
  return (
    <EmptyState as="td" className={["admin-table-empty", className]} {...props}>
      {children}
    </EmptyState>
  );
}

export function AdminTableScroll({ className, children, ...props }) {
  return (
    <ScrollArea className={["admin-table-wrap", className]} {...props}>
      {children}
    </ScrollArea>
  );
}

export function AdminStat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

export function AdminFieldLabel({ text, tip }) {
  return <span className="admin-field-label" title={tip}>{text}</span>;
}
