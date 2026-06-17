import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import UserIdentity, { userIdentityFitFontSize } from "./UserIdentity.jsx";

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

  it("exposes a fit font-size for legacy long usernames", () => {
    expect(userIdentityFitFontSize("moming")).toBeNull();
    expect(userIdentityFitFontSize("0337_win_a")).toBe("0.860em");

    const markup = renderToStaticMarkup(
      <UserIdentity user={{ username: "0337_win_a" }} />
    );

    expect(markup).toContain("--user-identity-fit-font-size:0.860em");
    expect(markup).toContain("0337_win_a");
  });
});
