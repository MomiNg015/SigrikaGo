// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useWarehouseListRows } from "./useWarehouseListRows.js";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function Directory({ enabled = true }) {
  const ref = useWarehouseListRows(enabled);
  return <div ref={ref} data-testid="list" style={{ rowGap: "12px", padding: "3px 8px 8px 3px", "--warehouse-row-min": "82px" }}/>;
}

it("refits observed geometry, ignores unavailable layout and disconnects when disabled", () => {
  let notify;
  const disconnect = vi.fn(), observe = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback) { notify = callback; }
    observe = observe;
    disconnect = disconnect;
  });
  const { getByTestId, rerender } = render(<Directory/>);
  const list = getByTestId("list");
  expect(observe).toHaveBeenCalledWith(list);
  expect(list.style.getPropertyValue("--warehouse-row-height")).toBe("");
  Object.defineProperty(list, "clientHeight", { value: 400, configurable: true });
  notify();
  const original = list.style.getPropertyValue("--warehouse-row-height");
  expect(parseFloat(original)).toBeGreaterThanOrEqual(82);
  Object.defineProperty(list, "clientHeight", { value: 250, configurable: true });
  notify();
  expect(list.style.getPropertyValue("--warehouse-row-height")).not.toBe(original);
  rerender(<Directory enabled={false}/>);
  expect(disconnect).toHaveBeenCalledOnce();
});
