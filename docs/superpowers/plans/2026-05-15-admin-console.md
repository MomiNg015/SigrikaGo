# Admin Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an extensible in-app admin console for managing users, characters, portraits, skills, and audit logs.

**Architecture:** Add role-protected Express admin APIs, Prisma-backed character and skill configuration, and a React admin console view inside the current single-page app. Public game screens read character data from the backend while shared game rules execute supported skills through a registry keyed by `effectType`.

**Tech Stack:** React 19, Vite, Express 5, Prisma 6, SQLite, JWT, bcryptjs, Vitest, lucide-react.

---

## File Structure

- Modify `prisma/schema.prisma`: add admin/user state fields and new `Character`, `CharacterSkill`, and `AdminAuditLog` models.
- Create `server/adminConfig.js`: parse `ADMIN_USERNAMES`, promote configured users, and expose role/status constants.
- Modify `server/db.js`: include `role` and `status` in safe user payloads.
- Create `server/auth.js`: shared `authHttp`, `requireAdmin`, and banned-user checks.
- Create `server/characters.js`: database seeding, public character read model, validation, and admin character mutations.
- Create `server/skillRegistry.js`: map database-backed skill config to existing skill behavior.
- Create `server/adminRoutes.js`: `/api/admin/*` routes for summary, users, characters, uploads, and audit logs.
- Modify `server/index.js`: mount public character API, admin routes, static uploads, shared auth helpers, and admin promotion.
- Modify `server/rooms.js`: use database-backed character read models when creating rooms and describing skill usage.
- Modify `src/shared/game.js`: accept skill config when using skills while preserving existing built-in behavior as fallback.
- Create `src/shared/characterFallback.js`: current built-in character definitions for initial render and offline fallback.
- Modify `src/shared/characters.js`: re-export fallback data while the app migrates to API-loaded character state.
- Modify `src/main.jsx`: load characters from API, add admin entry, and render admin console views.
- Modify `src/styles.css`: add dense admin console styles matching the existing app.
- Create tests in `server/*.test.js` and update `src/shared/game.test.js`.

## Task 1: Prisma Models And User Payload

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `server/db.js`
- Test: `server/db.test.js`

- [ ] **Step 1: Write the failing public user test**

Create `server/db.test.js`:

```js
import { describe, expect, it } from "vitest";
import { publicUser } from "./db.js";

describe("publicUser", () => {
  it("exposes safe role and status fields without password hash", () => {
    const user = {
      id: "u1",
      username: "admin",
      passwordHash: "secret",
      role: "admin",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 1,
      losses: 2,
      coins: 300,
      selectedCharacter: "sigrika",
      ownedCharacters: "sigrika,danea",
      ownedItems: "",
      ownedDecorations: ""
    };

    expect(publicUser(user)).toEqual({
      id: "u1",
      username: "admin",
      role: "admin",
      status: "active",
      rank: "18级",
      rating: 1000,
      wins: 1,
      losses: 2,
      coins: 300,
      selectedCharacter: "sigrika",
      ownedCharacters: ["sigrika", "danea"],
      ownedItems: [],
      ownedDecorations: []
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run server/db.test.js`

Expected: FAIL because `publicUser` does not include `role` and `status`.

- [ ] **Step 3: Add Prisma fields and models**

Update `prisma/schema.prisma` with these additions:

```prisma
model User {
  id                 String   @id @default(cuid())
  username           String   @unique
  passwordHash       String
  role               String   @default("player")
  status             String   @default("active")
  banReason          String?
  bannedAt           DateTime?
  rank               String   @default("18级")
  rating             Int      @default(1000)
  wins               Int      @default(0)
  losses             Int      @default(0)
  coins              Int      @default(300)
  selectedCharacter  String   @default("sigrika")
  ownedCharacters    String   @default("sigrika,danea")
  ownedItems         String   @default("")
  ownedDecorations   String   @default("")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model Character {
  id             String          @id @default(cuid())
  slug           String          @unique
  name           String
  portraitUrl    String
  portraitSource String          @default("url")
  palette        String          @default("#5d7fe8")
  enabled        Boolean         @default(true)
  sortOrder      Int             @default(0)
  skill          CharacterSkill?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model CharacterSkill {
  id          String    @id @default(cuid())
  characterId String    @unique
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  effectType  String
  name        String
  description String
  uses        Int       @default(1)
  freeTurn    Boolean   @default(false)
  targetRule  String
  paramsJson  String    @default("{}")
  enabled     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model AdminAuditLog {
  id          String   @id @default(cuid())
  adminUserId String
  action      String
  targetType  String
  targetId    String
  beforeJson  String?
  afterJson   String?
  createdAt   DateTime @default(now())
}
```

Keep the existing `GameRecord` model unchanged.

- [ ] **Step 4: Update `publicUser`**

Modify `server/db.js`:

```js
export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role ?? "player",
    status: user.status ?? "active",
    rank: user.rank,
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    coins: user.coins,
    selectedCharacter: user.selectedCharacter,
    ownedCharacters: user.ownedCharacters.split(",").filter(Boolean),
    ownedItems: user.ownedItems.split(",").filter(Boolean),
    ownedDecorations: user.ownedDecorations.split(",").filter(Boolean)
  };
}
```

- [ ] **Step 5: Run tests and Prisma generation**

Run: `npx vitest run server/db.test.js`

Expected: PASS.

Run: `npm run prisma:generate`

Expected: Prisma Client generated successfully.

- [ ] **Step 6: Commit**

```powershell
git add prisma/schema.prisma server/db.js server/db.test.js
git commit -m "Add admin data models"
```

## Task 2: Shared Auth And Admin Promotion

**Files:**
- Create: `server/adminConfig.js`
- Create: `server/auth.js`
- Modify: `server/index.js`
- Test: `server/adminConfig.test.js`

- [ ] **Step 1: Write failing tests for admin username parsing**

Create `server/adminConfig.test.js`:

```js
import { describe, expect, it } from "vitest";
import { adminUsernameSet, isConfiguredAdminUsername } from "./adminConfig.js";

describe("admin config", () => {
  it("parses comma separated admin usernames", () => {
    expect([...adminUsernameSet(" alice, bob ,,carol ")]).toEqual(["alice", "bob", "carol"]);
  });

  it("matches configured admin usernames after trimming", () => {
    expect(isConfiguredAdminUsername("alice", "alice,bob")).toBe(true);
    expect(isConfiguredAdminUsername(" mallory ", "alice,bob")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run server/adminConfig.test.js`

Expected: FAIL because `server/adminConfig.js` does not exist.

- [ ] **Step 3: Implement admin config helpers**

Create `server/adminConfig.js`:

```js
export const USER_ROLES = {
  player: "player",
  admin: "admin"
};

export const USER_STATUS = {
  active: "active",
  banned: "banned"
};

export function adminUsernameSet(value = process.env.ADMIN_USERNAMES ?? "") {
  return new Set(
    String(value)
      .split(",")
      .map((username) => username.trim())
      .filter(Boolean)
  );
}

export function isConfiguredAdminUsername(username, value = process.env.ADMIN_USERNAMES ?? "") {
  return adminUsernameSet(value).has(String(username ?? "").trim());
}

export async function promoteConfiguredAdmins(prisma) {
  const usernames = [...adminUsernameSet()];
  if (usernames.length === 0) return;
  await prisma.user.updateMany({
    where: { username: { in: usernames } },
    data: { role: USER_ROLES.admin }
  });
}

export async function syncConfiguredAdmin(user, prisma) {
  if (!isConfiguredAdminUsername(user.username) || user.role === USER_ROLES.admin) return user;
  return prisma.user.update({
    where: { id: user.id },
    data: { role: USER_ROLES.admin }
  });
}
```

- [ ] **Step 4: Extract auth helpers**

Create `server/auth.js`:

```js
import jwt from "jsonwebtoken";
import { publicUser } from "./db.js";
import { USER_ROLES, USER_STATUS } from "./adminConfig.js";

export function makeAuth({ prisma, jwtSecret }) {
  async function authHttp(req, res, next) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const payload = jwt.verify(token, jwtSecret);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error("missing user");
      if (user.status === USER_STATUS.banned) {
        res.status(403).json({ error: user.banReason ? `账号已封禁：${user.banReason}` : "账号已封禁" });
        return;
      }
      req.user = user;
      next();
    } catch {
      res.status(401).json({ error: "请先登录" });
    }
  }

  function requireAdmin(req, res, next) {
    if (req.user?.role !== USER_ROLES.admin) {
      res.status(403).json({ error: "需要管理员权限" });
      return;
    }
    next();
  }

  return { authHttp, requireAdmin };
}

export function withToken(user, jwtSecret) {
  return {
    token: jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "14d" }),
    user: publicUser(user)
  };
}
```

- [ ] **Step 5: Wire helpers into `server/index.js`**

In `server/index.js`, import and use:

```js
import { makeAuth, withToken } from "./auth.js";
import { promoteConfiguredAdmins, syncConfiguredAdmin, USER_STATUS } from "./adminConfig.js";
```

After constants are created:

```js
const { authHttp, requireAdmin } = makeAuth({ prisma, jwtSecret: JWT_SECRET });
await promoteConfiguredAdmins(prisma);
```

In register/login handlers, call `syncConfiguredAdmin` before `withToken`:

```js
const syncedUser = await syncConfiguredAdmin(user, prisma);
res.json(withToken(syncedUser, JWT_SECRET));
```

In login, reject banned users before issuing the token:

```js
if (user.status === USER_STATUS.banned) {
  res.status(403).json({ error: user.banReason ? `账号已封禁：${user.banReason}` : "账号已封禁" });
  return;
}
```

Remove the old local `withToken` and `authHttp` functions from `server/index.js`.

- [ ] **Step 6: Run tests**

Run: `npx vitest run server/adminConfig.test.js server/db.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add server/adminConfig.js server/auth.js server/index.js server/adminConfig.test.js
git commit -m "Add admin auth foundations"
```

## Task 3: Character Configuration And Skill Registry

**Files:**
- Create: `server/characters.js`
- Create: `server/skillRegistry.js`
- Modify: `src/shared/game.js`
- Modify: `src/shared/game.test.js`
- Test: `server/characters.test.js`

- [ ] **Step 1: Write failing shared rule tests for configured skills**

Append to `src/shared/game.test.js`:

```js
it("uses configured erase-point skill without consuming the turn", () => {
  const state = createGameState([{ color: COLORS.black }]);
  state.turn = COLORS.black;

  const result = useSkill(state, COLORS.black, {
    effectType: "erase-point",
    name: "星辰符文",
    uses: 1,
    freeTurn: true,
    targetRule: "empty-point",
    params: {}
  }, pointId(6, 6));

  expect(result.ok).toBe(true);
  expect(getPoint(result.state, pointId(6, 6)).valid).toBe(false);
  expect(result.state.turn).toBe(COLORS.black);
});

it("uses configured flip-stone skill and consumes the turn", () => {
  const state = createGameState([{ color: COLORS.black }]);
  forceStone(state, 4, 4, COLORS.white);

  const result = useSkill(state, COLORS.black, {
    effectType: "flip-stone",
    name: "染移",
    uses: 1,
    freeTurn: false,
    targetRule: "stone",
    params: {}
  }, pointId(4, 4));

  expect(result.ok).toBe(true);
  expect(getPoint(result.state, pointId(4, 4)).stone).toBe(COLORS.black);
  expect(result.state.turn).toBe(COLORS.white);
});
```

- [ ] **Step 2: Run the shared test to verify it fails**

Run: `npx vitest run src/shared/game.test.js`

Expected: FAIL because `useSkill` currently expects a character id string.

- [ ] **Step 3: Update `useSkill` to accept config or legacy id**

In `src/shared/game.js`, replace `useSkill` with:

```js
export function useSkill(state, color, skillOrCharacterId, targetId) {
  const skill = normalizeSkillConfig(skillOrCharacterId);
  if (state.phase !== "playing") return fail("对局当前不能使用技能");
  if (state.turn !== color) return fail("还没有轮到你");
  if ((state.skillUses[color] ?? 0) <= 0) return fail("技能次数已经用完");
  if (skill.effectType === "erase-point") return erasePoint(state, color, targetId, skill);
  if (skill.effectType === "flip-stone") return flipStone(state, color, targetId, skill);
  return fail("未知角色技能");
}

function normalizeSkillConfig(skillOrCharacterId) {
  if (typeof skillOrCharacterId === "object" && skillOrCharacterId) {
    return {
      effectType: skillOrCharacterId.effectType,
      name: skillOrCharacterId.name,
      uses: skillOrCharacterId.uses ?? 1,
      freeTurn: Boolean(skillOrCharacterId.freeTurn),
      targetRule: skillOrCharacterId.targetRule,
      params: skillOrCharacterId.params ?? {}
    };
  }
  if (skillOrCharacterId === "sigrika") {
    return { effectType: "erase-point", name: "星辰符文", uses: 1, freeTurn: true, targetRule: "empty-point", params: {} };
  }
  if (skillOrCharacterId === "danea") {
    return { effectType: "flip-stone", name: "染移", uses: 1, freeTurn: false, targetRule: "stone", params: {} };
  }
  return { effectType: "unknown", name: "", uses: 0, freeTurn: false, targetRule: "", params: {} };
}
```

Update `erasePoint` and `flipStone` signatures:

```js
export function erasePoint(state, color, id, skill = { name: "星辰符文", freeTurn: true }) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid) return fail("该交叉点已不可用");
  if (point.stone) return fail("只能抹除空交叉点");
  point.valid = false;
  point.mark = null;
  point.neighbors = [];
  for (const other of next.points) {
    other.neighbors = other.neighbors.filter((neighborId) => neighborId !== id);
  }
  next.skillUses[color] -= 1;
  next.ko = null;
  next.history.push({ type: "skill", skill: skill.name, color, id, moveNumber: next.moveNumber });
  return ok(resolveCapturesAfterMutation(next, color, !skill.freeTurn));
}

export function flipStone(state, color, id, skill = { name: "染移" }) {
  const next = cloneState(state);
  const point = getPoint(next, id);
  if (!point?.valid || !point.stone) return fail("必须指定棋盘上的棋子");
  point.stone = opponent(point.stone);
  next.skillUses[color] -= 1;
  next.ko = null;
  next.history.push({ type: "skill", skill: skill.name, color, id, moveNumber: next.moveNumber });
  return ok(resolveCapturesAfterMutation(next, color, true));
}
```

- [ ] **Step 4: Write failing character validation test**

Create `server/characters.test.js`:

```js
import { describe, expect, it } from "vitest";
import { validateCharacterInput } from "./characters.js";

describe("character validation", () => {
  it("accepts an erase-point skill with empty-point target", () => {
    const result = validateCharacterInput({
      slug: "sigrika",
      name: "西格莉卡",
      portraitUrl: "/assets/sigrika_centered.png",
      portraitSource: "url",
      palette: "#ff9b4d",
      enabled: true,
      sortOrder: 1,
      skill: {
        effectType: "erase-point",
        name: "星辰符文",
        description: "抹除一个空点。",
        uses: 1,
        freeTurn: true,
        targetRule: "empty-point",
        paramsJson: "{}",
        enabled: true
      }
    });

    expect(result.ok).toBe(true);
  });

  it("rejects unsupported skill target rules", () => {
    const result = validateCharacterInput({
      slug: "bad",
      name: "坏配置",
      portraitUrl: "/assets/sigrika_centered.png",
      portraitSource: "url",
      skill: {
        effectType: "erase-point",
        name: "坏技能",
        description: "坏配置",
        uses: 1,
        freeTurn: true,
        targetRule: "stone",
        paramsJson: "{}"
      }
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("目标规则");
  });
});
```

- [ ] **Step 5: Implement character helpers**

Create `server/characters.js`:

```js
import { CHARACTERS } from "../src/shared/characters.js";

const EFFECT_TARGETS = {
  "erase-point": "empty-point",
  "flip-stone": "stone"
};

export function validateCharacterInput(input) {
  const slug = String(input.slug ?? "").trim();
  const name = String(input.name ?? "").trim();
  const portraitUrl = String(input.portraitUrl ?? "").trim();
  const skill = input.skill ?? {};
  const effectType = String(skill.effectType ?? "").trim();
  const targetRule = String(skill.targetRule ?? "").trim();
  const uses = Number(skill.uses ?? 1);

  if (!/^[a-z0-9-]{2,40}$/.test(slug)) return { ok: false, error: "角色标识只能包含小写字母、数字和短横线" };
  if (name.length < 1) return { ok: false, error: "角色名称必填" };
  if (portraitUrl.length < 1) return { ok: false, error: "立绘路径必填" };
  if (!EFFECT_TARGETS[effectType]) return { ok: false, error: "不支持的技能效果" };
  if (EFFECT_TARGETS[effectType] !== targetRule) return { ok: false, error: "技能目标规则与效果类型不匹配" };
  if (!Number.isInteger(uses) || uses < 0 || uses > 9) return { ok: false, error: "技能次数必须是 0 到 9 的整数" };
  try {
    JSON.parse(skill.paramsJson ?? "{}");
  } catch {
    return { ok: false, error: "技能参数必须是有效 JSON" };
  }
  return { ok: true };
}

export function toCharacterPayload(record) {
  return {
    id: record.slug,
    dbId: record.id,
    name: record.name,
    palette: record.palette,
    portrait: record.portraitUrl,
    enabled: record.enabled,
    skill: {
      id: record.skill?.effectType,
      effectType: record.skill?.effectType,
      name: record.skill?.name,
      uses: record.skill?.uses ?? 1,
      description: record.skill?.description,
      freeTurn: Boolean(record.skill?.freeTurn),
      targetRule: record.skill?.targetRule,
      params: JSON.parse(record.skill?.paramsJson ?? "{}")
    }
  };
}

export async function seedCharacters(prisma) {
  for (const character of Object.values(CHARACTERS)) {
    const existing = await prisma.character.findUnique({ where: { slug: character.id } });
    if (existing) continue;
    await prisma.character.create({
      data: {
        slug: character.id,
        name: character.name,
        portraitUrl: character.portrait,
        portraitSource: "url",
        palette: character.palette,
        sortOrder: character.id === "sigrika" ? 1 : 2,
        skill: {
          create: {
            effectType: character.skill.id,
            name: character.skill.name,
            description: character.skill.description,
            uses: character.skill.uses ?? 1,
            freeTurn: Boolean(character.skill.freeTurn),
            targetRule: character.skill.id === "erase-point" ? "empty-point" : "stone",
            paramsJson: "{}"
          }
        }
      }
    });
  }
}

export async function listPublicCharacters(prisma) {
  const records = await prisma.character.findMany({
    where: { enabled: true },
    include: { skill: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  return records.map(toCharacterPayload);
}
```

- [ ] **Step 6: Implement server skill registry**

Create `server/skillRegistry.js`:

```js
import { CHARACTERS } from "../src/shared/characters.js";

export function skillConfigForCharacter(character) {
  if (character?.skill?.effectType) return character.skill;
  const fallback = CHARACTERS[character?.id ?? character];
  if (!fallback) return null;
  return {
    effectType: fallback.skill.id,
    name: fallback.skill.name,
    uses: fallback.skill.uses ?? 1,
    freeTurn: Boolean(fallback.skill.freeTurn),
    targetRule: fallback.skill.id === "erase-point" ? "empty-point" : "stone",
    params: {}
  };
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/shared/game.test.js server/characters.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/shared/game.js src/shared/game.test.js server/characters.js server/characters.test.js server/skillRegistry.js
git commit -m "Add configurable character skills"
```

## Task 4: Admin User APIs And Audit Logs

**Files:**
- Create: `server/adminRoutes.js`
- Modify: `server/index.js`
- Test: `server/adminRoutes.test.js`

- [ ] **Step 1: Write route helper tests**

Create `server/adminRoutes.test.js`:

```js
import { describe, expect, it, vi } from "vitest";
import { sanitizeUserUpdate, serializeAudit } from "./adminRoutes.js";

describe("admin route helpers", () => {
  it("sanitizes editable user fields", () => {
    expect(sanitizeUserUpdate({
      role: "admin",
      status: "banned",
      rank: "17级",
      rating: "1020",
      coins: "500",
      ownedCharacters: ["sigrika", "danea"],
      selectedCharacter: "danea",
      passwordHash: "ignored"
    })).toEqual({
      role: "admin",
      status: "banned",
      rank: "17级",
      rating: 1020,
      coins: 500,
      ownedCharacters: "sigrika,danea",
      selectedCharacter: "danea"
    });
  });

  it("serializes audit before and after values", () => {
    expect(serializeAudit({ a: 1 })).toBe("{\"a\":1}");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run server/adminRoutes.test.js`

Expected: FAIL because `server/adminRoutes.js` does not exist.

- [ ] **Step 3: Implement admin route helpers and user routes**

Create `server/adminRoutes.js` with:

```js
import bcrypt from "bcryptjs";
import express from "express";
import { publicUser } from "./db.js";
import { USER_ROLES, USER_STATUS } from "./adminConfig.js";
import { listPublicCharacters, toCharacterPayload, validateCharacterInput } from "./characters.js";

export function serializeAudit(value) {
  return value == null ? null : JSON.stringify(value);
}

export function sanitizeUserUpdate(body) {
  const data = {};
  if ([USER_ROLES.player, USER_ROLES.admin].includes(body.role)) data.role = body.role;
  if ([USER_STATUS.active, USER_STATUS.banned].includes(body.status)) data.status = body.status;
  if (typeof body.rank === "string") data.rank = body.rank.trim().slice(0, 20);
  if (body.rating !== undefined) data.rating = Number(body.rating);
  if (body.coins !== undefined) data.coins = Number(body.coins);
  if (Array.isArray(body.ownedCharacters)) data.ownedCharacters = body.ownedCharacters.filter(Boolean).join(",");
  if (typeof body.selectedCharacter === "string") data.selectedCharacter = body.selectedCharacter.trim();
  return data;
}

async function audit(prisma, admin, action, targetType, targetId, beforeValue, afterValue) {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: admin.id,
      action,
      targetType,
      targetId,
      beforeJson: serializeAudit(beforeValue),
      afterJson: serializeAudit(afterValue)
    }
  });
}

export function createAdminRouter({ prisma, uploadMiddleware = null }) {
  const router = express.Router();

  router.get("/summary", async (_req, res) => {
    const [users, bannedUsers, characters, gameRecords, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: USER_STATUS.banned } }),
      prisma.character.count({ where: { enabled: true } }),
      prisma.gameRecord.count(),
      prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 })
    ]);
    res.json({ summary: { users, bannedUsers, characters, gameRecords }, auditLogs });
  });

  router.get("/users", async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    res.json({ users: users.map(publicUser) });
  });

  router.get("/users/:id", async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }
    res.json({ user: publicUser(user) });
  });

  router.patch("/users/:id", async (req, res) => {
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data: sanitizeUserUpdate(req.body) });
    await audit(prisma, req.user, "user.update", "user", user.id, publicUser(before), publicUser(user));
    res.json({ user: publicUser(user) });
  });

  router.post("/users/:id/ban", async (req, res) => {
    const reason = String(req.body.reason ?? "").trim();
    if (reason.length < 2) {
      res.status(400).json({ error: "封禁原因至少 2 个字符" });
      return;
    }
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: USER_STATUS.banned, banReason: reason, bannedAt: new Date() }
    });
    await audit(prisma, req.user, "user.ban", "user", user.id, publicUser(before), publicUser(user));
    res.json({ user: publicUser(user) });
  });

  router.post("/users/:id/unban", async (req, res) => {
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: USER_STATUS.active, banReason: null, bannedAt: null }
    });
    await audit(prisma, req.user, "user.unban", "user", user.id, publicUser(before), publicUser(user));
    res.json({ user: publicUser(user) });
  });

  router.post("/users/:id/reset-password", async (req, res) => {
    const password = String(req.body.password ?? "");
    if (password.length < 4) {
      res.status(400).json({ error: "密码至少 4 位" });
      return;
    }
    const before = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!before) {
      res.status(404).json({ error: "用户不存在" });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: await bcrypt.hash(password, 10) }
    });
    await audit(prisma, req.user, "user.reset-password", "user", user.id, { id: before.id }, { id: user.id });
    res.json({ ok: true });
  });

  return router;
}
```

- [ ] **Step 4: Mount admin routes**

In `server/index.js`, import:

```js
import { createAdminRouter } from "./adminRoutes.js";
```

Mount after auth is initialized:

```js
app.use("/api/admin", authHttp, requireAdmin, createAdminRouter({ prisma }));
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run server/adminRoutes.test.js server/adminConfig.test.js server/db.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add server/adminRoutes.js server/adminRoutes.test.js server/index.js
git commit -m "Add admin user APIs"
```

## Task 5: Character Admin APIs, Public Character API, And Uploads

**Files:**
- Modify: `server/adminRoutes.js`
- Modify: `server/index.js`
- Modify: `package.json`
- Test: `server/characters.test.js`

- [ ] **Step 1: Add failing validation tests for uploads and character mapping**

Append to `server/characters.test.js`:

```js
import { safeUploadFilename } from "./adminRoutes.js";

it("creates safe upload filenames", () => {
  const name = safeUploadFilename("Danea Pretty.PNG", "image/png");
  expect(name).toMatch(/^character-[a-f0-9-]+-danea-pretty\.png$/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run server/characters.test.js`

Expected: FAIL because `safeUploadFilename` does not exist.

- [ ] **Step 3: Install upload dependency**

Run: `npm install multer`

Expected: `package.json` and `package-lock.json` include `multer`.

- [ ] **Step 4: Add upload helper and character routes**

In `server/adminRoutes.js`, add:

```js
import crypto from "node:crypto";
import path from "node:path";

const MIME_EXTENSIONS = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

export function safeUploadFilename(originalName, mimeType) {
  const ext = MIME_EXTENSIONS[mimeType];
  if (!ext) return null;
  const stem = path.basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "portrait";
  return `character-${crypto.randomUUID()}-${stem}${ext}`;
}
```

Inside `createAdminRouter`, add character routes:

```js
  router.get("/characters", async (_req, res) => {
    const characters = await prisma.character.findMany({
      include: { skill: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });
    res.json({ characters: characters.map(toCharacterPayload) });
  });

  router.post("/characters", async (req, res) => {
    const validation = validateCharacterInput(req.body);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const character = await prisma.character.create({
      data: {
        slug: req.body.slug.trim(),
        name: req.body.name.trim(),
        portraitUrl: req.body.portraitUrl.trim(),
        portraitSource: req.body.portraitSource === "upload" ? "upload" : "url",
        palette: req.body.palette ?? "#5d7fe8",
        enabled: Boolean(req.body.enabled ?? true),
        sortOrder: Number(req.body.sortOrder ?? 0),
        skill: { create: req.body.skill }
      },
      include: { skill: true }
    });
    await audit(prisma, req.user, "character.create", "character", character.id, null, toCharacterPayload(character));
    res.json({ character: toCharacterPayload(character) });
  });

  router.patch("/characters/:id", async (req, res) => {
    const before = await prisma.character.findUnique({ where: { id: req.params.id }, include: { skill: true } });
    if (!before) {
      res.status(404).json({ error: "角色不存在" });
      return;
    }
    const payload = { ...toCharacterPayload(before), ...req.body, skill: { ...toCharacterPayload(before).skill, ...(req.body.skill ?? {}) } };
    const validation = validateCharacterInput(payload);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const character = await prisma.character.update({
      where: { id: req.params.id },
      data: {
        slug: payload.slug ?? payload.id,
        name: payload.name,
        portraitUrl: payload.portraitUrl ?? payload.portrait,
        portraitSource: payload.portraitSource === "upload" ? "upload" : "url",
        palette: payload.palette,
        enabled: Boolean(payload.enabled),
        sortOrder: Number(payload.sortOrder ?? 0),
        skill: {
          upsert: {
            create: payload.skill,
            update: payload.skill
          }
        }
      },
      include: { skill: true }
    });
    await audit(prisma, req.user, "character.update", "character", character.id, toCharacterPayload(before), toCharacterPayload(character));
    res.json({ character: toCharacterPayload(character) });
  });

  router.delete("/characters/:id", async (req, res) => {
    const before = await prisma.character.findUnique({ where: { id: req.params.id }, include: { skill: true } });
    if (!before) {
      res.status(404).json({ error: "角色不存在" });
      return;
    }
    const character = await prisma.character.update({
      where: { id: req.params.id },
      data: { enabled: false },
      include: { skill: true }
    });
    await audit(prisma, req.user, "character.disable", "character", character.id, toCharacterPayload(before), toCharacterPayload(character));
    res.json({ character: toCharacterPayload(character) });
  });
```

Add upload route inside `createAdminRouter` only when `uploadMiddleware` exists:

```js
  if (uploadMiddleware) {
    router.post("/uploads/character-portrait", uploadMiddleware.single("portrait"), async (req, res) => {
      if (!req.file) {
        res.status(400).json({ error: "请上传图片文件" });
        return;
      }
      res.json({ url: `/uploads/characters/${req.file.filename}` });
    });
  }
```

- [ ] **Step 5: Mount public characters and uploads**

In `server/index.js`, import:

```js
import path from "node:path";
import multer from "multer";
import { fileURLToPath } from "node:url";
import { listPublicCharacters, seedCharacters } from "./characters.js";
import { safeUploadFilename } from "./adminRoutes.js";
```

Add:

```js
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "public", "uploads", "characters");
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const safeName = safeUploadFilename(file.originalname, file.mimetype);
      if (!safeName) cb(new Error("unsupported image type"));
      else cb(null, safeName);
    }
  }),
  limits: { fileSize: 3 * 1024 * 1024 }
});

app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));
await seedCharacters(prisma);

app.get("/api/characters", authHttp, async (_req, res) => {
  res.json({ characters: await listPublicCharacters(prisma) });
});

app.use("/api/admin", authHttp, requireAdmin, createAdminRouter({ prisma, uploadMiddleware: upload }));
```

- [ ] **Step 6: Run tests and Prisma push**

Run: `npx vitest run server/characters.test.js server/adminRoutes.test.js`

Expected: PASS.

Run: `npm run prisma:push`

Expected: SQLite schema updated without data loss prompts.

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json server/adminRoutes.js server/index.js server/characters.test.js
git commit -m "Add character admin APIs"
```

## Task 6: Frontend Character Loading And Admin Entry

**Files:**
- Create: `src/shared/characterFallback.js`
- Modify: `src/shared/characters.js`
- Modify: `src/main.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write a small failing smoke test for fallback export**

Create `src/shared/characters.test.js`:

```js
import { describe, expect, it } from "vitest";
import { characterList } from "./characters.js";

describe("character fallback", () => {
  it("keeps built-in characters available before API load", () => {
    expect(characterList.map((character) => character.id)).toContain("sigrika");
    expect(characterList.map((character) => character.id)).toContain("danea");
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/shared/characters.test.js`

Expected: PASS before refactor, proving current fallback behavior.

- [ ] **Step 3: Move fallback definitions**

Create `src/shared/characterFallback.js` with the current contents of `src/shared/characters.js`:

```js
export const FALLBACK_CHARACTERS = {
  sigrika: {
    id: "sigrika",
    name: "西格莉卡",
    palette: "#ff9b4d",
    portrait: "/assets/sigrika_centered.png",
    skill: {
      id: "erase-point",
      effectType: "erase-point",
      name: "星辰符文",
      uses: 1,
      description: "抹除棋盘上指定空交叉点。该点不再可落子，也不参与数子。（使用该技能不消耗本次落子）",
      freeTurn: true,
      targetRule: "empty-point"
    }
  },
  danea: {
    id: "danea",
    name: "达妮娅",
    palette: "#f2a4d8",
    portrait: "/assets/Danea_centered.png",
    skill: {
      id: "flip-stone",
      effectType: "flip-stone",
      name: "染移",
      uses: 1,
      description: "指定棋盘上的某个棋子，将其反色。",
      freeTurn: false,
      targetRule: "stone"
    }
  }
};

export const fallbackCharacterList = Object.values(FALLBACK_CHARACTERS);
```

Update `src/shared/characters.js`:

```js
import { FALLBACK_CHARACTERS, fallbackCharacterList } from "./characterFallback.js";

export const CHARACTERS = FALLBACK_CHARACTERS;
export const characterList = fallbackCharacterList;
```

- [ ] **Step 4: Load characters in `App`**

In `src/main.jsx`, add state:

```js
const [characters, setCharacters] = useState(CHARACTERS);
const characterListView = Object.values(characters);
```

After `/api/me` succeeds:

```js
api("/api/characters", { token })
  .then((data) => setCharacters(Object.fromEntries(data.characters.map((character) => [character.id, character]))))
  .catch(() => setCharacters(CHARACTERS));
```

Pass `characters` and `characterListView` into `HomeScreen`, `RoomScreen`, `HouseModal`, `MatchModal`, `ResultModal`, and `SkillBanner`. Replace direct `CHARACTERS[...]` lookups in render paths with the passed `characters` map.

- [ ] **Step 5: Add admin entry**

In `HomeScreen`, render an admin button when `user.role === "admin"`:

```jsx
{user.role === "admin" && (
  <button className="home-entry admin-entry" onClick={onOpenAdmin}>
    <Settings size={30} />
    <strong>后台管理</strong>
    <span>用户、角色与系统配置</span>
  </button>
)}
```

In `App`, add:

```js
const [adminTab, setAdminTab] = useState("overview");
```

Set `view` to `"admin"` from the button.

- [ ] **Step 6: Add basic admin shell placeholder**

Add a temporary `AdminConsole` component in `src/main.jsx`:

```jsx
function AdminConsole({ user, tab, setTab, onBack }) {
  const tabs = ["overview", "users", "characters", "audit"];
  return (
    <main className="admin-screen">
      <aside className="admin-sidebar">
        <strong>SigrikaGo Admin</strong>
        {tabs.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
        <button onClick={onBack}>返回大厅</button>
      </aside>
      <section className="admin-main">
        <header><span>{user.username}</span><strong>{tab}</strong></header>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Add admin shell CSS**

Append to `src/styles.css`:

```css
.admin-screen {
  width: min(1320px, calc(100% - 32px));
  min-height: 100dvh;
  margin: 0 auto;
  padding: 18px 0;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
}

.admin-sidebar,
.admin-main {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(128, 102, 142, 0.16);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(72, 44, 86, 0.12);
}

.admin-sidebar {
  padding: 14px;
  display: grid;
  align-content: start;
  gap: 8px;
}

.admin-sidebar button {
  border: 0;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: left;
  background: transparent;
  color: #4f3d55;
}

.admin-sidebar button.active {
  background: #eef4ff;
  color: #2d2430;
  font-weight: 800;
}

.admin-main {
  padding: 16px;
  min-width: 0;
}

.admin-main header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.admin-entry {
  background: linear-gradient(135deg, rgba(239, 247, 255, 0.96), rgba(244, 239, 255, 0.94));
}

@media (max-width: 760px) {
  .admin-screen {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 8: Run tests and build**

Run: `npx vitest run src/shared/characters.test.js src/shared/game.test.js`

Expected: PASS.

Run: `npm run build`

Expected: Vite build completes successfully.

- [ ] **Step 9: Commit**

```powershell
git add src/shared/characterFallback.js src/shared/characters.js src/shared/characters.test.js src/main.jsx src/styles.css
git commit -m "Add admin console entry"
```

## Task 7: Admin Overview And Users UI

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add API client helpers**

In `src/main.jsx`, add:

```js
async function adminApi(path, token, options = {}) {
  return api(`/api/admin${path}`, { ...options, token });
}
```

- [ ] **Step 2: Implement overview and user loading state**

Inside `AdminConsole`, add:

```js
const [summary, setSummary] = useState(null);
const [users, setUsers] = useState([]);
const [selectedUser, setSelectedUser] = useState(null);
const [adminError, setAdminError] = useState("");

useEffect(() => {
  if (tab !== "overview") return;
  adminApi("/summary", token)
    .then(setSummary)
    .catch((error) => setAdminError(error.message));
}, [tab, token]);

useEffect(() => {
  if (tab !== "users") return;
  adminApi("/users", token)
    .then((data) => setUsers(data.users))
    .catch((error) => setAdminError(error.message));
}, [tab, token]);
```

Pass `token` into `AdminConsole` from `App`.

- [ ] **Step 3: Render overview**

Add:

```jsx
function AdminOverview({ summary }) {
  const cards = [
    ["用户", summary?.summary?.users ?? 0],
    ["封禁", summary?.summary?.bannedUsers ?? 0],
    ["角色", summary?.summary?.characters ?? 0],
    ["棋谱", summary?.summary?.gameRecords ?? 0]
  ];
  return (
    <div className="admin-grid">
      {cards.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
    </div>
  );
}
```

- [ ] **Step 4: Render users table and drawer**

Add:

```jsx
function AdminUsers({ users, onSelect }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>用户名</th><th>权限</th><th>状态</th><th>段位</th><th>积分</th><th>金币</th><th>胜负</th></tr></thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} onClick={() => onSelect(user)}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{user.rank}</td>
              <td>{user.rating}</td>
              <td>{user.coins}</td>
              <td>{user.wins}/{user.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Add a `UserEditor` with fields for `role`, `rank`, `rating`, `coins`, `ownedCharacters`, and `selectedCharacter`. On save:

```js
await adminApi(`/users/${draft.id}`, token, {
  method: "PATCH",
  body: {
    role: draft.role,
    rank: draft.rank,
    rating: Number(draft.rating),
    coins: Number(draft.coins),
    ownedCharacters: draft.ownedCharactersText.split(",").map((item) => item.trim()).filter(Boolean),
    selectedCharacter: draft.selectedCharacter
  }
});
```

Add ban/unban/reset password buttons using the admin endpoints from the spec.

- [ ] **Step 5: Add table and drawer CSS**

Append:

```css
.admin-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.admin-table-wrap {
  overflow: auto;
  border: 1px solid #eaddea;
  border-radius: 8px;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  background: #fff;
}

.admin-table th,
.admin-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0e6f2;
  text-align: left;
}

.admin-table tbody tr:hover {
  background: #f8f1fa;
}

.admin-drawer {
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #eaddea;
  border-radius: 8px;
  background: #fff;
  display: grid;
  gap: 10px;
}
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/main.jsx src/styles.css
git commit -m "Add admin user management UI"
```

## Task 8: Character Management UI And Audit View

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Load admin characters and audit logs**

Inside `AdminConsole`, add effects:

```js
const [adminCharacters, setAdminCharacters] = useState([]);
const [auditLogs, setAuditLogs] = useState([]);

useEffect(() => {
  if (tab !== "characters") return;
  adminApi("/characters", token)
    .then((data) => setAdminCharacters(data.characters))
    .catch((error) => setAdminError(error.message));
}, [tab, token]);

useEffect(() => {
  if (tab !== "audit") return;
  adminApi("/audit-logs", token)
    .then((data) => setAuditLogs(data.auditLogs))
    .catch((error) => setAdminError(error.message));
}, [tab, token]);
```

- [ ] **Step 2: Add missing audit route if not already present**

In `server/adminRoutes.js`, ensure:

```js
router.get("/audit-logs", async (_req, res) => {
  const auditLogs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ auditLogs });
});
```

- [ ] **Step 3: Implement character editor**

Add `AdminCharacters` component:

```jsx
function AdminCharacters({ characters, token, onSaved }) {
  const [draft, setDraft] = useState(null);
  const empty = {
    slug: "",
    name: "",
    portraitUrl: "",
    portraitSource: "url",
    palette: "#5d7fe8",
    enabled: true,
    sortOrder: 0,
    skill: {
      effectType: "erase-point",
      name: "",
      description: "",
      uses: 1,
      freeTurn: true,
      targetRule: "empty-point",
      paramsJson: "{}",
      enabled: true
    }
  };

  async function save() {
    const method = draft.dbId ? "PATCH" : "POST";
    const path = draft.dbId ? `/characters/${draft.dbId}` : "/characters";
    await adminApi(path, token, { method, body: draft });
    setDraft(null);
    onSaved();
  }

  return (
    <div className="admin-character-layout">
      <div className="character-list">
        <button className="primary-action" onClick={() => setDraft(empty)}>新增角色</button>
        {characters.map((character) => (
          <button className="character-card portrait-card" key={character.dbId} onClick={() => setDraft({
            dbId: character.dbId,
            slug: character.id,
            name: character.name,
            portraitUrl: character.portrait,
            portraitSource: "url",
            palette: character.palette,
            enabled: character.enabled,
            sortOrder: 0,
            skill: { ...character.skill, paramsJson: JSON.stringify(character.skill.params ?? {}) }
          })}>
            <img src={character.portrait} alt={character.name} />
            <strong>{character.name}</strong>
          </button>
        ))}
      </div>
      {draft && <CharacterEditor draft={draft} setDraft={setDraft} onSave={save} />}
    </div>
  );
}
```

Add `CharacterEditor` fields for all draft properties, including a file input:

```js
async function uploadPortrait(file) {
  const form = new FormData();
  form.append("portrait", file);
  const response = await fetch(`${API_BASE}/api/admin/uploads/character-portrait`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "上传失败");
  return data.url;
}
```

- [ ] **Step 4: Render audit logs**

Add:

```jsx
function AdminAudit({ logs }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>时间</th><th>管理员</th><th>动作</th><th>目标</th></tr></thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>{log.adminUserId}</td>
              <td>{log.action}</td>
              <td>{log.targetType}:{log.targetId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add server/adminRoutes.js src/main.jsx src/styles.css
git commit -m "Add admin character management UI"
```

## Task 9: Room Integration And Final Verification

**Files:**
- Modify: `server/rooms.js`
- Modify: `server/index.js`
- Modify: `src/main.jsx`
- Modify: `README.md`

- [ ] **Step 1: Update room character usage**

In `server/index.js`, load public character map before Socket.IO handlers need it:

```js
async function characterMap() {
  const list = await listPublicCharacters(prisma);
  return Object.fromEntries(list.map((character) => [character.id, character]));
}
```

In `server/rooms.js`, change room creation and skill use to accept a character resolver. The minimal safe version is to keep existing `CHARACTERS` fallback and pass database-backed skill config through `player.character` when available:

```js
function toRoomPlayer(player, color) {
  return {
    user: player.user,
    socketId: player.socketId,
    color,
    characterId: player.user.selectedCharacter,
    character: player.user.characterConfig ?? null,
    time: {
      main: 5 * 60,
      byoYomi: 30,
      periodRemaining: 30,
      periods: 3
    }
  };
}
```

Before matchmaking in `server/index.js`, attach the selected character config to `socket.user`:

```js
const characters = await characterMap();
socket.user.characterConfig = characters[socket.user.selectedCharacter] ?? null;
```

In skill handling:

```js
const skillConfig = player.character?.skill ?? player.characterId;
const result = useSkill(room.game, player.color, skillConfig, action.pointId);
```

- [ ] **Step 2: Update skill notices**

In `describeSkillUse`, use:

```js
const character = player.character ?? CHARACTERS[player.characterId];
const skill = character.skill;
```

Use `skill.effectType ?? skill.id` for branching.

- [ ] **Step 3: Document admin setup**

Append to `README.md`:

````md
## 管理员后台

在 `.env` 中配置管理员用户名：

```powershell
ADMIN_USERNAMES=alice,bob
```

这些用户名对应的账号会在服务启动或登录时被提升为 `admin`。管理员登录后可以从大厅进入后台管理。
````
```

- [ ] **Step 4: Run full verification**

Run: `npm run prisma:generate`

Expected: Prisma Client generated successfully.

Run: `npm run prisma:push`

Expected: schema is in sync.

Run: `npm test`

Expected: all Vitest tests pass.

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`

Expected:

- Login as a username listed in `ADMIN_USERNAMES`.
- Lobby shows `后台管理`.
- Admin overview loads counts.
- Users tab loads user rows.
- Characters tab loads built-in seeded characters.
- Editing a character name and saving updates the row.
- A normal non-admin user cannot call `/api/admin/summary` and receives `403`.

- [ ] **Step 6: Commit**

```powershell
git add server/rooms.js server/index.js src/main.jsx README.md
git commit -m "Integrate admin console with game data"
```

## Self-Review

- Spec coverage: role-based admin auth is covered by Tasks 1-2; user management by Tasks 4 and 7; character CRUD, portrait URL/upload, and skill config by Tasks 3, 5, and 8; audit logs by Tasks 4 and 8; public character API and game integration by Tasks 3, 5, 6, and 9.
- Placeholder scan: no unresolved markers or vague implementation steps remain.
- Type consistency: the plan consistently uses `role`, `status`, `Character.slug`, `portraitUrl`, `portraitSource`, `CharacterSkill.effectType`, `targetRule`, and `paramsJson`; frontend public character payload uses `id` as the playable slug and `dbId` for admin mutations.
