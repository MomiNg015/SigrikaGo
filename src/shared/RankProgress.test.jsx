import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RankProgress from "./RankProgress.jsx";

it.each([["3段", 4], ["4段", 6], ["8段", 8]])("renders every star slot for %s", (rank, capacity) => {
  const html = renderToStaticMarkup(<RankProgress rank={rank} stars={2} />);
  expect(html).toContain(`data-capacity="${capacity}"`);
  expect(html.match(/<svg/g)).toHaveLength(capacity);
  expect(html.match(/is-earned/g)).toHaveLength(2);
  expect(html).toContain(`aria-label="${rank} 2/${capacity}星"`);
});
it("shows points only for ninth dan and exposes challenge status", () => {
  const html = renderToStaticMarkup(<RankProgress rank="9段" rating={0} />);
  expect(html).toContain("9段 0分 · 降级赛");
  expect(html).not.toContain("<svg");
  expect(renderToStaticMarkup(<RankProgress rank="8段" stars={8} />)).toContain("晋级赛");
  expect(renderToStaticMarkup(<RankProgress rank="高级陪练" />)).not.toContain("rank-progress-stars");
});
