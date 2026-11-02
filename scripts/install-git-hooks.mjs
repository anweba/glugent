// Installs the hooks in .githooks/ (run by `npm install` through `prepare`, or by `npm run hooks:install`).
// They are copied into .git/glugent-hooks/ and git runs that copy, not .githooks/ itself:
// otherwise checking out a branch, such as a pull request, would run that branch's hooks.
// The copy changes only when you run this again; the hooks warn when .githooks/ differs.
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const source = join(git("rev-parse", "--show-toplevel"), ".githooks");
const target = resolve(git("rev-parse", "--git-common-dir"), "glugent-hooks");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const name of readdirSync(source)) {
  copyFileSync(join(source, name), join(target, name));
  chmodSync(join(target, name), 0o755);
}
git("config", "core.hooksPath", target);
console.log(`git hooks: installed .githooks/ into ${target}`);
