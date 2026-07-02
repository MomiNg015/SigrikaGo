import Button from "../ui/primitives/Button.jsx";

const MODAL_ACTION_VARIANT_CLASSES = {
  primary: "primary-action",
  secondary: "secondary-action",
  danger: "danger-action"
};

export function ModalActionButton({ variant = "primary", className, type = "button", children, ...props }) {
  const variantClass = MODAL_ACTION_VARIANT_CLASSES[variant] ?? MODAL_ACTION_VARIANT_CLASSES.primary;

  return (
    <Button className={[variantClass, className]} type={type} {...props}>
      {children}
    </Button>
  );
}
