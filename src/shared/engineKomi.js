// Game scores use half the black/white difference (子); engines use points (目).
export function internalKomiToGtpKomi(value) {
  const komi = Number(value);
  return Number.isFinite(komi) ? komi * 2 : 5.5;
}
