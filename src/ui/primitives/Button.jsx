import { classNames } from "../classNames.js";

export const BUTTON_TW_CLASSES = [
  "tw:inline-flex",
  "tw:items-center",
  "tw:justify-center",
  "tw:gap-2"
];

export default function Button({ className, children, ...props }) {
  return (
    <button className={classNames(className, BUTTON_TW_CLASSES)} {...props}>
      {children}
    </button>
  );
}
