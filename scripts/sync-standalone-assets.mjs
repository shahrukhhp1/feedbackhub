import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next/standalone");

if (!existsSync(path.join(standalone, "server.js"))) {
  console.warn("Skipping standalone asset sync (no .next/standalone/server.js). Run pnpm build first.");
  process.exit(0);
}

function replaceDir(src, dest) {
  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

replaceDir(path.join(root, ".next/static"), path.join(standalone, ".next/static"));
replaceDir(path.join(root, "public"), path.join(standalone, "public"));

console.log("Synced .next/static and public into .next/standalone");
