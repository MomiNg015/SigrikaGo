export function serializeAudit(value) {
  if (value == null) return null;
  return JSON.stringify(value);
}

export async function writeAudit(prisma, adminUser, action, targetId, before, after, targetType = "user") {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: adminUser.id,
      action,
      targetType,
      targetId,
      beforeJson: serializeAudit(before),
      afterJson: serializeAudit(after)
    }
  });
}
