const set = (element, name, value) => element.style.setProperty(name, value, "important");
let copySequence = 0;
let initialValues;

function initialPaintValues() {
  if (initialValues) return initialValues;
  // Resolve browser defaults once. A hidden probe has no layout or visible paint.
  const host = document.createElement("div");
  host.style.setProperty("display", "none", "important");
  const probe = document.createElement("span");
  probe.style.setProperty("all", "initial", "important");
  host.append(probe); document.body.append(host);
  const style = getComputedStyle(probe);
  initialValues = new Map([...style].filter(name => !name.startsWith("--") && !/^(animation|transition)(-|$)/.test(name)).map(name => [name, style.getPropertyValue(name)]));
  host.remove();
  return initialValues;
}

/** Copy paint only: source React nodes and the guide proxy retain all behavior. */
export function copyGuidePaint(target) {
  const clone = target.cloneNode(true);
  const originals = [target, ...target.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  const prefix = `guide-paint-${++copySequence}-`;
  const ids = new Map(originals.filter(element => element.id).map((element, index) => [element.id, `${prefix}${index}`]));
  const rewrite = value => String(value).replace(/url\(["']?#([^)'"\s]+)["']?\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
  const defaults = initialPaintValues();
  const declarations = style => {
    const rules = [];
    for (const [name, initial] of defaults) {
      // Standard computed values already resolve var(); copying inherited theme
      // variables to every descendant duplicates thousands of unused declarations.
      const value = style.getPropertyValue(name);
      if (value !== initial) rules.push(`${name}:${rewrite(value)}!important`);
    }
    rules.push("animation:none!important", "transition:none!important", "pointer-events:none!important");
    return rules.join(";");
  };
  // Keep `all` in one shared rule. Putting it inline makes CSSOM serialize
  // hundreds of initial longhands again when a later property is overridden.
  const scope = "html body .home-onboarding.home-onboarding .home-guide-highlight.home-guide-highlight [data-guide-paint-node]";
  const pseudoRules = [`${scope},${scope}::before,${scope}::after{all:initial!important}`];
  originals.forEach((original, index) => {
    const copy = copies[index];
    const style = getComputedStyle(original);
    for (const attribute of ["class", "data-home-guide", "data-testid", "autofocus", "name", "form"]) copy.removeAttribute(attribute);
    if (original.id) copy.id = ids.get(original.id);
    copy.dataset.guidePaintNode = String(index);
    for (const attribute of [...copy.attributes]) {
      if (attribute.value.startsWith("#") && ids.has(attribute.value.slice(1))) copy.setAttribute(attribute.name, `#${ids.get(attribute.value.slice(1))}`);
      else if (attribute.value.includes("url(")) copy.setAttribute(attribute.name, rewrite(attribute.value));
    }
    copy.style.cssText = declarations(style);
    if (original instanceof HTMLInputElement || original instanceof HTMLTextAreaElement) copy.value = original.value;
    if (original instanceof HTMLSelectElement) copy.selectedIndex = original.selectedIndex;
    if (original instanceof HTMLCanvasElement) copy.getContext("2d")?.drawImage(original, 0, 0);
    for (const pseudo of ["::before", "::after"]) {
      const paint = getComputedStyle(original, pseudo);
      if (paint.content === "none" || paint.content === "normal") continue;
      pseudoRules.push(`${scope}[data-guide-paint-node="${index}"]${pseudo}{${declarations(paint)}}`);
    }
  });
  for (const [name, value] of Object.entries({ position: "relative", inset: "auto", margin: "0", "box-sizing": "border-box", width: `${target.offsetWidth}px`, height: `${target.offsetHeight}px`, "max-width": "none", "max-height": "none", "min-width": "0", "min-height": "0" })) set(clone, name, value);
  clone.setAttribute("aria-hidden", "true");
  clone.inert = true;
  const styles = document.createElement("style");
  styles.textContent = pseudoRules.join("\n");
  const scrollPairs = originals.flatMap((original, index) => original.scrollHeight > original.clientHeight || original.scrollWidth > original.clientWidth ? [[original, copies[index]]] : []);
  const syncScroll = () => scrollPairs.forEach(([original, copy]) => {
    if (copy.scrollTop !== original.scrollTop) copy.scrollTop = original.scrollTop;
    if (copy.scrollLeft !== original.scrollLeft) copy.scrollLeft = original.scrollLeft;
  });
  return { clone, styles, syncScroll };
}
