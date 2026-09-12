import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next/standalone");
const serverJs = path.join(standalone, "server.js");

if (!existsSync(serverJs)) {
  console.error("No production build found. Run: pnpm build");
  process.exit(1);
}

if (!existsSync(path.join(standalone, ".next/static"))) {
  console.error("Standalone assets missing. Run: pnpm build (postbuild syncs static/public)");
  process.exit(1);
}

const child = spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
