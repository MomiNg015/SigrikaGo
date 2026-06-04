import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const REPLACEMENT_CHAR = "\uFFFD";

if (isDirectRun()) {
  const [command, filePath, ...args] = process.argv.slice(2);

  if (!command || !filePath) {
    printUsage();
    process.exit(1);
  }

  if (command === "append-after") {
    const [marker, text] = args;
    if (!marker || !text) {
      printUsage();
      process.exit(1);
    }
    await appendAfter(filePath, marker, text);
  } else if (command === "replace") {
    const [search, replacement] = args;
    if (!search || replacement === undefined) {
      printUsage();
      process.exit(1);
    }
    await replaceText(filePath, search, replacement);
  } else {
    printUsage();
    process.exit(1);
  }
}

export async function appendAfter(filePath, marker, text) {
  const current = await readUtf8Document(filePath);
  const index = current.indexOf(marker);
  if (index === -1) {
    throw new Error(`Marker not found in ${filePath}: ${marker}`);
  }

  const insertAt = index + marker.length;
  const next = `${current.slice(0, insertAt)}${normalizeInsertedText(text)}${current.slice(insertAt)}`;
  await writeUtf8Document(filePath, next);
}

export async function replaceText(filePath, search, replacement) {
  const current = await readUtf8Document(filePath);
  if (!current.includes(search)) {
    throw new Error(`Search text not found in ${filePath}: ${search}`);
  }
  await writeUtf8Document(filePath, current.replace(search, replacement));
}

export async function readUtf8Document(filePath) {
  const value = await readFile(filePath, "utf8");
  assertNoReplacementCharacters(value, filePath);
  return value;
}

export async function writeUtf8Document(filePath, content) {
  assertNoReplacementCharacters(content, filePath);
  await writeFile(filePath, content, { encoding: "utf8" });
  const written = await readFile(filePath, "utf8");
  assertNoReplacementCharacters(written, filePath);
  if (written !== content) {
    throw new Error(`UTF-8 write verification failed for ${filePath}`);
  }
}

export function assertNoReplacementCharacters(content, filePath = "document") {
  if (content.includes(REPLACEMENT_CHAR)) {
    throw new Error(`${filePath} contains Unicode replacement characters; aborting to avoid saving damaged text.`);
  }
}

function normalizeInsertedText(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  return normalized.startsWith("\n") ? normalized : `\n${normalized}`;
}

function printUsage() {
  console.error("Usage:");
  console.error("  node scripts/write-utf8-doc.mjs append-after <file> <marker> <text>");
  console.error("  node scripts/write-utf8-doc.mjs replace <file> <search> <replacement>");
}

function isDirectRun() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
