import { describe, expect, it } from "vitest";

import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("profile mobile layout contracts", () => {
  it("keeps the mobile profile name under the portrait and recent results on one row", () => {
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(finalMobileCss).toContain(".user-profile-card .profile-resume-hero .profile-identity-block");
    expect(finalMobileCss).toContain("grid-column: 1 !important");
    expect(finalMobileCss).toContain("grid-row: 2 !important");
    expect(finalMobileCss).toContain("max-width: 150px !important");
    expect(finalMobileCss).toContain("grid-template-columns: repeat(10, minmax(0, 1fr)) !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-rank-results .recent-result-marker");
    expect(finalMobileCss).toContain("width: clamp(20px, 5.8vw, 30px) !important");
    expect(finalMobileCss).toContain("font-size: clamp(10px, 3vw, 15px) !important");
    expect(finalMobileCss).toContain("word-break: keep-all !important");
  });
});
