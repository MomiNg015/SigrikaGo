import { useEffect, useState } from "react";

export const DESKTOP_MINIMUM_VIEWPORT = Object.freeze({
  width: 1440,
  height: 768
});

export const MOBILE_INPUT_MEDIA_QUERY = "(hover: none), (pointer: coarse)";
export const PHONE_SCREEN_MAX_SHORT_SIDE = 480;

const MOBILE_USER_AGENT_PATTERN =
  /webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
const TABLET_USER_AGENT_PATTERN = /iPad|Tablet|PlayBook|Silk|Kindle/i;

export function isCommonPhoneDevice({
  maxTouchPoints = 0,
  mobileInput = false,
  screenHeight = 0,
  screenWidth = 0,
  userAgent = "",
  userAgentDataMobile = false
} = {}) {
  const positiveScreenSides = [screenWidth, screenHeight].filter((side) => side > 0);
  const screenShortSide = positiveScreenSides.length > 0
    ? Math.min(...positiveScreenSides)
    : 0;
  const hasTabletIdentity =
    TABLET_USER_AGENT_PATTERN.test(userAgent) ||
    (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent));
  const hasMobileDeviceEvidence =
    mobileInput ||
    maxTouchPoints > 0 ||
    userAgentDataMobile === true ||
    MOBILE_USER_AGENT_PATTERN.test(userAgent);

  return !hasTabletIdentity &&
    hasMobileDeviceEvidence &&
    screenShortSide > 0 &&
    screenShortSide <= PHONE_SCREEN_MAX_SHORT_SIDE;
}

export function shouldBlockDesktopViewport({
  height = 0,
  phoneDevice = false,
  width = 0
} = {}) {
  if (phoneDevice) return false;
  return width < DESKTOP_MINIMUM_VIEWPORT.width || height < DESKTOP_MINIMUM_VIEWPORT.height;
}

function readDesktopViewportState(viewport = globalThis.window) {
  if (!viewport) return false;
  const navigator = viewport.navigator ?? {};
  const screen = viewport.screen ?? {};
  const screenWidth = screen.width || viewport.innerWidth;
  const screenHeight = screen.height || viewport.innerHeight;

  return shouldBlockDesktopViewport({
    height: viewport.innerHeight,
    phoneDevice: isCommonPhoneDevice({
      maxTouchPoints: navigator.maxTouchPoints,
      mobileInput: viewport.matchMedia?.(MOBILE_INPUT_MEDIA_QUERY)?.matches ?? false,
      screenHeight,
      screenWidth,
      userAgent: navigator.userAgent,
      userAgentDataMobile: navigator.userAgentData?.mobile
    }),
    width: viewport.innerWidth
  });
}

export function useDesktopViewportGate() {
  const [blocked, setBlocked] = useState(() => readDesktopViewportState());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mobileInputMedia = window.matchMedia?.(MOBILE_INPUT_MEDIA_QUERY);
    const update = () => setBlocked(readDesktopViewportState());

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    mobileInputMedia?.addEventListener?.("change", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      mobileInputMedia?.removeEventListener?.("change", update);
    };
  }, []);

  return blocked;
}

export default function DesktopViewportGate({ children }) {
  const blocked = useDesktopViewportGate();

  if (!blocked) return children;

  return (
    <main className="desktop-viewport-gate" role="alert" aria-live="polite">
      <section className="desktop-viewport-gate-panel">
        <span className="desktop-viewport-gate-mark" aria-hidden="true">↗</span>
        <h1>请用更大尺寸窗口进行游玩</h1>
        <p>桌面端最低需要 1440 × 768 的可用窗口空间。</p>
      </section>
    </main>
  );
}
