import { describe, expect, it } from "vitest";
import { sqliteClientOptions } from "./sqliteClientOptions.js";

describe("SQLite client pool configuration", () => {
  it("keeps absolute/relative database paths and existing parameters intact", () => {
    for (const url of ["file:./dev.db", "file:C:/data folder/game.db", "file:../.tmp/game.db?socket_timeout=5"]) {
      expect(sqliteClientOptions({ DATABASE_URL: url }).datasources.db.url).toBe(`${url}${url.includes("?") ? "&" : "?"}connection_limit=1`);
    }
    expect(sqliteClientOptions({ DATABASE_URL: "file:./game.db?" }).datasources.db.url).toBe("file:./game.db?connection_limit=1");
  });
  it("preserves explicit limits and does not invent a database when configuration is missing", () => {
    const url = "file:./game.db?connection_limit=2&socket_timeout=5";
    expect(sqliteClientOptions({ DATABASE_URL: url })).toEqual({ datasources: { db: { url } } });
    expect(sqliteClientOptions({})).toEqual({});
    expect(sqliteClientOptions({ DATABASE_URL: "postgresql://example" })).toEqual({});
  });
});
