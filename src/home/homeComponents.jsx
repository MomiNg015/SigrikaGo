import Button from "../ui/primitives/Button.jsx";

const HOME_ACTION_VARIANT_CLASSES = {
  primary: "primary-action",
  secondary: "secondary-action",
  danger: "danger-action"
};

export function HomeActionButton({ variant = "primary", className, type = "button", children, ...props }) {
  const variantClass = HOME_ACTION_VARIANT_CLASSES[variant] ?? HOME_ACTION_VARIANT_CLASSES.primary;

  return (
    <Button className={[variantClass, className]} type={type} {...props}>
      {children}
    </Button>
  );
}
