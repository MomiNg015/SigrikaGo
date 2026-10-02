import { describe, expect, it } from "vitest";
import {
  AEMEATH_OWNERSHIP_MIGRATION_MARKER,
  aemeathWelcomeMailboxMessageData,
  markAemeathWelcomeMailNoticeShown,
  migrateLegacyAemeathOwnership,
  newUserInitialOwnedCharacters
} from "./aemeathAcquisition.js";
import { AEMEATH_WELCOME_MAIL } from "../src/shared/aemeathAcquisition.js";
import { RECRUITMENT_ITEMS, RECRUITMENT_ITEM_TYPES } from "../src/shared/recruitment.js";

describe("Aemeath ticket acquisition", () => {
  it("keeps Aemeath out of new-user initial ownership and defines the welcome attachment", () => {
    expect(newUserInitialOwnedCharacters()).toBe("sigrika,denia");
    expect(AEMEATH_WELCOME_MAIL).toEqual({
      sender: "飞行雪绒歌友会",
      title: "飞行雪绒演唱会纪念奖品",
      body: "感谢您参加我们前天举办的飞行雪绒演唱会活动。这是这次活动您抽到的奖品，请收下！希望以后也和我们一起支持飞行雪绒哦~"
    });
    expect(RECRUITMENT_ITEMS[RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket]).toMatchObject({
      name: "飞行雪绒纪念券",
      description: "从飞行雪绒歌友会那里收到的特殊的奖品。上面的儿童画是怎么一回事呢？",
      resultText: "爱弥斯，回应粉丝的期待，闪亮登台！嗯？是想让我加入围棋部吗？哼哼哼，也好，就让你们见识一下我的实力吧！"
    });
    expect(aemeathWelcomeMailboxMessageData("user-1")).toEqual({
      userId: "user-1",
      sender: AEMEATH_WELCOME_MAIL.sender,
      title: AEMEATH_WELCOME_MAIL.title,
      body: AEMEATH_WELCOME_MAIL.body,
      attachmentType: "item",
      attachmentItemId: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket,
      attachmentQuantity: 1
    });
  });

  it("materializes Aemeath ownership for every pre-existing user exactly once", async () => {
    const calls = [];
    const prisma = {
      $transaction: async (callback) => callback(prisma),
      siteSetting: {
        findUnique: async () => null,
        upsert: async (args) => calls.push(["marker", args])
      },
      user: {
        findMany: async () => [
          { id: "legacy-forced", ownedCharacters: "sigrika,denia" },
          { id: "legacy-stored", ownedCharacters: "sigrika,denia,aemeath" }
        ],
        update: async (args) => calls.push(["user.update", args])
      },
      userCharacter: {
        upsert: async (args) => calls.push(["userCharacter.upsert", args])
      }
    };

    await migrateLegacyAemeathOwnership(prisma);

    expect(calls).toContainEqual(["user.update", {
      where: { id: "legacy-forced" },
      data: { ownedCharacters: "sigrika,denia,aemeath" }
    }]);
    expect(calls.filter(([name]) => name === "user.update")).toHaveLength(1);
    expect(calls.filter(([name]) => name === "userCharacter.upsert")).toHaveLength(2);
    expect(calls).toContainEqual(["marker", expect.objectContaining({
      where: { key: AEMEATH_OWNERSHIP_MIGRATION_MARKER }
    })]);
  });

  it("shows the welcome-mail toast only once and only for the system-created welcome mail", async () => {
    const updates = [];
    const prisma = {
      mailboxMessage: {
        findFirst: async (args) => {
          expect(args.where).toMatchObject({
            userId: "user-1",
            batchId: null,
            attachmentItemId: RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket
          });
          return { id: "mail-1" };
        }
      },
      user: {
        updateMany: async (args) => {
          updates.push(args);
          return { count: updates.length === 1 ? 1 : 0 };
        }
      }
    };

    expect(await markAemeathWelcomeMailNoticeShown({ prisma, userId: "user-1" })).toMatchObject({ showNotice: true });
    expect(await markAemeathWelcomeMailNoticeShown({ prisma, userId: "user-1" })).toMatchObject({ showNotice: false });
    expect(updates[0].where).toEqual({ id: "user-1", welcomeMailNoticeShownAt: null });
  });
});
