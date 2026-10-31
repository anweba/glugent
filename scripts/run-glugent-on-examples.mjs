// Runs the local CLI on every example: node scripts/run-glugent-on-examples.mjs <validate|build>
// `build` empties each example's outDir first, so output a target no longer
// writes shows up as deleted rather than lingering.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const command = process.argv[2];
if (command !== "validate" && command !== "build") {
  console.error("usage: node scripts/run-glugent-on-examples.mjs <validate|build>");
  process.exit(2);
}

const cli = join("packages", "cli", "bin", "glugent.js");
let failed = false;
for (const name of readdirSync("examples").sort()) {
  const config = join("examples", name, "glugent.config.json");
  if (!existsSync(config)) continue;
  if (command === "build") {
    const outDir = JSON.parse(readFileSync(config, "utf8")).outDir ?? "dist/agents";
    rmSync(join("examples", name, outDir), { recursive: true, force: true });
  }
  console.log(`== ${name}`);
  if (spawnSync("node", [cli, command, "-c", config], { stdio: "inherit" }).status !== 0) failed = true;
}
if (failed) process.exit(1);
