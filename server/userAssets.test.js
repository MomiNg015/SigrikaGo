import { describe, expect, it } from "vitest";
import {
  parseAssetList,
  parseCharacterAssetList,
  serializeAssetList
} from "./userAssets.js";

describe("user asset list helpers", () => {
  it("parses comma-separated asset lists with trimming and de-duplication", () => {
    expect(parseAssetList(" peach, , peach, paw ")).toEqual(["peach", "paw"]);
  });

  it("parses array asset lists with trimming and de-duplication", () => {
    expect(parseAssetList([" sigrika ", "", "sigrika", "denia"])).toEqual(["sigrika", "denia"]);
  });

  it("normalizes character aliases while parsing owned characters", () => {
    expect(parseCharacterAssetList("danea, denia, sigrika")).toEqual(["denia", "sigrika"]);
  });

  it("serializes user asset lists consistently", () => {
    expect(serializeAssetList([" peach ", "paw", "peach"])).toBe("peach,paw");
  });
});
