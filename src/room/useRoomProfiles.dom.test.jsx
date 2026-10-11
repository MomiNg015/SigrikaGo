// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { useRoomProfiles } from "./useRoomProfiles.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
vi.mock("../modals/UserProfileCard.jsx", () => ({ UserProfileCard: ({ user, onClose }) => <section data-testid="profile" data-relation={user.relation}>{user.username}<button onClick={onClose}>close profile</button></section> }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function Fixture({ roomKey = "r", token = "token" }) {
  const { openProfile, profileLayer } = useRoomProfiles({ roomKey, token, user: { id: "a" } });
  return <><button onClick={() => openProfile({ id: "a" })}>A</button><button onClick={() => openProfile({ id: "b" })}>B</button><button onClick={() => openProfile({ id: "bot", isBot: true })}>Bot</button>{profileLayer}</>;
}

it("ignores an older response after another person is opened", async () => {
  let finishFirst;
  api.mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; })).mockResolvedValueOnce({ profile: { id: "b", username: "Beta" } });
  render(<Fixture />);
  fireEvent.click(screen.getByText("A"));
  fireEvent.click(screen.getByText("B"));
  await screen.findByText("Beta");
  await act(async () => finishFirst({ profile: { id: "a", username: "Alpha" } }));
  expect(screen.queryByText("Alpha")).toBeNull();
  expect(screen.getByText("Beta")).toBeTruthy();
});

it.each(["close", "room", "token"])("does not reopen after %s invalidates a pending request", async (reason) => {
  let finish;
  api.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const view = render(<Fixture />);
  fireEvent.click(screen.getByText("A"));
  if (reason === "close") fireEvent.click(screen.getByText("关闭"));
  else view.rerender(<Fixture roomKey={reason === "room" ? "next" : "r"} token={reason === "token" ? "next-token" : "token"} />);
  await act(async () => finish({ profile: { id: "a", username: "Alpha" } }));
  expect(screen.queryByTestId("profile")).toBeNull();
});

it("supports retry, self restrictions and bot exclusion", async () => {
  api.mockRejectedValueOnce(new Error("暂时无法读取")).mockResolvedValueOnce({ profile: { id: "a", username: "Alpha", relation: "none" } });
  render(<Fixture />);
  fireEvent.click(screen.getByText("Bot"));
  expect(api).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("A"));
  await screen.findByText("暂时无法读取");
  fireEvent.click(screen.getByText("重试"));
  await waitFor(() => expect(screen.getByTestId("profile").dataset.relation).toBe("self"));
});
