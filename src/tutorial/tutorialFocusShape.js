/** Match the browser's four elliptical CSS corner radii, including percentages. */
export function tutorialFocusShape({ x, y, width, height }, corners) {
  const parse = (value, size) => {
    const number = Number.parseFloat(value) || 0;
    return Math.max(0, value?.endsWith("%") ? number * size / 100 : number);
  };
  const radii = corners.map(corner => {
    const [horizontal = "0", vertical = horizontal] = String(corner).split(/\s+/);
    return [parse(horizontal, width), parse(vertical, height)];
  });
  const [tl, tr, br, bl] = radii;
  const scale = Math.min(1, width / (tl[0] + tr[0] || 1), width / (bl[0] + br[0] || 1),
    height / (tl[1] + bl[1] || 1), height / (tr[1] + br[1] || 1));
  radii.forEach(radius => { radius[0] *= scale; radius[1] *= scale; });
  const right = x + width, bottom = y + height;
  return `M ${x + tl[0]} ${y} H ${right - tr[0]} A ${tr[0]} ${tr[1]} 0 0 1 ${right} ${y + tr[1]} V ${bottom - br[1]} A ${br[0]} ${br[1]} 0 0 1 ${right - br[0]} ${bottom} H ${x + bl[0]} A ${bl[0]} ${bl[1]} 0 0 1 ${x} ${bottom - bl[1]} V ${y + tl[1]} A ${tl[0]} ${tl[1]} 0 0 1 ${x + tl[0]} ${y} Z`;
}
