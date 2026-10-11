// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import SpectatorGallery, { useSpectatorPresence } from "./SpectatorGallery.jsx";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (callback) => setTimeout(callback, 0));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const characters = [{ id: "custom", portrait: "/default.png" }];
const watcher = { id: "w", username: "观众", selectedCharacter: "custom", equippedCostumes: { custom: { portraitUrl: "/outfit.png" } } };
const shell = (children) => <div className="app-shell"><main className="room-screen">{children}</main></div>;

it("falls back twice while keeping the correct profile trigger available", () => {
  const open = vi.fn();
  const { container } = render(shell(<SpectatorGallery entries={[{ user: watcher, slot: 0, seed: 5 }]} characters={characters} onOpenUser={open} />));
  expect(container.querySelector("img").getAttribute("src")).toBe("/outfit.png");
  fireEvent.error(container.querySelector("img"));
  expect(container.querySelector("img").getAttribute("src")).toBe("/default.png");
  fireEvent.error(container.querySelector("img"));
  expect(container.querySelector("img")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "查看观众的详细信息" }));
  expect(open).toHaveBeenCalledWith(watcher);
});

it("does not open a profile after page scrolling, but accepts the next tap and keyboard activation", () => {
  const open = vi.fn();
  render(shell(<SpectatorGallery entries={[{ user: watcher, slot: 0, seed: 5 }]} characters={characters} onOpenUser={open} />));
  const button = screen.getByRole("button", { name: "查看观众的详细信息" });
  fireEvent.pointerDown(button);
  fireEvent.scroll(window);
  fireEvent.click(button, { detail: 1 });
  expect(open).not.toHaveBeenCalled();
  fireEvent.pointerDown(button);
  fireEvent.click(button, { detail: 1 });
  fireEvent.click(button, { detail: 0 });
  expect(open).toHaveBeenCalledTimes(2);
  const label = screen.getByRole("button", { name: "观众", exact: true });
  fireEvent.pointerDown(label);
  fireEvent.scroll(window);
  fireEvent.click(label, { detail: 1 });
  expect(open).toHaveBeenCalledTimes(2);
  fireEvent.pointerDown(label);
  fireEvent.click(label, { detail: 1 });
  expect(open).toHaveBeenLastCalledWith(watcher);
  expect(open).toHaveBeenCalledTimes(3);
});

it("keeps centers and DOM through snapshots and restores a returning viewer without animation", () => {
  function Fixture({ ids }) {
    const entries = useSpectatorPresence({ code: "r", spectators: ids.map((id) => ({ user: { ...watcher, id } })) });
    return shell(<SpectatorGallery entries={entries} characters={characters} onOpenUser={() => {}} />);
  }
  const view = render(<Fixture ids={["a"]} />);
  const first = view.container.querySelector('[data-spectator-id="a"]');
  const center = [first.dataset.centerX, first.dataset.centerY];
  expect(first.parentElement.className).not.toContain("spectator-arriving");
  view.rerender(<Fixture ids={["a", "b"]} />);
  expect(view.container.querySelector('[data-spectator-id="b"]').parentElement.className).toContain("spectator-arriving");
  view.rerender(<Fixture ids={["a", "b"]} />);
  expect(view.container.querySelector('[data-spectator-id="a"]')).toBe(first);
  expect([first.dataset.centerX, first.dataset.centerY]).toEqual(center);
  view.rerender(<Fixture ids={["a"]} />);
  view.rerender(<Fixture ids={["a", "b"]} />);
  expect(view.container.querySelector('[data-spectator-id="b"]').parentElement.className).not.toContain("spectator-arriving");
});
