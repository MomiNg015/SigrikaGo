import { spawnSync } from "node:child_process";
import process from "node:process";

const focusedTests = [
  "src/styles/cssLayerInventory.test.js",
  "src/styles/styleContract.test.js",
  "src/styles/themeContract.test.js",
  "src/shared/game.test.js",
  "src/shared/gameSkills.test.js",
  "src/shared/characters.test.js",
  "src/shared/boardView.test.js",
  "src/shared/boardAudio.test.js",
  "src/shared/skillEffectCatalog.test.js",
  "src/shared/skillPresentation.test.js",
  "src/room/Board.test.js",
  "src/room/BoardAmbientEffects.test.js",
  "src/room/BoardSkillEffects.test.js",
  "src/room/boardSkillEffectRegistry.test.js",
  "src/room/boardSkillEffectSoundScheduler.test.js",
  "src/room/ChatBox.test.js",
  "src/room/RoomScreen.test.js",
  "src/room/actions/useRoomPointActions.test.js",
  "src/room/mobilePointConfirmation.test.js",
  "src/room/roomView.test.js",
  "server/adminDefaultSeed.test.js",
  "scripts/verificationScripts.test.js"
];

run("npm", ["test", "--", ...focusedTests]);
run("npm", ["run", "docs:system-design"]);
run("npm", ["test", "--", "docs/systemDesignHtml.test.js"]);

function run(command, args) {
  const result = spawnSync(...spawnArgs(command, args), {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit"
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function spawnArgs(command, args) {
  if (process.platform !== "win32") return [command, args];
  return ["cmd.exe", ["/d", "/s", "/c", commandLineForWindows(command, args)]];
}

function commandLineForWindows(command, args) {
  return [command, ...args].map(quoteCmdArgument).join(" ");
}

function quoteCmdArgument(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(text)) return text;
  return `"${text.replace(/(["^&|<>%])/g, "^$1")}"`;
}
