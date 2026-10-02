import { backupSqliteDatabase } from "./sqliteBackupVerification.mjs";

const args = process.argv.slice(2);
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
};

const result = await backupSqliteDatabase({
  sourcePath: valueAfter("--source"),
  outputPath: valueAfter("--output"),
  allowDevDatabase: args.includes("--allow-dev-database")
});

console.log(`[sqlite-backup] ${result.source} -> ${result.output} (${result.bytes} bytes)`);
