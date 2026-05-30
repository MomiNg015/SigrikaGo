import path from "node:path";
import { describe, expect, test } from "vitest";
import { resolveCharacterUploadDir, resolveUploadRoot } from "./uploadPaths.js";

describe("upload path resolution", () => {
  const projectRoot = path.resolve("C:/apps/sigrikago");

  test("defaults uploads to public/uploads under the project root", () => {
    expect(resolveUploadRoot({ env: {}, projectRoot })).toBe(path.join(projectRoot, "public", "uploads"));
    expect(resolveCharacterUploadDir({ env: {}, projectRoot })).toBe(path.join(projectRoot, "public", "uploads", "characters"));
  });

  test("uses an absolute UPLOAD_DIR as the persisted uploads root", () => {
    const uploadRoot = path.resolve("C:/data/sigrikago/uploads");

    expect(resolveUploadRoot({ env: { UPLOAD_DIR: uploadRoot }, projectRoot })).toBe(uploadRoot);
    expect(resolveCharacterUploadDir({ env: { UPLOAD_DIR: uploadRoot }, projectRoot })).toBe(path.join(uploadRoot, "characters"));
  });

  test("resolves a relative UPLOAD_DIR from the project root", () => {
    expect(resolveUploadRoot({ env: { UPLOAD_DIR: "var/uploads" }, projectRoot })).toBe(path.join(projectRoot, "var", "uploads"));
  });
});
