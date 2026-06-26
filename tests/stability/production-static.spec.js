import { expect, test } from "@playwright/test";

test("serves the built app with production-like cache boundaries", async ({ request }) => {
  const index = await request.get("/");
  expect(index.status()).toBe(200);
  const html = await index.text();
  expect(html).toContain("/assets/");
  expect(html).not.toContain("/src/");

  const hashedAssetPath = html.match(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/)?.[1];
  expect(hashedAssetPath).toBeTruthy();

  const hashedAsset = await request.get(hashedAssetPath);
  expect(hashedAsset.status()).toBe(200);
  expect(hashedAsset.headers()["cache-control"]).toContain("max-age=31536000");
  expect(hashedAsset.headers()["cache-control"]).toContain("immutable");

  const runtimeAsset = await request.get("/assets/effects/changli-fire-phoenix.svg");
  expect(runtimeAsset.status()).toBe(200);
  expect(runtimeAsset.headers()["cache-control"] ?? "").not.toContain("immutable");
  expect(runtimeAsset.headers()["cache-control"] ?? "").not.toContain("max-age=31536000");

  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["content-type"]).toContain("application/json");
});
