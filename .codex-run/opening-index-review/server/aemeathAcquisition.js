import {
  AEMEATH_CHARACTER_ID,
  AEMEATH_WELCOME_MAIL,
  NEW_USER_INITIAL_CHARACTER_IDS
} from "../src/shared/aemeathAcquisition.js";
import { RECRUITMENT_ITEM_TYPES } from "../src/shared/recruitment.js";
import { parseCharacterAssetList, serializeAssetList } from "./userAssets.js";

export const AEMEATH_OWNERSHIP_MIGRATION_MARKER = "migration.aemeath-ticket-acquisition-v1";

export function newUserInitialOwnedCharacters() {
  return serializeAssetList(NEW_USER_INITIAL_CHARACTER_IDS);
}

export function aemeathWelcomeMailboxMessageData(userId) {
  return {
    userId,
    sender: AEMEATH_WELCOME_MAIL.sender,
    title: AEMEATH_WELCOME_MAIL.title,
    body: AEMEATH_WELCOME_MAIL.body,
    attachmentType: "item",
    attachmentItemId: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
    attachmentQuantity: 1
  };
}

export async function migrateLegacyAemeathOwnership(prisma) {
  if (!prisma?.user?.findMany || !prisma?.user?.update) return;
  const run = async (client) => {
    const marker = await client.siteSetting?.findUnique?.({
      where: { key: AEMEATH_OWNERSHIP_MIGRATION_MARKER }
    });
    if (marker?.value === "complete") return;

    const users = await client.user.findMany({
      select: { id: true, ownedCharacters: true }
    });
    for (const user of users) {
      const ownedCharacters = parseCharacterAssetList(user.ownedCharacters);
      if (!ownedCharacters.includes(AEMEATH_CHARACTER_ID)) {
        await client.user.update({
          where: { id: user.id },
          data: { ownedCharacters: serializeAssetList([...ownedCharacters, AEMEATH_CHARACTER_ID]) }
        });
      }
      await client.userCharacter?.upsert?.({
        where: {
          userId_characterSlug: {
            userId: user.id,
            characterSlug: AEMEATH_CHARACTER_ID
          }
        },
        create: {
          userId: user.id,
          characterSlug: AEMEATH_CHARACTER_ID,
          source: "legacy"
        },
        update: {}
      });
    }

    await client.siteSetting?.upsert?.({
      where: { key: AEMEATH_OWNERSHIP_MIGRATION_MARKER },
      create: { key: AEMEATH_OWNERSHIP_MIGRATION_MARKER, value: "complete" },
      update: { value: "complete" }
    });
  };

  if (prisma.$transaction) return prisma.$transaction(run);
  return run(prisma);
}

export async function markAemeathWelcomeMailNoticeShown({ prisma, userId, now = new Date() }) {
  const message = await prisma.mailboxMessage?.findFirst?.({
    where: {
      userId,
      batchId: null,
      sender: AEMEATH_WELCOME_MAIL.sender,
      title: AEMEATH_WELCOME_MAIL.title,
      attachmentType: "item",
      attachmentItemId: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
      attachmentQuantity: 1
    },
    select: { id: true }
  });
  if (!message) return { ok: true, showNotice: false };

  const updated = await prisma.user.updateMany({
    where: { id: userId, welcomeMailNoticeShownAt: null },
    data: { welcomeMailNoticeShownAt: now }
  });
  return { ok: true, showNotice: Number(updated?.count ?? 0) > 0 };
}
