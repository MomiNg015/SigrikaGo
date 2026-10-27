// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthChallenge } from "./useAuthChallenge.js";
import AuthChallenge from "./AuthChallenge.jsx";
import { loadAuthChallenge } from "./authChallengeApi.js";

vi.mock("./authChallengeApi.js", () => ({ loadAuthChallenge: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const data = (id) => ({ id, image: `data:image/png;base64,${id}`, expiresAt: Date.now() + 300000 });
function Harness({ purpose = "register", onValid = () => {} }) {
  const challenge = useAuthChallenge(true, purpose);
  return <><AuthChallenge challenge={challenge} /><button onClick={() => { if (challenge.validate()) onValid(challenge.proof); }}>Submit</button></>;
}
describe("auth challenge lifecycle", () => {
  it("does not submit without loaded proof and refresh clears a previous answer", async () => {
    loadAuthChallenge.mockResolvedValue(data("first"));
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    await screen.findByAltText("验证码，点击换一张");
    fireEvent.click(screen.getByText("Submit"));
    expect(onValid).not.toHaveBeenCalled();
    expect(document.activeElement.id).toBe("auth-challenge-answer");
    fireEvent.change(document.getElementById("auth-challenge-answer"), { target: { value: "ABC234" } });
    fireEvent.click(screen.getByText("Submit"));
    expect(onValid).toHaveBeenCalledWith({ id: "first", answer: "ABC234" });
    loadAuthChallenge.mockResolvedValue(data("second"));
    fireEvent.click(screen.getByRole("button", { name: "换一张验证码" }));
    await waitFor(() => expect(screen.getByAltText("验证码，点击换一张").src).toContain("second"));
    expect(document.getElementById("auth-challenge-answer").value).toBe("");
  });
  it("aborts stale mode requests and ignores late responses", async () => {
    let resolveFirst;
    loadAuthChallenge.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; })).mockResolvedValue(data("login"));
    const { rerender, unmount } = render(<Harness />);
    const signal = loadAuthChallenge.mock.calls[0][1];
    rerender(<Harness purpose="login" />);
    await screen.findByAltText("验证码，点击换一张");
    await act(async () => resolveFirst(data("stale")));
    expect(signal.aborted).toBe(true);
    expect(screen.getByAltText("验证码，点击换一张").src).toContain("login");
    const currentSignal = loadAuthChallenge.mock.calls[1][1];
    unmount();
    expect(currentSignal.aborted).toBe(true);
  });
  it("offers refresh after fetch failure and rejects an expired challenge", async () => {
    loadAuthChallenge.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ...data("expired"), expiresAt: 1 });
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    await screen.findByText("验证码加载失败，请刷新");
    fireEvent.click(screen.getByRole("button", { name: "换一张验证码" }));
    await screen.findByAltText("验证码，点击换一张");
    fireEvent.click(screen.getByText("Submit"));
    expect(onValid).not.toHaveBeenCalled();
    await screen.findByText("验证码已失效，请重新输入");
  });
});
