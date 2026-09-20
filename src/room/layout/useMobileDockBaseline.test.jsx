// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useMobileDockBaseline } from "./useMobileDockBaseline.js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Fixture() {
  const { viewportRef, dockRef, tabsRef, actionsRef } = useMobileDockBaseline(true);
  return <section ref={viewportRef} data-testid="viewport">
    <section ref={dockRef} data-part="dock" style={{ border: "2px solid black" }}>
      <div ref={tabsRef} data-part="tabs" />
      <div ref={actionsRef} data-part="actions" hidden />
    </section>
  </section>;
}

it("anchors to actions, ignores the selected dock height and remeasures action changes", () => {
  const heights = { dock: 200, tabs: 51, actions: 64 };
  let notify;
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback) { notify = callback; }
    observe() {}
    disconnect = disconnect;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
    return { height: heights[this.dataset.part] || 0 };
  });
  const view = render(<Fixture />);
  const viewport = view.getByTestId("viewport");
  const height = () => viewport.style.getPropertyValue("--mobile-action-dock-height");
  expect(height()).toBe("119px");
  heights.dock = 320;
  act(() => notify());
  expect(height()).toBe("119px");
  heights.actions = 90;
  act(() => notify());
  expect(height()).toBe("145px");
  view.unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(height()).toBe("");
});
