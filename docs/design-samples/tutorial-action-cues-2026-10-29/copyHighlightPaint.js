const set = (element, name, value) => element.style.setProperty(name, value, "important");

// An inert visual copy keeps transparent artwork, real corners and shadows above
// the dimmer. Original components and the guide's target proxy still own input.
export function copyHighlightPaint(target) {
  const clone = target.cloneNode(true);
  const originals = [target, ...target.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  const pseudoRules = [];
  originals.forEach((original, index) => {
    const copy = copies[index];
    const style = getComputedStyle(original);
    copy.removeAttribute("id");
    copy.removeAttribute("class");
    copy.removeAttribute("data-home-guide");
    copy.removeAttribute("data-testid");
    copy.dataset.highlightNode = String(index);
    for (const name of style) set(copy, name, style.getPropertyValue(name));
    set(copy, "animation", "none");
    set(copy, "transition", "none");
    set(copy, "pointer-events", "none");
    if (original instanceof HTMLInputElement || original instanceof HTMLTextAreaElement) copy.value = original.value;
    if (original instanceof HTMLCanvasElement) copy.getContext("2d")?.drawImage(original, 0, 0);
    for (const pseudo of ["::before", "::after"]) {
      const paint = getComputedStyle(original, pseudo);
      if (paint.content === "none" || paint.content === "normal") continue;
      const declarations = [...paint].map(name => `${name}:${paint.getPropertyValue(name)}!important`).join(";");
      pseudoRules.push(`html body .home-onboarding .home-component-highlight [data-highlight-node="${index}"]${pseudo}{${declarations};animation:none!important;transition:none!important;pointer-events:none!important}`);
    }
  });
  // Recreate the source border box independent of its former flex/grid parent.
  for (const [name, value] of Object.entries({ position: "relative", inset: "auto", margin: "0", "box-sizing": "border-box", width: `${target.offsetWidth}px`, height: `${target.offsetHeight}px`, "max-width": "none", "max-height": "none", "min-width": "0", "min-height": "0" })) set(clone, name, value);
  clone.setAttribute("aria-hidden", "true");
  clone.inert = true;
  const styles = document.createElement("style");
  styles.textContent = pseudoRules.join("\n");
  return { clone, styles };
}
