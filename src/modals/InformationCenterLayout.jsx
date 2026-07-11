import { useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { ModalDialog } from "./modalComponents.jsx";

const NARROW_INFORMATION_CENTER_QUERY = "(max-width: 768px)";

export function useNarrowInformationCenter() {
  const [isNarrow, setIsNarrow] = useState(() => (
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(NARROW_INFORMATION_CENTER_QUERY).matches
      : false
  ));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia(NARROW_INFORMATION_CENTER_QUERY);
    const sync = () => setIsNarrow(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  return isNarrow;
}

export default function InformationCenterLayout({
  backdropClassName,
  modalClassName,
  title,
  titleId,
  closeLabel,
  backLabel = "返回列表",
  mobileView = "list",
  onBack,
  onClose,
  listLabel,
  list,
  detailLabelledBy,
  detail
}) {
  const isNarrow = useNarrowInformationCenter();
  const backButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!isNarrow) return;
    if (mobileView === "detail") {
      returnFocusRef.current = document.activeElement;
      backButtonRef.current?.focus();
      return;
    }
    if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    returnFocusRef.current = null;
  }, [isNarrow, mobileView]);

  const listHidden = isNarrow && mobileView === "detail";
  const detailHidden = isNarrow && mobileView !== "detail";

  return (
    <div
      className={["modal-backdrop", "information-center-backdrop", backdropClassName].filter(Boolean).join(" ")}
      onClick={onClose}
    >
      <ModalDialog
        className={["modal-panel", "information-center-modal", modalClassName].filter(Boolean).join(" ")}
        ariaLabelledBy={titleId}
        data-mobile-view={mobileView}
        onClose={onClose}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="information-center-header">
          <button
            ref={backButtonRef}
            className="information-center-back-button"
            type="button"
            aria-label={backLabel}
            aria-hidden={!onBack || undefined}
            disabled={!onBack}
            tabIndex={onBack ? 0 : -1}
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 id={titleId}>{title}</h2>
          <button className="close-button information-center-close-button" type="button" aria-label={closeLabel} onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="information-center-layout">
          <aside
            className="information-center-master"
            aria-label={listLabel}
            aria-hidden={listHidden || undefined}
            inert={listHidden || undefined}
          >
            {list}
          </aside>
          <section
            className="information-center-reader"
            aria-labelledby={detailLabelledBy}
            aria-hidden={detailHidden || undefined}
            inert={detailHidden || undefined}
          >
            {detail}
          </section>
        </div>
      </ModalDialog>
    </div>
  );
}
