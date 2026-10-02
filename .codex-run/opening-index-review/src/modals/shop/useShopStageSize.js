import { useEffect, useState } from "react";

export function useShopStageSize(stageRef) {
  const [size, setSize] = useState({ width: 0, height: 0, mobile: false });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      setSize({
        width: rect.width,
        height: rect.height,
        mobile: window.matchMedia("(max-width: 768px)").matches
      });
    };
    updateSize();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateSize);
    observer?.observe(stage);
    window.addEventListener("resize", updateSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [stageRef]);

  return size;
}
