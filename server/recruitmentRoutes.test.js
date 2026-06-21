import { describe, expect, it } from "vitest";
import { createRecruitmentRouteHandlers } from "./recruitmentRoutes.js";

describe("recruitment route handlers", () => {
  it("forwards fast-forward requests for the authenticated user", async () => {
    const calls = [];
    const handlers = createRecruitmentRouteHandlers({
      prisma: { tag: "prisma" },
      fastForwardRecruitmentFn: async (input) => {
        calls.push(input);
        return { task: { id: "task-1", status: "pending" } };
      }
    });
    const response = fakeResponse();

    await handlers.fastForward({ user: { id: "user-1" } }, response);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ task: { id: "task-1", status: "pending" } });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      prisma: { tag: "prisma" },
      userId: "user-1"
    });
    expect(calls[0].now).toBeInstanceOf(Date);
  });
});

function fakeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}
