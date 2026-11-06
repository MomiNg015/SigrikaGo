import http from "node:http";
import { afterEach, expect, it } from "vitest";
import { api } from "./client.js";

let server;
afterEach(async () => {
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
});
async function stalledResponse(contentType = "application/json") {
  let started;
  const bodyStarted = new Promise((resolve) => { started = resolve; });
  server = http.createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": contentType });
    response.write(contentType === "application/json" ? '{"value":' : "partial");
    started();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { url: `http://127.0.0.1:${server.address().port}/probe`, bodyStarted };
}
it.each(["application/json", "text/plain"])("times out a stalled %s response body", async (contentType) => {
  const { url } = await stalledResponse(contentType);
  await expect(api(url, { requestTimeoutMs: 100 })).rejects.toThrow("请求超时");
});
it("honors caller cancellation after response headers", async () => {
  const { url, bodyStarted } = await stalledResponse();
  const controller = new AbortController();
  const result = api(url, { signal: controller.signal }).catch((error) => error);
  await bodyStarted;
  await new Promise((resolve) => setTimeout(resolve, 25));
  controller.abort();
  expect(await result).toMatchObject({ name: "AbortError" });
});
