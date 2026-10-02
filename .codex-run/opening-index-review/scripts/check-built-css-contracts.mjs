import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BRIGHT_SCHOOL_MODAL_SELECTOR = ".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .modal-backdrop";

export function assertBuiltCssContracts(css) {
  const selectorStart = css.indexOf(`${BRIGHT_SCHOOL_MODAL_SELECTOR}{`);
  if (selectorStart < 0) {
    throw new Error("Built CSS is missing the Bright School modal backdrop owner");
  }

  const declarationStart = selectorStart + BRIGHT_SCHOOL_MODAL_SELECTOR.length + 1;
  const declarationEnd = css.indexOf("}", declarationStart);
  if (declarationEnd < 0) {
    throw new Error("Built CSS has an unterminated Bright School modal backdrop owner");
  }

  const declarations = css.slice(declarationStart, declarationEnd);
  const hasStandardNoBlur = /(?:^|;)backdrop-filter:none!important(?:;|$)/.test(declarations);
  if (!hasStandardNoBlur) {
    throw new Error("Built CSS dropped backdrop-filter:none!important from the Bright School modal backdrop");
  }
}

export async function checkBuiltCssContracts(distDirectory = "dist") {
  const assetsDirectory = path.resolve(distDirectory, "assets");
  const assetNames = await readdir(assetsDirectory);
  const cssAssetNames = assetNames.filter((name) => name.endsWith(".css")).sort();
  if (!cssAssetNames.length) {
    throw new Error(`No CSS assets found below ${assetsDirectory}`);
  }

  const css = (await Promise.all(cssAssetNames.map((name) => (
    readFile(path.join(assetsDirectory, name), "utf8")
  )))).join("\n");
  assertBuiltCssContracts(css);
  console.log(`Built CSS contracts OK (${cssAssetNames.join(", ")})`);
}

function valueAfter(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const distDirectory = valueAfter("--dist") ?? "dist";
  checkBuiltCssContracts(distDirectory).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
