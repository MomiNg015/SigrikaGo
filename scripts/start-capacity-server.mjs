process.env.NODE_ENV = "capacity";
process.env.LOCAL_PROD_STATIC = "1";
process.env.PORT ??= process.env.CAPACITY_PORT ?? "4174";
process.env.JWT_SECRET ??= "capacity-local-secret-012345678901";
process.env.PUBLIC_ORIGIN ??= `http://127.0.0.1:${process.env.PORT}`;
process.env.ENABLE_TEST_ACTIONS = "true";
process.env.ADMIN_USERNAMES ??= "capadmin";

if (!process.env.DATABASE_URL) {
  throw new Error("Capacity server requires an isolated DATABASE_URL");
}

await import("../server/index.js");
