import { classNames } from "../classNames.js";

export const BADGE_TW_CLASSES = ["tw:inline-flex", "tw:items-center", "tw:justify-center"];

export default function Badge({ as: Component = "span", className, tone, children, ...props }) {
  return (
    <Component className={classNames(className, tone, BADGE_TW_CLASSES)} {...props}>
      {children}
    </Component>
  );
}
