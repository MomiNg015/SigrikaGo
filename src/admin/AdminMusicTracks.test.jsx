import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminMusicTracks from "./AdminMusicTracks.jsx";

describe("AdminMusicTracks", () => {
  it("renders music track metadata and editor hooks", () => {
    const html = renderToStaticMarkup(
      <AdminMusicTracks
        tracks={{
          "home-default": {
            id: "home-default",
            name: "星炬大厅",
            defaultName: "Default Home BGM",
            type: "home",
            characterId: ""
          }
        }}
        token="token"
        onSaved={vi.fn()}
        onNotice={vi.fn()}
      />
    );

    expect(html).toContain("音乐管理");
    expect(html).toContain("home-default");
    expect(html).toContain("Default Home BGM");
    expect(html).toContain("星炬大厅");
  });
});
