import { exportSkillGif } from "./export-skill-gifs.mjs";

const defaults = {
  character: "aemeath",
  fps: "30",
  size: "720",
  theme: "black"
};

for (const effect of ["hidden-hand", "voyage-star"]) {
  await exportSkillGif([
    "--character", defaults.character,
    "--effect", effect,
    "--fps", defaults.fps,
    "--size", defaults.size,
    "--theme", defaults.theme,
    "--output-name", `aemeath-${effect}-black.gif`
  ]);
}
