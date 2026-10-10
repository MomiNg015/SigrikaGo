import { useEffect, useRef } from "react";
import { DENIA_PAPER_ASSET, DENIA_SWARM_END_MS } from "../shared/deniaSkillForm.js";
import { createDeniaPapers, createPaperFrames, drawDeniaPapers } from "./deniaPaperSwarm.js";

export default function DeniaPaperSwarm({ castId }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    let cancelled = false;
    let frame = 0;
    let width = 0;
    let height = 0;
    let papers = null;
    let frames = null;
    const start = performance.now();
    const resize = () => {
      const scale = Math.min(1, 1920 / window.innerWidth, 1200 / window.innerHeight);
      width = Math.round(window.innerWidth * scale);
      height = Math.round(window.innerHeight * scale);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      papers = createDeniaPapers(width, height);
    };
    const stop = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
    };
    resize();
    window.addEventListener("resize", resize);
    reduced.addEventListener("change", stop);
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      frames = createPaperFrames(image);
      const draw = (now) => {
        if (cancelled) return;
        const elapsed = now - start;
        drawDeniaPapers(context, frames, papers, width, height, elapsed);
        if (elapsed < DENIA_SWARM_END_MS) frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };
    image.src = DENIA_PAPER_ASSET;
    return () => {
      stop();
      image.onload = null;
      window.removeEventListener("resize", resize);
      reduced.removeEventListener("change", stop);
    };
  }, [castId]);
  return <canvas ref={canvasRef} className="denia-paper-swarm" aria-hidden="true" />;
}
