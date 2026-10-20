export const TOP_ANNOUNCEMENT_MAX_LENGTH = 500;

export function normalizeTopAnnouncementText(value) {
  return typeof value === "string"
    ? value.replace(/\s+/gu, " ").trim().slice(0, TOP_ANNOUNCEMENT_MAX_LENGTH)
    : "";
}
