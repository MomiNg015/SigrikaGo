import { classNames } from "../classNames.js";

export const EMPTY_STATE_TW_CLASSES = ["tw:text-center", "tw:px-3", "tw:py-6"];

export default function EmptyState({ as: Component = "p", className, children, ...props }) {
  return (
    <Component className={classNames(className, EMPTY_STATE_TW_CLASSES)} {...props}>
      {children}
    </Component>
  );
}
