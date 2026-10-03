import { createServer as createHttpServer } from "node:http";
import { once } from "node:events";
import { createServer as createViteServer } from "vite";
import { afterEach, describe, expect, it } from "vitest";
import { configureDevApiProxy } from "../vite.config.js";
import { api } from "../src/api/client.js";

const cleanup = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});

async function listen(server, port = 0) {
  server.listen(port, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
}

async function fixture(configure) {
  const reservation = createHttpServer();
  const backendPort = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  const vite = await createViteServer({
    configFile: false,
    appType: "custom",
    logLevel: "silent",
    server: {
      host: "127.0.0.1", port: 0,
      proxy: { "/api": { target: `http://127.0.0.1:${backendPort}`, configure } }
    }
  });
  await vite.listen();
  cleanup.push(() => vite.close());
  const url = `http://127.0.0.1:${vite.httpServer.address().port}/api/announcements?kind=announcement`;
  async function startBackend(handler) {
    const backend = createHttpServer(handler ?? ((_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ items: [{ id: "notice-1", title: "公告" }] }));
    }));
    await listen(backend, backendPort);
    cleanup.push(() => new Promise((resolve) => {
      backend.closeAllConnections();
      backend.close(resolve);
    }));
    return backend;
  }
  return { url, startBackend };
}

describe("local announcement API proxy recovery", () => {
  it("reproduces the original empty non-JSON response with Vite's default proxy", async () => {
    const { url, startBackend } = await fixture();
    const cold = await fetch(url);
    expect(cold.status).toBe(500);
    expect(cold.headers.get("content-type")).toBe("text/plain");
    expect(await cold.text()).toBe("");
    await startBackend();
    expect((await api(url)).items[0].id).toBe("notice-1");
  });

  it("returns an identifiable JSON 503 while the local backend is unavailable", async () => {
    const { url } = await fixture(configureDevApiProxy);
    const cold = await fetch(url);
    expect(cold.status).toBe(503);
    expect(cold.headers.get("content-type")).toContain("application/json");
    expect((await cold.json()).code).toBe("dev_backend_unavailable");
  });

  it("completes the first authenticated announcement read when the backend starts during recovery", async () => {
    const { url, startBackend } = await fixture(configureDevApiProxy);
    const firstRead = api(url, { token: "fixture-token", retryDevBackend: true });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const requests = [];
    await startBackend((request, response) => {
      requests.push(request.headers.authorization);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ items: [{ id: "notice-1" }] }));
    });
    expect((await firstRead).items[0].id).toBe("notice-1");
    expect((await api(url, { token: "fixture-token", retryDevBackend: true })).items[0].id).toBe("notice-1");
    expect(requests).toEqual(["Bearer fixture-token", "Bearer fixture-token"]);
  });

  it("recovers a first-request socket reset without reopening the announcement", async () => {
    const { url, startBackend } = await fixture(configureDevApiProxy);
    let calls = 0;
    await startBackend((request, response) => {
      calls += 1;
      if (calls === 1) return request.socket.destroy();
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ items: [{ id: "notice-1" }] }));
    });
    expect((await api(url, { token: "fixture-token", retryDevBackend: true })).items[0].id).toBe("notice-1");
    expect(calls).toBe(2);
  });
});
