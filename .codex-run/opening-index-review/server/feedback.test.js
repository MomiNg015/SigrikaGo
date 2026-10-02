import { describe, expect, it } from "vitest";
import {
  createFeedbackMessage,
  listFeedbackMessages,
  validateFeedbackContent
} from "./feedback.js";

describe("feedback messages", () => {
  it("validates feedback content length and emptiness", () => {
    expect(validateFeedbackContent("  我有一个建议  ")).toEqual({ ok: true, value: "我有一个建议" });
    expect(validateFeedbackContent("   ").ok).toBe(false);
    expect(validateFeedbackContent("x".repeat(400)).ok).toBe(true);
    expect(validateFeedbackContent("x".repeat(401)).ok).toBe(false);
  });

  it("stores normalized feedback with submitter information", async () => {
    const writes = [];
    const prisma = {
      feedbackMessage: {
        create: async ({ data }) => {
          writes.push(data);
          return { id: "feedback-1", createdAt: new Date("2026-05-25T00:00:00Z"), ...data };
        }
      }
    };

    const result = await createFeedbackMessage({
      prisma,
      user: { id: "user-1", username: "alice" },
      content: "  希望增加复盘标记\u0000  "
    });

    expect(result.feedback).toMatchObject({
      id: "feedback-1",
      userId: "user-1",
      username: "alice",
      content: "希望增加复盘标记"
    });
    expect(writes[0]).toEqual({
      userId: "user-1",
      username: "alice",
      content: "希望增加复盘标记"
    });
  });

  it("lists recent feedback for admins", async () => {
    const prisma = {
      feedbackMessage: {
        findMany: async (query) => {
          expect(query).toMatchObject({
            orderBy: { createdAt: "desc" },
            take: 100
          });
          return [{
            id: "feedback-1",
            userId: "user-1",
            username: "alice",
            content: "反馈内容",
            createdAt: new Date("2026-05-25T00:00:00Z")
          }];
        }
      }
    };

    await expect(listFeedbackMessages({ prisma })).resolves.toEqual({
      feedbackMessages: [{
        id: "feedback-1",
        userId: "user-1",
        username: "alice",
        content: "反馈内容",
        createdAt: "2026-05-25T00:00:00.000Z"
      }]
    });
  });
});
