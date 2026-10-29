import { useEffect, useRef, useState } from "react";
import { MessageCircle, Play } from "lucide-react";
import { useTutorialChoicePlacement } from "./useTutorialChoicePlacement.js";

export default function TutorialChoiceActions({ node, onChoice, onRevealText, disabled = false }) {
  const groupRef = useRef(null);
  const submittedRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const options = Array.isArray(node?.options) ? node.options : [];
  useTutorialChoicePlacement(groupRef, options.length);

  useEffect(() => {
    groupRef.current?.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
  }, []);

  const selectOption = option => {
    if (disabled || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    onRevealText?.();
    onChoice?.(option);
  };

  return <div className="tutorial-choice-overlay">
    <div ref={groupRef} className="tutorial-floating-choices" role="group" aria-label="请选择回答" aria-busy={submitted} inert={disabled}>
      <div className="tutorial-choice-list">
        {options.map((option, index) => <div className="tutorial-choice-step" key={`${node.id}-${index}`} style={{ "--choice-index": index, "--choice-delay": `${index * Math.min(35, 90 / options.length)}ms` }}>
          <button type="button" disabled={submitted || disabled} onClick={() => selectOption(option)}>
            {["继续", "立即继续"].includes(option.label?.trim() || "继续") ? <Play size={17} aria-hidden="true"/> : <MessageCircle size={17} aria-hidden="true"/>}
            <span>{option.label || "继续"}</span>
          </button>
        </div>)}
      </div>
    </div>
  </div>;
}
