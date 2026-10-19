import { test } from "node:test";
import assert from "node:assert";
import { DiagnosticsPublisher } from "../diagnostics-publisher";
import { PropHover } from "../hover/prop-hover";
import { ProjectStore } from "../project-store";
import { createProject, documentAt, positionOf } from "./fixtures";
import { reset } from "./vscode-stub";

function setup() {
  reset();
  const root = createProject({
    "glugent.config.json": JSON.stringify({ props: { PROJECT: "Acme" } }),
    "s.ggen.md": '---\ndefaults:\n  TONE: warm\n---\n{ if TONE {{TONE} for {PROJECT}} }\n{NAME}\n{NOTE?"n/a"}',
    "a.agent.ggen.json": JSON.stringify({ name: "writer", props: { TONE: "dry" }, sections: ["s"] }),
  });
  const file = `${root}/s.ggen.md`;
  return { file, doc: documentAt(file), hover: new PropHover(new ProjectStore(new DiagnosticsPublisher())) };
}

const text = (h: any) => h.contents.value as string;

test("hover on a required prop", () => {
  const { file, doc, hover } = setup();
  const h = hover.provideHover(doc, positionOf(file, "NAME"))!;
  assert.match(text(h), /\*\*NAME\*\* — required prop/);
});

test("hover shows the default, section default, config value and agents", () => {
  const { file, doc, hover } = setup();
  assert.match(text(hover.provideHover(doc, positionOf(file, "NOTE"))!), /When missing: `n\/a`/);
  const tone = text(hover.provideHover(doc, positionOf(file, "TONE} for"))!);
  assert.match(tone, /Section default: `warm`/);
  assert.match(tone, /Set by agents: `writer`/);
  assert.match(text(hover.provideHover(doc, positionOf(file, "PROJECT"))!), /Config value: `Acme`/);
});

test("hover on an if condition says so", () => {
  const { file, doc, hover } = setup();
  const h = hover.provideHover(doc, positionOf(file, "TONE {"))!;
  assert.match(text(h), /Used in an `if` condition/);
});

test("no hover outside placeholders", () => {
  const { file, doc, hover } = setup();
  assert.equal(hover.provideHover(doc, positionOf(file, "for ")), undefined);
});
