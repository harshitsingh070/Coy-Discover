import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const configured = process.env.COY_DB_PATH || path.join("data", "coy.db");

if (configured === ":memory:") {
  console.log("COY_DB_PATH is :memory: — nothing to reset.");
  process.exit(0);
}

const target = path.resolve(configured);

if (!existsSync(target)) {
  const directory = path.dirname(target);
  mkdirSync(directory, { recursive: true });
  console.log(`No database found at ${target}. It will be created on first request.`);
  process.exit(0);
}

const files = [target, `${target}-wal`, `${target}-shm`, `${target}-journal`];
let removed = 0;

for (const file of files) {
  if (existsSync(file)) {
    rmSync(file, { force: true });
    removed += 1;
    console.log(`Removed ${file}`);
  }
}

console.log(
  removed > 0
    ? "Database reset. It will be re-created and seeded on the next request."
    : `No database files found at ${target}.`,
);
