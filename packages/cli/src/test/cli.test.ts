import { test } from "node:test";
import assert from "node:assert";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const BIN = path.resolve(__dirname, "../../bin/glugent.js");

function run(cwd: string, ...args: string[]) {
  const r = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

function project(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-cli-"));
  const all = { "glugent.config.json": "{}", ...files };
  for (const [name, content] of Object.entries(all)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

const agent = (name: string, sections: string[]) => JSON.stringify({ name, sections });

test("help and unknown command", () => {
  const dir = project({});
  const help = run(dir);
  assert.equal(help.code, 0);
  assert.match(help.out, /Usage:/);
  const bad = run(dir, "nope");
  assert.equal(bad.code, 1);
  assert.match(bad.err, /unknown command 'nope'/);
});

test("fails without a config", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-cli-"));
  const r = run(dir, "list");
  assert.equal(r.code, 1);
  assert.match(r.err, /glugent\.config\.json not found/);
});

test("list shows targets and sections", () => {
  const dir = project({ "s.ggen.md": "hi", "a.agent.ggen.json": agent("alpha", ["s"]) });
  const r = run(dir, "list");
  assert.equal(r.code, 0);
  assert.match(r.out, /alpha/);
  assert.match(r.out, /^ {2}s$/m);
});

test("build writes the target, --set overrides props, --dry-run writes nothing", () => {
  const dir = project({ "s.ggen.md": "Hello {NAME}!{ if LOUD {!!} }", "a.agent.ggen.json": agent("alpha", ["s"]) });
  const dry = run(dir, "build", "--dry-run", "--set", "NAME=Bob");
  assert.equal(dry.code, 0);
  assert.match(dry.out, /dry run/);
  assert.equal(fs.existsSync(path.join(dir, "dist")), false);

  const r = run(dir, "build", "alpha", "--set", "NAME=Bob", "--set", "LOUD=1");
  assert.equal(r.code, 0);
  assert.match(r.out, /✓ alpha/);
  const written = r.out.match(/→ (\S+)/)![1];
  assert.equal(fs.readFileSync(path.join(dir, written), "utf8"), "Hello Bob!!!\n");
});

test("build fails on a missing prop and writes nothing", () => {
  const dir = project({ "s.ggen.md": "{NEED}", "a.agent.ggen.json": agent("alpha", ["s"]) });
  const r = run(dir, "build");
  assert.equal(r.code, 1);
  assert.match(r.err, /NEED/);
  assert.match(r.err, /alpha \(not written\)/);
  assert.equal(fs.existsSync(path.join(dir, "dist")), false);
});

test("build rejects an unknown target and a bad --set", () => {
  const dir = project({ "s.ggen.md": "x", "a.agent.ggen.json": agent("alpha", ["s"]) });
  assert.match(run(dir, "build", "ghost").err, /unknown target 'ghost'/);
  assert.match(run(dir, "build", "--set", "oops").err, /--set expects KEY=VALUE/);
});

test("validate reports errors with positions, and OK otherwise", () => {
  const good = project({ "s.ggen.md": "{NAME?}", "a.agent.ggen.json": agent("alpha", ["s"]) });
  const ok = run(good, "validate");
  assert.equal(ok.code, 0);
  assert.match(ok.out, /OK/);

  const bad = project({ "s.ggen.md": "line\nstray { brace", "a.agent.ggen.json": agent("alpha", ["s", "nope"]) });
  const r = run(bad, "validate");
  assert.equal(r.code, 1);
  assert.match(r.err, /s\.ggen\.md:2:\d+ error: Unexpected '\{'/);
  assert.match(r.err, /nope/);
});

test("--config selects a config from another directory", () => {
  const dir = project({ "s.ggen.md": "x", "a.agent.ggen.json": agent("alpha", ["s"]) });
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-cli-"));
  const r = run(elsewhere, "list", "--config", path.join(dir, "glugent.config.json"));
  assert.equal(r.code, 0);
  assert.match(r.out, /alpha/);
});

test("convert escapes braces, keeps frontmatter, refuses to overwrite", () => {
  const dir = project({ "a.md": "---\ndescription: x\ndefaults: {A: 1}\n---\nuse {NAME} and }} {\n" });
  const r = run(dir, "convert", "a.md");
  assert.equal(r.code, 0);
  const out = fs.readFileSync(path.join(dir, "a.ggen.md"), "utf8");
  assert.equal(out, "---\ndescription: x\ndefaults: {A: 1}\n---\nuse {{NAME}} and }}}} {{\n");
  assert.equal(run(dir, "convert", "a.md").code, 1);
  assert.equal(run(dir, "convert", "a.md", "--force").code, 0);
  assert.equal(run(dir, "convert", "a.ggen.md").code, 1);
});
