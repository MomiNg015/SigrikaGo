import { expect, test } from "@playwright/test";

test("serves the built app with production-like cache boundaries", async ({ request }) => {
  const index = await request.get("/");
  expect(index.status()).toBe(200);
  expect(index.headers()["cache-control"]).toContain("no-cache");
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
  expect(runtimeAsset.headers()["cache-control"]).toContain("no-cache");

  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["content-type"]).toContain("application/json");
});

test("built image, audio, font and WASM responses retain binary MIME and byte ranges", async ({ request }) => {
  for (const [url, mime] of [
    ["/assets/preload/orange-mascot.png", "image/png"],
    ["/assets/music/godown_clear.ogg", "audio/"],
    ["/assets/voice/aemeath_match_start.ogg", "audio/"],
    ["/assets/fonts/WuWa-Lahai-Roi-Regular.ttf", "font/"],
    ["/engines/gnugo-3.8/gnugo.wasm", "application/wasm"]
  ]) {
    const head = await request.head(url);
    expect(head.status(), url).toBe(200);
    expect(head.headers()["content-type"], url).toContain(mime);
    const chunk = await request.get(url, { headers: { Range: "bytes=0-63" } });
    expect(chunk.status(), url).toBe(206);
    expect(chunk.headers()["content-range"], url).toMatch(/^bytes 0-63\//);
    expect((await chunk.body()).length).toBe(64);
  }
});
