// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useInformationListRows } from "./useInformationListRows.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Directory({ items, enabled = true }) {
  const ref = useInformationListRows(items);
  return items.length ? <ul ref={ref} data-testid="list" style={{ "--information-paper-fit": enabled ? "1" : "0", "--information-card-min-height": "72px", rowGap: "12px", padding: "11px 9px 10px 11px" }}>
    {items.map(id => <li key={id}><button style={{ padding: "8px 11px 7px 20px", rowGap: "4px", border: "2px solid" }}>
      <span className="mailbox-list-heading"><span className="mailbox-list-title">{id}</span></span>
      <span className="mailbox-list-meta">发件人</span>
    </button></li>)}
  </ul> : null;
}

it("attaches after async data, fits complete rows on resize and disconnects when emptied", () => {
  let resize;
  const observe = vi.fn(), disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class { constructor(callback) { resize = callback; } observe = observe; disconnect = disconnect; });
  const { getByTestId, rerender } = render(<Directory items={[]}/>);
  expect(observe).not.toHaveBeenCalled();
  rerender(<Directory items={["first", "second"]}/>);
  const list = getByTestId("list");
  expect(observe).toHaveBeenCalledWith(list);
  expect(list.style.getPropertyValue("--information-paper-row-height")).toBe("");
  Object.defineProperty(list, "clientHeight", { value: 400, configurable: true });
  resize();
  // 379px content fits exactly four rows plus three gaps.
  expect(parseFloat(list.style.getPropertyValue("--information-paper-row-height"))).toBe(85.75);
  Object.defineProperty(list, "clientHeight", { value: 270, configurable: true });
  resize();
  expect(parseFloat(list.style.getPropertyValue("--information-paper-row-height"))).toBe(75);
  Object.defineProperty(list, "clientHeight", { value: 80, configurable: true });
  resize();
  expect(parseFloat(list.style.getPropertyValue("--information-paper-row-height"))).toBe(72);
  rerender(<Directory items={[]}/>);
  expect(disconnect).toHaveBeenCalledOnce();
  expect(list.style.getPropertyValue("--information-paper-row-height")).toBe("");
});

it("accounts for wrapped content and leaves non-paper themes untouched", () => {
  let resize;
  vi.stubGlobal("ResizeObserver", class { constructor(callback) { resize = callback; } observe() {} disconnect() {} });
  const items = ["A long title"];
  const { getByTestId, rerender } = render(<Directory items={items}/>);
  const list = getByTestId("list");
  Object.defineProperty(list, "clientHeight", { value: 400 });
  Object.defineProperty(list.querySelector(".mailbox-list-heading"), "offsetHeight", { value: 60 });
  Object.defineProperty(list.querySelector(".mailbox-list-meta"), "offsetHeight", { value: 40 });
  resize();
  expect(parseFloat(list.style.getPropertyValue("--information-paper-row-height"))).toBe(183.5);
  rerender(<Directory items={items} enabled={false}/>);
  resize();
  expect(list.style.getPropertyValue("--information-paper-row-height")).toBe("");
});
