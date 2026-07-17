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
            nameplate: { id: "rune-nameplate", name: "Rune Nameplate", imageUrl: "/assets/nameplate.png" }
          }
        }}
      />
    );

    expect(markup).toContain("user-identity has-nameplate has-title has-emblem");
    expect(markup).toContain('data-nameplate-id="rune-nameplate"');
    expect(markup).toContain("user-identity-name-tag");
    expect(markup).toContain("user-identity-nameplate-background");
    expect(markup).toContain('class="user-identity-nameplate-effect" aria-hidden="true"');
    expect(markup).toContain("user-identity-nameplate-glow");
    expect(markup).toContain("user-identity-nameplate-core");
    expect(markup).toContain("user-identity-nameplate-sweep");
    expect(markup).toContain("user-identity-nameplate-sparkles");
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

  it("keeps asset-specific hooks data-driven without changing generic nameplates", () => {
    const semanticMarkup = renderToStaticMarkup(
      <UserIdentity
        user={{
          username: "语义守夜",
          achievementEquipmentAssets: {
            nameplate: {
              id: "reward-sigrika-spark-100-wins-nameplate",
              imageUrl: "/assets/achievements/semantic-nameplate.png"
            }
          }
        }}
      />
    );
    const genericMarkup = renderToStaticMarkup(
      <UserIdentity
        user={{
          username: "LegacyUsernameThatNeedsEllipsis",
          achievementEquipmentAssets: {
            nameplate: { id: "plain-nameplate", imageUrl: "/assets/plain-nameplate.png" }
          }
        }}
      />
    );
    const deniaMarkup = renderToStaticMarkup(
      <UserIdentity
        user={{
          username: "泡影留心",
          achievementEquipmentAssets: {
            nameplate: {
              id: "reward-denia-spark-100-wins-nameplate",
              imageUrl: "/assets/achievements/denia-spark-100-wins-nameplate.png"
            }
          }
        }}
      />
    );

    expect(semanticMarkup).toContain('data-nameplate-id="reward-sigrika-spark-100-wins-nameplate"');
    expect(semanticMarkup).toContain("语义守夜");
    expect(deniaMarkup).toContain('data-nameplate-id="reward-denia-spark-100-wins-nameplate"');
    expect(deniaMarkup).toContain("background-image:url(/assets/achievements/denia-spark-100-wins-nameplate.png)");
    expect(deniaMarkup).toContain("泡影留心");
    expect(genericMarkup).toContain('data-nameplate-id="plain-nameplate"');
    expect(genericMarkup).not.toContain("reward-sigrika-spark-100-wins-nameplate");
    expect(genericMarkup).not.toContain("reward-denia-spark-100-wins-nameplate");
    expect(genericMarkup).not.toContain("--user-identity-fit-font-size");
  });
});
