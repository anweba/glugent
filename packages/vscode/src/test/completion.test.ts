import { test } from "node:test";
import assert from "node:assert";
import { PropCompletion } from "../completion/prop-completion";
import { SectionCompletion } from "../completion/section-completion";
import { DiagnosticsPublisher } from "../diagnostics-publisher";
import { ProjectStore } from "../project-store";
import { agentJson, createProject, documentAt, positionOf } from "./fixtures";
import { reset, state } from "./vscode-stub";

function setup() {
  reset();
  const root = createProject({
    "glugent.config.json": JSON.stringify({ props: { PROJECT: "Acme" } }),
    "greet.ggen.md": "---\ndescription: Greets\ndefaults:\n  TONE: warm\n---\nHello {NAME}, {TONE} {NOTE?} {",
    "a.agent.ggen.json": `{ "name": "a", "sections": [ "gr" ] }`,
  });
  return { root, store: new ProjectStore(new DiagnosticsPublisher()) };
}

test("prop completion lists required and optional props after a {", () => {
  const { root, store } = setup();
  const file = `${root}/greet.ggen.md`;
  const items = new PropCompletion(store).provideCompletionItems(documentAt(file), positionOf(file, "{", true))!;
  const byName = Object.fromEntries(items.map((i) => [i.label, i]));

  assert.deepEqual(Object.keys(byName).sort(), ["NAME", "NOTE", "PROJECT", "TONE"]);
  assert.equal(byName.NAME.detail, "required prop");
  assert.equal(byName.NOTE.detail, "optional prop");
  assert.equal(byName.TONE.detail, "optional prop"); // has a section default
  assert.equal(byName.PROJECT.detail, "optional prop"); // set in the config
  assert.match(byName.NAME.documentation as string, /greet/);
});

test("prop completion only triggers right after a {", () => {
  const { root, store } = setup();
  const file = `${root}/greet.ggen.md`;
  const doc = documentAt(file);
  const lastLine = doc.getText().split("\n").length - 1;
  const provider = new PropCompletion(store);
  assert.equal(provider.provideCompletionItems(doc, { line: lastLine, character: 5 } as any), undefined);
});

test("prop completion registers on '{' for glugent files", () => {
  const { store } = setup();
  new PropCompletion(store).register();
  assert.deepEqual(state.providers[0].triggers, ["{"]);
  assert.deepEqual(state.providers[0].selector, { language: "glugent" });
});

test("section completion suggests section ids inside an agent's sections list", () => {
  const { root, store } = setup();
  const file = `${root}/a.agent.ggen.json`;
  const doc = documentAt(file, "json");
  const items = new SectionCompletion(store).provideCompletionItems(doc, positionOf(file, '"gr', true))!;

  assert.deepEqual(items.map((i) => i.label), ["greet"]);
  assert.equal(items[0].detail, "Greets");
  assert.equal(items[0].documentation, "Props: NAME, TONE, NOTE?");
});

test("section completion stays quiet outside a string position", () => {
  const { root, store } = setup();
  const file = `${root}/a.agent.ggen.json`;
  const doc = documentAt(file, "json");
  assert.equal(new SectionCompletion(store).provideCompletionItems(doc, positionOf(file, "name", true)), undefined);
});
