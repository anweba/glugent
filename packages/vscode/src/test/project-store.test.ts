import { test } from "node:test";
import assert from "node:assert";
import { DiagnosticsPublisher } from "../diagnostics-publisher";
import { ProjectStore } from "../project-store";
import { agentJson, configOf, createProject, documentAt } from "./fixtures";
import { reset, state } from "./vscode-stub";

function setup(files: Record<string, string>) {
  reset();
  const root = createProject(files);
  state.configFiles = [configOf(root)];
  return { root, store: new ProjectStore(new DiagnosticsPublisher()) };
}

test("refresh loads the project and publishes its diagnostics", () => {
  const { root, store } = setup({ "s.ggen.md": "stray { brace", "a.agent.ggen.json": agentJson("a", ["s", "nope"]) });
  const project = store.refresh(configOf(root));

  assert.equal(project.sections.length, 1);
  const messages = [...state.collections[0].entries.values()].flat().map((d) => d.message);
  assert.ok(messages.some((m) => m.includes("Unexpected '{'")));
  assert.ok(messages.some((m) => m.includes("Unknown section 'nope'")));
});

test("refreshAll finds every config in the workspace", async () => {
  const { root, store } = setup({ "s.ggen.md": "x" });
  const projects = await store.refreshAll();
  assert.deepEqual(projects.map((p) => p.root), [root]);
});

test("forDocument caches the project; refresh picks up new content", () => {
  const { root, store } = setup({ "s.ggen.md": "x" });
  const doc = documentAt(`${root}/s.ggen.md`);
  const first = store.forDocument(doc);
  assert.equal(store.forDocument(doc), first);
  assert.notEqual(store.refresh(configOf(root)), first);
});

test("documents outside a project or without a file scheme have no project", () => {
  const { root, store } = setup({ "s.ggen.md": "x" });
  assert.equal(store.forDocument(documentAt(`${root}/s.ggen.md`, "glugent", "untitled")), undefined);
  assert.equal(store.configFor(documentAt(`${root}/s.ggen.md`)), configOf(root));
});
