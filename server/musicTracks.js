import { MUSIC_TRACKS, musicTracksWithDisplayNames } from "../src/shared/musicLibrary.js";
import { routeError } from "./adminRouteErrors.js";
import { writeAudit } from "./adminAudit.js";

export async function ensureMusicTrackSettingsSchema(client) {
  if (!client?.$executeRawUnsafe) return;
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "MusicTrackSetting" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "displayName" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function listMusicTrackSettings({ prisma, tracks = MUSIC_TRACKS }) {
  const settings = await readMusicTrackSettings(prisma);
  return { tracks: mergeMusicTrackSettings(settings, tracks) };
}

export async function listMusicTrackMap({ prisma, tracks = MUSIC_TRACKS }) {
  const settings = await readMusicTrackSettings(prisma);
  const list = mergeMusicTrackSettings(settings, tracks);
  return Object.fromEntries(list.map((track) => [track.id, track]));
}

export async function updateMusicTrackSetting({ prisma, adminUser, trackId, body, tracks = MUSIC_TRACKS }) {
  const id = String(trackId ?? "").trim();
  if (!tracks[id]) throw routeError(404, "Music track not found");
  const displayName = normalizeDisplayName(body?.displayName);

  return prisma.$transaction(async (tx) => {
    const before = await tx.musicTrackSetting.findUnique({ where: { id } });
    const after = await tx.musicTrackSetting.upsert({
      where: { id },
      create: { id, displayName },
      update: { displayName }
    });
    const beforePayload = before ? musicTrackSettingPayload(tracks[id], before) : null;
    const afterPayload = musicTrackSettingPayload(tracks[id], after);
    await writeAudit(tx, adminUser, "music-track.update", id, beforePayload, afterPayload, "music-track");
    return { track: afterPayload };
  });
}

export function mergeMusicTrackSettings(settings = [], tracks = MUSIC_TRACKS) {
  const displayNames = Object.fromEntries(
    settings.map((setting) => [setting.id, setting.displayName])
  );
  return Object.values(musicTracksWithDisplayNames(tracks, displayNames))
    .map(toMusicTrackPayload);
}

function musicTrackSettingPayload(track, setting) {
  return toMusicTrackPayload({
    ...track,
    name: normalizeDisplayName(setting.displayName) || track.name,
    defaultName: track.name
  });
}

function toMusicTrackPayload(track) {
  return {
    id: track.id,
    name: track.name,
    defaultName: track.defaultName ?? track.name,
    type: track.type,
    characterId: track.characterId ?? "",
    defaultUnlocked: Boolean(track.defaultUnlocked),
    purchasable: Boolean(track.purchasable),
    playback: track.playback,
    imageUrl: track.imageUrl ?? ""
  };
}

function normalizeDisplayName(value) {
  return String(value ?? "").trim().slice(0, 80);
}

async function readMusicTrackSettings(prisma) {
  if (!prisma?.musicTrackSetting?.findMany) return [];
  return prisma.musicTrackSetting.findMany();
}
