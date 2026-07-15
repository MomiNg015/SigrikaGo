// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import ChatBox from "./ChatBox.jsx";

const ROOM = { code: "12345", players: [], chat: [] };

describe("ChatBox embedded draft", () => {
  afterEach(cleanup);

  it("keeps the draft when its mounted tab panel is hidden and shown again", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ChatPanel hidden={false} />);
    const input = screen.getByPlaceholderText("输入聊天内容");

    await user.type(input, "尚未发送的草稿");
    rerender(<ChatPanel hidden />);
    rerender(<ChatPanel hidden={false} />);

    expect(screen.getByPlaceholderText("输入聊天内容").value).toBe("尚未发送的草稿");
  });
});

function ChatPanel({ hidden }) {
  return (
    <div hidden={hidden}>
      <ChatBox room={ROOM} onChat={() => {}} presentation="embedded" />
    </div>
  );
}
