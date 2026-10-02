import { describe, expect, it } from "vitest";
import { createHealthRouteHandlers } from "./healthRoutes.js";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

describe("health route handlers", () => {
  it("reports liveness independently from admission state", () => {
    const handlers = createHealthRouteHandlers({ runtimeServiceState: {} });
    const res = createResponse();

    handlers.live({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, status: "live" });
  });

  it("reports readiness as unavailable while draining", () => {
    const handlers = createHealthRouteHandlers({
      runtimeServiceState: {
        readiness: () => ({ ok: false, status: "draining", reason: "server-shutdown" })
      }
    });
    const res = createResponse();

    handlers.ready({}, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ ok: false, status: "draining", reason: "server-shutdown" });
  });
});
