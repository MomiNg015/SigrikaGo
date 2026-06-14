import { describe, expect, it } from "vitest";
import {
  ensureMusicTrackSettingsSchema,
  listMusicTrackSettings,
  mergeMusicTrackSettings,
  updateMusicTrackSetting
} from "./musicTracks.js";

const testTracks = {
  "home-default": {
    id: "home-default",
    name: "Default Home",
    type: "home",
    defaultUnlocked: true,
    purchasable: false,
    playback: { mode: "single-loop", src: "/home.ogg", loop: true }
  }
};

describe("music track settings", () => {
  it("creates the compatibility table idempotently", async () => {
    const calls = [];
    await ensureMusicTrackSettingsSchema({
      $executeRawUnsafe: async (sql) => calls.push(sql)
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('CREATE TABLE IF NOT EXISTS "MusicTrackSetting"');
    expect(calls[0]).toContain('"displayName" TEXT NOT NULL DEFAULT');
  });

  it("merges display names while preserving playback metadata", () => {
    const tracks = mergeMusicTrackSettings([
      { id: "home-default", displayName: "星炬大厅" }
    ], testTracks);

    expect(tracks[0]).toMatchObject({
      id: "home-default",
      name: "星炬大厅",
      defaultName: "Default Home",
      playback: { src: "/home.ogg" }
    });
  });

  it("lists static fallback tracks when no settings table delegate is available", async () => {
    const result = await listMusicTrackSettings({ prisma: {}, tracks: testTracks });

    expect(result.tracks[0].name).toBe("Default Home");
  });

  it("updates a valid track setting and writes audit in one transaction", async () => {
    const calls = [];
    const tx = {
      musicTrackSetting: {
        findUnique: async ({ where }) => {
          calls.push(["findUnique", where]);
          return { id: "home-default", displayName: "Old Name" };
        },
        upsert: async ({ where, create, update }) => {
          calls.push(["upsert", where, create, update]);
          return { id: "home-default", displayName: update.displayName };
        }
      },
      adminAuditLog: {
        create: async ({ data }) => {
          calls.push(["audit", data]);
          return data;
        }
      }
    };

    const result = await updateMusicTrackSetting({
      prisma: { $transaction: async (callback) => callback(tx) },
      adminUser: { id: "admin-1" },
      trackId: "home-default",
      body: { displayName: "New Name" },
      tracks: testTracks
    });

    expect(result.track.name).toBe("New Name");
    expect(calls).toContainEqual(["audit", expect.objectContaining({
      action: "music-track.update",
      targetType: "music-track",
      targetId: "home-default"
    })]);
  });

  it("rejects unknown static track ids", async () => {
    await expect(updateMusicTrackSetting({
      prisma: {},
      adminUser: { id: "admin-1" },
      trackId: "missing",
      body: { displayName: "Missing" },
      tracks: testTracks
    })).rejects.toMatchObject({
      status: 404,
      message: "Music track not found"
    });
  });
});
