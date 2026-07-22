import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY_DIRECTIVES, HELMET_OPTIONS } from "./securityHeaders.js";

describe("production security headers", () => {
  it("allows Pixi image-decoder Blob workers without loosening page scripts", () => {
    expect(CONTENT_SECURITY_POLICY_DIRECTIVES.workerSrc).toEqual(["'self'", "blob:"]);
    expect(CONTENT_SECURITY_POLICY_DIRECTIVES.scriptSrc).toEqual(["'self'"]);
    expect(CONTENT_SECURITY_POLICY_DIRECTIVES.scriptSrc).not.toContain("blob:");
    expect(HELMET_OPTIONS.contentSecurityPolicy.directives).toBe(CONTENT_SECURITY_POLICY_DIRECTIVES);
  });
});
