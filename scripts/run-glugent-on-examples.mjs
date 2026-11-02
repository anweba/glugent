// Runs the local CLI on every example: node scripts/run-glugent-on-examples.mjs <validate|build|check>
// `build` empties each example's outDir first, so output a target no longer
// writes is removed. `check` writes nothing: it runs `glugent build --check` and
// also fails on files in the outDir that no target writes any more.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, existsSync, statSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const command = process.argv[2];
if (!["validate", "build", "check"].includes(command)) {
  console.error("usage: node scripts/run-glugent-on-examples.mjs <validate|build|check>");
  process.exit(2);
}

const cli = join("packages", "cli", "bin", "glugent.js");
let failed = false;
for (const name of readdirSync("examples").sort()) {
  const config = join("examples", name, "glugent.config.json");
  if (!existsSync(config)) continue;
  const outDir = join("examples", name, JSON.parse(readFileSync(config, "utf8")).outDir ?? "dist/agents");
  console.log(`== ${name}`);
  if (command === "build") {
    const problem = unsafeToEmpty(config, outDir);
    if (problem) {
      console.error(`✗ not emptying ${outDir}: it ${problem}; fix outDir in ${config}`);
      failed = true;
      continue;
    }
    rmSync(outDir, { recursive: true, force: true });
  }
  const args = command === "check" ? ["build", "--check", "-c", config] : [command, "-c", config];
  if (spawnSync("node", [cli, ...args], { stdio: "inherit" }).status !== 0) failed = true;
  if (command === "check" && leftovers(config, outDir)) failed = true;
}
if (failed) process.exit(1);

/**
 * Why `build` may not delete `outDir`, or undefined if it may. The outDir comes from a
 * config file a pull request can change, so `"outDir": "../../.."` must not empty the
 * user's home folder, and `"."` or `"sections"` must not delete the example's own sources.
 */
function unsafeToEmpty(config, outDir) {
  const example = resolve(dirname(config));
  const out = resolve(outDir);
  if (!isBelow(example, out)) return `is not a folder inside ${relative(".", example)}`;
  if (relative(example, out).split(sep).some((part) => part.toLowerCase() === ".git")) return "is inside a .git folder";
  let existing = out;
  while (!existsSync(existing)) existing = dirname(existing); // a dangling link is skipped: rmSync removes only the link
  if (!isBelowOrAt(realpathSync(example), realpathSync(existing))) return "leads outside the example through a symbolic link";
  const { loadProject } = createRequire(import.meta.url)("../packages/core/dist/index.js");
  const project = loadProject(resolve(config));
  const sources = [project.configFile, ...project.sections.map((s) => s.file), ...project.targets.map((t) => t.file)];
  const source = sources.find((file) => isBelow(out, file));
  if (source) return `holds the source file ${relative(".", source)}`;
  return undefined;
}

/** `file` is strictly below `folder`. */
function isBelow(folder, file) {
  const rel = relative(folder, file);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function isBelowOrAt(folder, file) {
  return folder === file || isBelow(folder, file);
}

/** Reports files in `outDir` that none of the example's targets writes; true if there are any. */
function leftovers(config, outDir) {
  if (!existsSync(outDir)) return false;
  const { loadProject, outputPathFor } = createRequire(import.meta.url)("../packages/core/dist/index.js");
  const project = loadProject(resolve(config));
  const written = new Set(project.targets.map((target) => outputPathFor(project, target)));
  const extra = readdirSync(outDir, { recursive: true })
    .map((file) => resolve(outDir, file))
    .filter((file) => statSync(file).isFile() && !written.has(file));
  const { colorEnabled } = createRequire(import.meta.url)("../packages/cli/dist/reporter.js");
  const [red, yellow, reset] = colorEnabled() ? ["\x1b[31m", "\x1b[33m", "\x1b[0m"] : ["", "", ""];
  for (const file of extra) console.error(`${red}✗${yellow} ${relative(".", file)} (no target writes it)${reset}`);
  return extra.length > 0;
}
