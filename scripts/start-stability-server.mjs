const DEFAULT_STABILITY_PORT = "4173";

process.env.NODE_ENV = "stability";
process.env.LOCAL_PROD_STATIC = "1";
process.env.PORT ??= process.env.STABILITY_PORT ?? DEFAULT_STABILITY_PORT;
process.env.JWT_SECRET ??= "stability-local-secret-0123456789";
process.env.PUBLIC_ORIGIN ??= `http://127.0.0.1:${process.env.PORT}`;
process.env.ENABLE_TEST_ACTIONS ??= "true";

await import("../server/index.js");
