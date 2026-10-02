import { describe, expect, it, vi } from "vitest";
import {
  assertSkillTraitReferences,
  collectTraitReferences,
  deleteSkillTrait,
  ensureSkillTraitSchema,
  migrateBuiltinSkillDescriptions,
  updateSkillTrait,
  validateSkillTraitInput
} from "./skillTraits.js";

describe("skill trait glossary", () => {
  it("validates trimmed names, definitions, length, and brackets", () => {
    expect(validateSkillTraitInput({ name: " 疾走 ", definition: " 释义 ", sortOrder: 1 })).toEqual({
      id: "",
      name: "疾走",
      definition: "释义",
      sortOrder: 1
    });
    expect(() => validateSkillTraitInput({ name: "", definition: "释义" })).toThrow("名称不能为空");
    expect(() => validateSkillTraitInput({ name: "123456789", definition: "释义" })).toThrow("最多 8 个字符");
    expect(() => validateSkillTraitInput({ name: "【疾走", definition: "释义" })).toThrow("不能包含");
    expect(() => validateSkillTraitInput({ name: "疾走", definition: "" })).toThrow("释义不能为空");
  });

  it("rejects unknown and duplicate references in base and derived descriptions", async () => {
    const prisma = {
      skillTrait: {
        findMany: vi.fn(async () => [{ name: "疾走" }, { name: "派生" }])
      }
    };
    await expect(assertSkillTraitReferences(prisma, {
      name: "重复技能",
      description: "【疾走】正文【疾走】",
      paramsJson: "{}"
    })).rejects.toThrow("重复引用");
    await expect(assertSkillTraitReferences(prisma, {
      name: "基础技能",
      description: "普通正文",
      paramsJson: JSON.stringify({
        derivedSkills: [{ name: "远航星", description: "正文【未知】" }]
      })
    })).rejects.toThrow("远航星引用了未知特性词【未知】");
  });

  it("finds exact base and derived reference locations", () => {
    const references = collectTraitReferences([{
      id: "character-1",
      slug: "aemeath",
      name: "爱弥斯",
      skill: {
        id: "skill-1",
        effectType: "hidden-hand",
        name: "小爱出击",
        description: "普通正文",
        paramsJson: JSON.stringify({
          derivedSkills: [{ effectType: "voyage-star", name: "远航星", description: "【派生】正文" }]
        })
      }
    }], "派生");

    expect(references).toEqual([expect.objectContaining({
      characterSlug: "aemeath",
      characterName: "爱弥斯",
      skillType: "derived",
      skillId: "voyage-star",
      skillName: "远航星"
    })]);
  });

  it("renames exact references atomically across base and derived descriptions", async () => {
    const updates = [];
    const before = { id: "trait-1", name: "疾走", definition: "旧释义", sortOrder: 0 };
    const tx = {
      skillTrait: {
        findUnique: vi.fn(async ({ where }) => where.id ? before : null),
        update: vi.fn(async ({ data }) => ({ ...before, ...data }))
      },
      character: {
        findMany: vi.fn(async () => [{
          id: "character-1",
          slug: "aemeath",
          name: "爱弥斯",
          skill: {
            id: "skill-1",
            effectType: "hidden-hand",
            name: "小爱出击",
            description: "前文【疾走】后文",
            paramsJson: JSON.stringify({
              derivedSkills: [{ effectType: "voyage-star", name: "远航星", description: "【派生】【疾走】正文" }]
            })
          }
        }])
      },
      characterSkill: {
        update: vi.fn(async (query) => {
          updates.push(query);
          return query.data;
        })
      },
      adminAuditLog: { create: vi.fn(async () => ({})) }
    };
    const prisma = { $transaction: (callback) => callback(tx) };

    await updateSkillTrait({
      prisma,
      adminUser: { id: "admin-1" },
      traitId: "trait-1",
      input: { name: "迅行", definition: "新释义", sortOrder: 2 }
    });

    expect(updates).toHaveLength(1);
    expect(updates[0].data.description).toBe("前文【迅行】后文");
    expect(JSON.parse(updates[0].data.paramsJson).derivedSkills[0].description).toBe("【派生】【迅行】正文");
    expect(tx.skillTrait.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { name: "迅行", definition: "新释义", sortOrder: 2 }
    }));
    expect(tx.adminAuditLog.create).toHaveBeenCalledTimes(1);
  });

  it("blocks deletion while returning reference locations", async () => {
    const before = { id: "trait-1", name: "疾走", definition: "释义", sortOrder: 0 };
    const tx = {
      skillTrait: {
        findUnique: vi.fn(async () => before),
        delete: vi.fn()
      },
      character: {
        findMany: vi.fn(async () => [{
          id: "character-1",
          slug: "sigrika",
          name: "西格莉卡",
          skill: {
            id: "skill-1",
            effectType: "erase-point",
            name: "星辉符文",
            description: "【疾走】正文",
            paramsJson: "{}"
          }
        }])
      }
    };
    const prisma = { $transaction: (callback) => callback(tx) };

    let receivedError = null;
    try {
      await deleteSkillTrait({ prisma, adminUser: { id: "admin-1" }, traitId: "trait-1" });
    } catch (error) {
      receivedError = error;
    }
    expect(receivedError?.status).toBe(409);
    expect(receivedError?.details?.references).toEqual([
      expect.objectContaining({ characterSlug: "sigrika", skillName: "星辉符文" })
    ]);
    expect(tx.skillTrait.delete).not.toHaveBeenCalled();
  });

  it("migrates only exact builtin fragments and leaves unrelated custom prose intact", async () => {
    const updates = [];
    const prisma = {
      character: {
        findMany: vi.fn(async () => [{
          slug: "changli",
          skill: {
            id: "skill-1",
            effectType: "double-move",
            description: "【仅限对手发动过主动技能后才可以发动】本回合，获得一把“飞刀”（使用该技能不消耗本次落子）。超频：3",
            paramsJson: "{}"
          }
        }, {
          slug: "custom-double-move",
          skill: {
            id: "skill-2",
            effectType: "double-move",
            description: "管理员自定义的完整描述",
            paramsJson: "{}"
          }
        }, {
          slug: "changli",
          skill: {
            id: "skill-4",
            effectType: "double-move",
            description: "管理员自定义超频：30天内可发动。",
            paramsJson: "{}"
          }
        }, {
          slug: "aemeath",
          skill: {
            id: "skill-3",
            effectType: "hidden-hand",
            description: "本轮落子为隐藏手。超频：0",
            paramsJson: JSON.stringify({
              derivedSkills: [{
                effectType: "voyage-star",
                description: "派生技，正文（该技能不消耗落子回合）。超频：5"
              }]
            })
          }
        }])
      },
      characterSkill: {
        update: vi.fn(async (query) => {
          updates.push(query);
          return query.data;
        })
      }
    };

    await migrateBuiltinSkillDescriptions(prisma);

    expect(updates).toHaveLength(2);
    expect(updates[0].data.description).toBe("【禁先】【疾走】本回合，获得一把“飞刀”。");
    expect(updates.some((update) => update.where.id === "skill-2")).toBe(false);
    expect(updates.some((update) => update.where.id === "skill-4")).toBe(false);
    const derivedUpdate = updates.find((update) => update.where.id === "skill-3");
    expect(derivedUpdate.data.description).toBe("本轮落子为隐藏手。");
    expect(JSON.parse(derivedUpdate.data.paramsJson).derivedSkills[0].description).toBe("【派生】【疾走】正文。");
  });

  it("creates the runtime table and unique name index", async () => {
    const statements = [];
    await ensureSkillTraitSchema({
      $executeRawUnsafe: vi.fn(async (statement) => statements.push(statement))
    });
    expect(statements.join("\n")).toContain('CREATE TABLE IF NOT EXISTS "SkillTrait"');
    expect(statements.join("\n")).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "SkillTrait_name_key"');
  });
});
