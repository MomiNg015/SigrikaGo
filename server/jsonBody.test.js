import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { apiErrorHandler, requestBodyErrorHandler } from "./httpErrors.js";
import {
  DEFAULT_JSON_BODY_LIMIT,
  STORY_SCRIPT_JSON_BODY_LIMIT,
  createJsonBodyParser,
  isAdminStoryScriptWrite
} from "./jsonBody.js";

const openServers = new Set();

afterEach(async () => {
  await Promise.all([...openServers].map((server) => new Promise((resolve) => server.close(resolve))));
  openServers.clear();
});

describe("JSON body parsing", () => {
  it("selects the larger budget only for one story-script PATCH resource", () => {
    expect(DEFAULT_JSON_BODY_LIMIT).toBe("64kb");
    expect(STORY_SCRIPT_JSON_BODY_LIMIT).toBe("2mb");
    expect(isAdminStoryScriptWrite({ method: "PATCH", path: "/api/admin/story-scripts/onboarding.default" })).toBe(true);
    expect(isAdminStoryScriptWrite({ method: "GET", path: "/api/admin/story-scripts/onboarding.default" })).toBe(false);
    expect(isAdminStoryScriptWrite({ method: "PATCH", path: "/api/admin/story-scripts" })).toBe(false);
    expect(isAdminStoryScriptWrite({ method: "PATCH", path: "/api/admin/site-settings" })).toBe(false);
  });

  it("accepts a story draft above 64kb while unrelated JSON keeps the default budget", async () => {
    const app = express();
    app.use(createJsonBodyParser());
    app.use(requestBodyErrorHandler);
    app.patch("/api/admin/story-scripts/:key", echoBodySize);
    app.patch("/api/admin/site-settings", echoBodySize);
    app.use("/api", apiErrorHandler);
    const baseUrl = await listen(app);
    const body = { text: "剧".repeat(70 * 1024) };

    const storyResponse = await patchJson(`${baseUrl}/api/admin/story-scripts/onboarding.default`, body);
    const unrelatedResponse = await patchJson(`${baseUrl}/api/admin/site-settings`, body);

    expect(storyResponse.status).toBe(200);
    expect(await storyResponse.json()).toEqual({ textLength: 70 * 1024 });
    expect(unrelatedResponse.status).toBe(413);
    expect(await unrelatedResponse.json()).toEqual({
      error: "请求内容过大，请减少提交内容后重试",
      code: "REQUEST_BODY_TOO_LARGE"
    });
  });

  it("returns localized JSON when a story draft exceeds 2mb", async () => {
    const app = express();
    app.use(createJsonBodyParser());
    app.use(requestBodyErrorHandler);
    app.patch("/api/admin/story-scripts/:key", echoBodySize);
    app.use("/api", apiErrorHandler);
    const baseUrl = await listen(app);

    const response = await patchJson(`${baseUrl}/api/admin/story-scripts/onboarding.default`, {
      text: "x".repeat(2 * 1024 * 1024)
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "剧情脚本草稿超过 2mb 上限，请拆分剧情或精简节点后重试",
      code: "REQUEST_BODY_TOO_LARGE"
    });
  });
});

function echoBodySize(req, res) {
  res.json({ textLength: req.body.text.length });
}

function patchJson(url, body) {
  return fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function listen(app) {
  const server = await new Promise((resolve) => {
    const nextServer = app.listen(0, "127.0.0.1", () => resolve(nextServer));
  });
  openServers.add(server);
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}
