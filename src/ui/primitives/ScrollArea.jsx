import { classNames } from "../classNames.js";

export const SCROLL_AREA_TW_CLASSES = ["tw:max-w-full", "tw:overflow-x-auto"];

export default function ScrollArea({ as: Component = "div", className, children, ...props }) {
  return (
    <Component className={classNames(className, SCROLL_AREA_TW_CLASSES)} {...props}>
      {children}
    </Component>
  );
}
