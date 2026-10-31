import { test } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as path from "path";
import { BuildTargetCommand } from "../commands/build-target";
import { TargetBuilder } from "../commands/target-builder";
import { BuildAllCommand } from "../commands/build-all";
import { ValidateCommand } from "../commands/validate";
import { DiagnosticsPublisher } from "../diagnostics-publisher";
import { ProjectStore } from "../project-store";
import { agentJson, configOf, createProject } from "./fixtures";
import { reset, state } from "./vscode-stub";

function setup(files: Record<string, string>) {
  reset();
  const root = createProject(files);
  state.configFiles = [configOf(root)];
  const store = new ProjectStore(new DiagnosticsPublisher());
  const out = (name: string) => path.join(root, "dist/agents", `${name}.md`);
  return { root, store, builder: new TargetBuilder(), out };
}

const good = { "s.ggen.md": "Hello", "a.agent.ggen.json": agentJson("alpha", ["s"]), "b.agent.ggen.json": agentJson("beta", ["s"]) };
const lastMessage = () => state.messages[state.messages.length - 1];

test("commands register under their palette ids", () => {
  const { store, builder } = setup(good);
  [new BuildAllCommand(store, builder), new BuildTargetCommand(store, builder), new ValidateCommand(store)].forEach((c) => c.register());
  assert.deepEqual([...state.commands.keys()].sort(), ["glugent.buildAll", "glugent.buildTarget", "glugent.validate"]);
});

test("build all writes every target and reports the count", async () => {
  const { store, builder, out } = setup(good);
  await new BuildAllCommand(store, builder).run();
  assert.equal(fs.readFileSync(out("alpha"), "utf8"), "Hello\n");
  assert.ok(fs.existsSync(out("beta")));
  assert.deepEqual(lastMessage(), { level: "info", text: "Glugent: built 2 targets." });
});

test("build all skips targets with errors and says so", async () => {
  const { store, builder, out } = setup({ ...good, "s.ggen.md": "{NEED}" });
  await new BuildAllCommand(store, builder).run();
  assert.equal(fs.existsSync(out("alpha")), false);
  assert.ok(state.messages.some((m) => m.level === "error" && m.text.includes("'alpha' has errors")));
});

test("build target builds only the chosen target", async () => {
  const { store, builder, out } = setup(good);
  state.pick = (items) => items.find((i) => i.label === "beta");
  await new BuildTargetCommand(store, builder).run();
  assert.equal(fs.existsSync(out("alpha")), false);
  assert.ok(fs.existsSync(out("beta")));
  assert.equal(lastMessage().text, "Glugent: built 1 target.");
});

test("build target does nothing when the picker is dismissed", async () => {
  const { store, builder, out } = setup(good);
  state.pick = () => undefined;
  await new BuildTargetCommand(store, builder).run();
  assert.equal(fs.existsSync(out("alpha")), false);
  assert.equal(state.messages.length, 0);
});

test("validate reports a valid project and a broken one", async () => {
  const ok = setup(good);
  await new ValidateCommand(ok.store).run();
  assert.equal(lastMessage().text, "Glugent: project is valid.");

  const bad = setup({ ...good, "s.ggen.md": "stray {" });
  await new ValidateCommand(bad.store).run();
  assert.match(lastMessage().text, /Glugent: \d+ error\(s\)/);
});

test("with no project in the workspace the user is warned", async () => {
  const { store, builder } = setup(good);
  state.configFiles = [];
  await new BuildAllCommand(store, builder).run();
  assert.deepEqual(lastMessage(), { level: "warning", text: "No glugent.config.json found in the workspace." });
});

test("with several projects the user picks one", async () => {
  const first = setup(good);
  const second = createProject({ "s.ggen.md": "Other", "z.agent.ggen.json": agentJson("zeta", ["s"]) });
  state.configFiles = [configOf(first.root), configOf(second)];
  state.pick = (items) => items.find((i) => i.description === second);
  await new BuildAllCommand(first.store, first.builder).run();
  assert.ok(fs.existsSync(path.join(second, "dist/agents/zeta.md")));
  assert.equal(fs.existsSync(first.out("alpha")), false);
});
