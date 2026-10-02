import { describe, expect, it } from "vitest";
import {
  DEFAULT_IRIS_LINKS,
  irisLinksFromSettings,
  irisLinksSettingJson,
  normalizeIrisLinks
} from "./irisLinks.js";

describe("IRIS friendly-link settings", () => {
  it("normalizes safe links and derives their display host", () => {
    expect(normalizeIrisLinks([
      {
        title: "棋谱资料",
        description: "公开棋谱",
        href: "https://www.example.com/path"
      },
      {
        title: "不安全链接",
        description: "",
        href: "javascript:alert(1)"
      }
    ])).toEqual([
      {
        title: "棋谱资料",
        description: "公开棋谱",
        href: "https://www.example.com/path",
        host: "example.com"
      }
    ]);
  });

  it("supports an intentionally empty list and falls back on malformed JSON", () => {
    expect(irisLinksFromSettings({ irisLinks: "[]" })).toEqual([]);
    expect(irisLinksFromSettings({ irisLinks: "{broken" })).toHaveLength(DEFAULT_IRIS_LINKS.length);
    expect(JSON.parse(irisLinksSettingJson(DEFAULT_IRIS_LINKS))).toHaveLength(DEFAULT_IRIS_LINKS.length);
  });
});
