import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import UserIdentity from "./UserIdentity.jsx";

describe("UserIdentity", () => {
  it("renders equipped title, badge, and username background assets", () => {
    const markup = renderToStaticMarkup(
      <UserIdentity
        user={{
          username: "Moming",
          achievementEquipmentAssets: {
            title: { name: "Semantic Keeper", text: "语义守夜人" },
            badge: { name: "Rune Badge", imageUrl: "/assets/badge.png" },
            nameplate: { name: "Rune Nameplate", imageUrl: "/assets/nameplate.png" }
          }
        }}
      />
    );

    expect(markup).toContain("user-identity has-nameplate has-title has-emblem");
    expect(markup).toContain("user-identity-name-tag");
    expect(markup).toContain("background-image:url(/assets/nameplate.png)");
    expect(markup).toContain("语义守夜人");
    expect(markup).toContain("src=\"/assets/badge.png\"");
    expect(markup).toContain("Moming");
  });

  it("can suppress nameplate skin when a larger parent plaque owns the background", () => {
    const markup = renderToStaticMarkup(
      <UserIdentity
        showNameplate={false}
        user={{
          username: "Moming",
          achievementEquipmentAssets: {
            nameplate: { name: "Rune Nameplate", imageUrl: "/assets/nameplate.png" }
          }
        }}
      />
    );

    expect(markup).toContain("user-identity-name-tag");
    expect(markup).not.toContain("background-image:url(/assets/nameplate.png)");
    expect(markup).toContain("Moming");
  });

  it("does not change font size from username length", () => {
    const shortMarkup = renderToStaticMarkup(
      <UserIdentity user={{ username: "李白" }} />
    );
    const longMarkup = renderToStaticMarkup(
      <UserIdentity user={{ username: "Moming88" }} />
    );

    expect(shortMarkup).not.toContain("--user-identity-fit-font-size");
    expect(longMarkup).not.toContain("--user-identity-fit-font-size");
    expect(shortMarkup).toContain("李白");
    expect(longMarkup).toContain("Moming88");
  });
});
