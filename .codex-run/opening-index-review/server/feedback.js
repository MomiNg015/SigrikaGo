export const FEEDBACK_MAX_LENGTH = 400;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

export function validateFeedbackContent(input) {
  const value = String(input ?? "").replace(CONTROL_CHARS, "").trim();
  if (!value) return { ok: false, error: "反馈内容不能为空" };
  if (value.length > FEEDBACK_MAX_LENGTH) return { ok: false, error: `反馈内容不能超过 ${FEEDBACK_MAX_LENGTH} 字` };
  return { ok: true, value };
}

export async function createFeedbackMessage({ prisma, user, content }) {
  const validated = validateFeedbackContent(content);
  if (!validated.ok) throw routeError(400, validated.error);
  const feedback = await prisma.feedbackMessage.create({
    data: {
      userId: user.id,
      username: user.username,
      content: validated.value
    }
  });
  return { feedback: toFeedbackPayload(feedback) };
}

export async function listFeedbackMessages({ prisma }) {
  const records = await prisma.feedbackMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return { feedbackMessages: records.map(toFeedbackPayload) };
}

function toFeedbackPayload(record) {
  return {
    id: record.id,
    userId: record.userId,
    username: record.username,
    content: record.content,
    createdAt: new Date(record.createdAt).toISOString()
  };
}

function routeError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
