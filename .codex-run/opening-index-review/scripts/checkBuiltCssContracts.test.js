import { describe, expect, it } from "vitest";
import { assertBuiltCssContracts } from "./check-built-css-contracts.mjs";

const selector = ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .modal-backdrop";

describe("built CSS contracts", () => {
  it("accepts the standard no-blur declaration in the production owner", () => {
    expect(() => assertBuiltCssContracts(
      `${selector}{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#3d2b2561!important}`
    )).not.toThrow();
  });

  it("rejects a production owner that retains only the prefixed declaration", () => {
    expect(() => assertBuiltCssContracts(
      `${selector}{-webkit-backdrop-filter:none!important;background:#3d2b2561!important}`
    )).toThrow("Built CSS dropped backdrop-filter:none!important");
  });
});
