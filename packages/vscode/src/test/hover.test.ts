import { test } from "node:test";
import assert from "node:assert";
import { DiagnosticsPublisher } from "../diagnostics-publisher";
import { code, PropHover } from "../hover/prop-hover";
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

test("hover shows the default, section default, config value and targets", () => {
  const { file, doc, hover } = setup();
  assert.match(text(hover.provideHover(doc, positionOf(file, "NOTE"))!), /When missing: `n\/a`/);
  const tone = text(hover.provideHover(doc, positionOf(file, "TONE} for"))!);
  assert.match(tone, /Section default: `warm`/);
  assert.match(tone, /Set by targets: `writer`/);
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

test("hover values from the project cannot break out of inline code, and the Markdown is untrusted", () => {
  reset();
  const evil = "x` [click](https://evil.example) ![](https://track.example/p.png) <img src=x> `";
  const root = createProject({
    "glugent.config.json": JSON.stringify({ props: { PROJECT: evil } }),
    "s.ggen.md": "---\ndefaults:\n  TONE: \"a\\nb\"\n---\n{PROJECT} {TONE} {toString?} {EMPTY?\"\"}",
    "a.agent.ggen.json": JSON.stringify({ name: "w", sections: ["s"] }),
  });
  const file = `${root}/s.ggen.md`;
  const doc = documentAt(file);
  const hover = new PropHover(new ProjectStore(new DiagnosticsPublisher()));
  const h = hover.provideHover(doc, positionOf(file, "PROJECT"))!;
  const contents = h.contents as any;
  assert.equal(contents.isTrusted, false);
  assert.equal(contents.supportHtml, false);
  assert.match(text(h), /Config value: `` x` \[click\]\(https:\/\/evil\.example\) .* <img src=x> ` ``/);
  assert.match(text(hover.provideHover(doc, positionOf(file, "TONE}"))!), /Section default: `a b`/);
  // inherited Object members are not section defaults or config values
  assert.doesNotMatch(text(hover.provideHover(doc, positionOf(file, "toString"))!), /default|Config/);
  assert.match(text(hover.provideHover(doc, positionOf(file, "EMPTY"))!), /When missing: \*\(empty\)\*/);
});

test("code() fences inline code with more backticks than the value has", () => {
  assert.equal(code("plain"), "`plain`");
  assert.equal(code("a`b"), "``a`b``");
  assert.equal(code("``"), "``` `` ```");
  assert.equal(code(" spaced "), "`  spaced  `");
  assert.equal(code(42), "`42`");
});
