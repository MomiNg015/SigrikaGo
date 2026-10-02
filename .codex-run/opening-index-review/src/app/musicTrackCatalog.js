import { api } from "../api/client.js";
import { MUSIC_TRACKS, musicTracksWithDisplayNames } from "../shared/musicLibrary.js";

export async function loadMusicTrackCatalog({ token }) {
  const data = await api("/api/music-tracks", { token });
  return musicTrackListToMap(data.tracks);
}

export function musicTrackListToMap(list = [], fallbackTracks = MUSIC_TRACKS) {
  const displayNames = Object.fromEntries(
    (list ?? []).map((track) => [track.id, track.name])
  );
  return musicTracksWithDisplayNames(fallbackTracks, displayNames);
}
