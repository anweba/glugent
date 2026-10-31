import { test } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renderTemplate, scanTemplate, loadProject, compileAgent, compileTarget, validateProject } from "../index";


test("render: required, optional, literal braces", () => {
  const r = renderTemplate("Hi {NAME}!\n{NOTE?}\nUse {X?}.\n{{LIT}}", { NAME: "Bob" });
  assert.equal(r.text, "Hi Bob!\nUse .\n{LIT}");
  assert.deepEqual(r.missing, []);
});

test("render: inline defaults", () => {
  const r = renderTemplate('A={A?"fallback"} B={B?"x \\"q\\" } y"} C={C?""}\n{D?"d"}', { B: "set" });
  assert.equal(r.text, 'A=fallback B=set C=\nd');
  assert.equal(scanTemplate('{A?"a {b} c"}').placeholders[0].default, "a {b} c");
});

test("render: multi-line default, positions, line dropping", () => {
  const body = 'a\n{A?"line1\nline2 }"}\n  {GONE?}  \nb {B}';
  const r = renderTemplate(body, {});
  assert.equal(r.text, "a\nline1\nline2 }\nb ");
  assert.deepEqual(r.missing.map((m) => [m.name, m.line, m.column]), [["B", 4, 2]]);
  const ph = scanTemplate(body).placeholders[0];
  assert.deepEqual([ph.line, ph.endLine, ph.endColumn], [1, 2, 9]);
});

test("render: if blocks with && and ||", () => {
  const t = '{ if A && B {both} }|{ if A || B {either} }|{ if A && B || C {x{A}y {D?"d"}} }';
  assert.equal(renderTemplate(t, { A: "1", B: "2" }).text, "both|either|x1y d");
  assert.equal(renderTemplate(t, { A: "1" }).text, "|either|");
  assert.equal(renderTemplate(t, { C: 1 }).text, "||xy d");
  assert.equal(renderTemplate(t, { A: "", B: false }).text, "||"); // empty / false do not hold
});

test("render: nested if, missing only reported when rendered", () => {
  const t = "{ if A {a{ if B {b{C}} } {D}} }";
  assert.deepEqual(renderTemplate(t, {}).missing, []);
  assert.deepEqual(renderTemplate(t, { A: 1 }).missing.map((m) => m.name), ["D"]);
  assert.deepEqual(renderTemplate(t, { A: 1, B: 1, D: 1 }).missing.map((m) => m.name), ["C"]);
});

test("render: if block on its own lines", () => {
  const t = "a\n{ if X {\n## Notes\n  {X}\n} }\nb\n  { if X {\nz\n  } }\nc";
  assert.equal(renderTemplate(t, { X: "hi" }).text, "a\n## Notes\n  hi\nb\nz\nc");
  assert.equal(renderTemplate(t, {}).text, "a\nb\nc");
  assert.equal(renderTemplate("a\n  { if X {inline} }  \nb", {}).text, "a\nb"); // empty inline block alone → dropped
});

test("render: else if, else and parentheses", () => {
  const t = "{ if A {a} else if B && C {bc} else if (D || E) && F {def} else {none} }";
  assert.equal(renderTemplate(t, { A: 1, B: 1, C: 1 }).text, "a");
  assert.equal(renderTemplate(t, { B: 1, C: 1 }).text, "bc");
  assert.equal(renderTemplate(t, { B: 1, E: 1, F: 1 }).text, "def");
  assert.equal(renderTemplate(t, { D: 1 }).text, "none");
  assert.equal(renderTemplate("{ if A || B && C {x} }", { A: 1 }).text, "x");
  assert.equal(renderTemplate("{ if (A || B) && C {x} }", { A: 1 }).text, "");
  assert.deepEqual(renderTemplate("{ if A { {X} } else { {Y} } }", {}).missing.map((m) => m.name), ["Y"]);
});

test("render: not, nand and nor", () => {
  const r = (cond: string, v: Record<string, string>) => renderTemplate(`{ if ${cond} {y} else {n} }`, v).text;
  assert.equal(r("!A", {}), "y");
  assert.equal(r("!A", { A: "1" }), "n");
  assert.equal(r("!!A", { A: "1" }), "y");
  assert.equal(r("!(A && B)", { A: "1" }), "y");
  assert.equal(r("A !& B", { A: "1", B: "1" }), "n");
  assert.equal(r("A !& B", { A: "1" }), "y");
  assert.equal(r("A !| B", {}), "y");
  assert.equal(r("A !| B", { B: "1" }), "n");
  assert.equal(r("!A && B", { B: "1" }), "y"); // ! binds tightest
  assert.equal(r("A || B !& C", { A: "1" }), "y"); // !& binds tighter than ||
  assert.equal(r("A !| B || C", { C: "1" }), "y"); // !| and || group left to right
  assert.deepEqual(scanTemplate("{ if !(A !& B) !| C {x} }").placeholders.map((p) => p.name), ["A", "B", "C"]);
  assert.equal(scanTemplate("{ if A ! B {x} }").errors.length, 1);
  assert.equal(scanTemplate("{ if ! {x} }").errors.length, 1);
});

test("render: whole-line else chain", () => {
  const t = "a\n{ if X {\nx\n} else if Y {\ny\n} else {\nz\n} }\nb";
  assert.equal(renderTemplate(t, { X: 1 }).text, "a\nx\nb");
  assert.equal(renderTemplate(t, { Y: 1 }).text, "a\ny\nb");
  assert.equal(renderTemplate(t, {}).text, "a\nz\nb");
  assert.equal(renderTemplate("a\n{ if X {\nx\n} else if Y {\ny\n} }\nb", {}).text, "a\nb");
});

test("scan: condition errors", () => {
  assert.equal(scanTemplate("{ if (A || B { x } }").errors.length, 1);
  assert.equal(scanTemplate("{ if A && { x } }").errors.length, 1);
  assert.equal(scanTemplate("{ if A {a} else {b} else {c} }").errors.length > 0, true);
  assert.deepEqual(scanTemplate("{ if (A || B) && C {x} else if D {y} }").placeholders.map((p) => p.name), ["A", "B", "C", "D"]);
});

test("scan: if placeholders and errors", () => {
  const s = scanTemplate("{ if A && B { {C?} } }");
  assert.deepEqual(s.placeholders.map((p) => [p.name, !!p.condition]), [["A", true], ["B", true], ["C", false]]);
  assert.equal(s.errors.length, 0);
  assert.equal(scanTemplate("{ if A { oops").errors.length, 1);
  assert.equal(scanTemplate("{ if { x } }").errors.length > 0, true);
  assert.equal(scanTemplate('{A?"a","b","c"}').errors.length, 1); // old before/default/after form is gone
});

test("scan: old {?NAME} syntax and default without ? are errors", () => {
  assert.equal(scanTemplate('{?A} {A"x"}').errors.length, 2);
});

test("render: missing required is reported", () => {
  const r = renderTemplate("{A} {B}", { A: 1 });
  assert.deepEqual(r.missing.map((m) => m.name), ["B"]);
});

test("scan: malformed placeholders", () => {
  const { errors, placeholders } = scanTemplate("{ ok } {1bad} {unclosed");
  assert.equal(placeholders.length, 1);
  assert.equal(errors.length, 2);
});

test("literals: {{ and }} render { and }, stray braces are errors", () => {
  assert.equal(renderTemplate("a {{ b", {}).text, "a { b");
  assert.equal(renderTemplate("a }} b", {}).text, "a } b");
  assert.equal(renderTemplate("{{NAME}} {{{N}}}", { N: "v" }).text, "{NAME} {v}");
  assert.equal(renderTemplate("{{{{", {}).text, "{{");
  assert.equal(scanTemplate("a { b").errors.length, 1);
  assert.equal(scanTemplate("a } b").errors.length, 1);
  assert.equal(scanTemplate("{ if A {x}}").errors.length > 0, true); // adjacent }} is a literal, so the block is unclosed
  assert.equal(renderTemplate("{ if A {a}} b} }", { A: 1 }).text, "a} b");
});

test("raw blocks: {!...!} is taken as-is", () => {
  assert.equal(renderTemplate("{!{NAME} } { {! {{!}", {}).text, "{NAME} } { {! {{");
  assert.equal(scanTemplate("{!{NAME} } {!!}").errors.length, 0);
  assert.equal(scanTemplate("{!{NAME}").errors.length, 1); // unclosed
  assert.equal(renderTemplate("{ if A {{!{ ok }!} } }", { A: 1 }).text, "{ ok } ");
  // a literal !} : close the block, write !}}, start a new block
  assert.equal(renderTemplate("{!a!}!}}{!b!}", {}).text, "a!}b");
  assert.equal(renderTemplate("{!{NAME}!} {NAME}", { NAME: "v" }).text, "{NAME} v");
});

test("project: build with precedence and suffix resolution", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.mkdirSync(path.join(dir, "p/base"), { recursive: true });
  fs.writeFileSync(path.join(dir, "glugent.config.json"), JSON.stringify({ props: { LANG: "cfg" } }));
  fs.writeFileSync(path.join(dir, "p/base/id.ggen.md"), "---\ndefaults:\n  ROLE: dflt\n---\nRole {ROLE} lang {LANG} {EXTRA?}");
  fs.writeFileSync(path.join(dir, "a.agent.ggen.json"), JSON.stringify({ name: "a", props: { ROLE: "agent", LANG: "agent" }, sections: ["id"] }));
  const project = loadProject(path.join(dir, "glugent.config.json"));
  const res = compileTarget(project, project.targets[0], { overrides: { EXTRA: "!" } });
  assert.equal(res.content, "Role agent lang cfg !\n");
  assert.deepEqual(validateProject(project), []);
});

test("project: unknown section and missing prop", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), "{}");
  fs.writeFileSync(path.join(dir, "s.ggen.md"), "{NEED}");
  fs.writeFileSync(path.join(dir, "a.agent.ggen.json"), JSON.stringify({ name: "a", sections: ["s", "nope"] }));
  const d = validateProject(loadProject(path.join(dir, "glugent.config.json")));
  assert.equal(d.length, 2);
});

test("project: .target, .agent and .doc files are all targets", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), "{}");
  fs.writeFileSync(path.join(dir, "s.ggen.md"), "text");
  for (const kind of ["target", "agent", "doc"]) {
    fs.writeFileSync(path.join(dir, `${kind}.${kind}.ggen.json`), JSON.stringify({ name: kind, sections: ["s"] }));
  }
  const project = loadProject(path.join(dir, "glugent.config.json"));
  assert.deepEqual(project.targets.map((t) => t.name).sort(), ["agent", "doc", "target"]);
  assert.equal(compileAgent(project, project.targets[0]).content, "text\n"); // deprecated alias still works
});

test("project: config `targets` and the deprecated `agents` are merged", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.mkdirSync(path.join(dir, "t"));
  fs.mkdirSync(path.join(dir, "a"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), JSON.stringify({ targets: { include: ["t/*.json"] }, agents: { include: ["a/*.json"] } }));
  fs.writeFileSync(path.join(dir, "s.ggen.md"), "text");
  fs.writeFileSync(path.join(dir, "t/one.json"), JSON.stringify({ name: "one", sections: ["s"] }));
  fs.writeFileSync(path.join(dir, "a/two.json"), JSON.stringify({ name: "two", sections: ["s"] }));
  const project = loadProject(path.join(dir, "glugent.config.json"));
  assert.deepEqual(project.targets.map((t) => t.name).sort(), ["one", "two"]);
});

test("project: duplicate target names are reported", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), "{}");
  fs.writeFileSync(path.join(dir, "s.ggen.md"), "text");
  fs.writeFileSync(path.join(dir, "x.agent.ggen.json"), JSON.stringify({ name: "same", sections: ["s"] }));
  fs.writeFileSync(path.join(dir, "y.doc.ggen.json"), JSON.stringify({ name: "same", sections: ["s"] }));
  const d = loadProject(path.join(dir, "glugent.config.json")).diagnostics;
  assert.equal(d.length, 1);
  assert.match(d[0].message, /Duplicate target name 'same'/);
});

test("render: trim markers remove whitespace on the marked side when empty", () => {
  // inline: spaces/tabs only, never newlines
  assert.equal(renderTemplate("a  \t{-X?-}  b", {}).text, "ab");
  assert.equal(renderTemplate("a  {-X?}  b", {}).text, "a  b");
  assert.equal(renderTemplate("a  {X?-}  b", {}).text, "a  b");
  assert.equal(renderTemplate("a {-X?-}\nb", {}).text, "a\nb");
  assert.equal(renderTemplate("a\n{-X?-}x", {}).text, "a\nx");
  // set values are untouched
  assert.equal(renderTemplate("a  {-X?-}  b", { X: "v" }).text, "a  v  b");
  // alone on a line: the line goes, plus all whitespace (newlines too) on the marked side
  assert.equal(renderTemplate("a\n\n\n{-X?}\n\nb", {}).text, "a\nb");
  assert.equal(renderTemplate("a\n\n{X?-}\n\n\nb", {}).text, "a\n\nb");
  assert.equal(renderTemplate("a\n\n{-X?-}\n\n\nb", {}).text, "ab");
  assert.deepEqual(renderTemplate("{-X?-}", {}).missing, []);
  assert.equal(scanTemplate("{A-B}").errors.length, 1); // hyphens are not allowed in names
  assert.equal(scanTemplate("{A.B}").placeholders[0].name, "A.B");
  assert.equal(scanTemplate("{-X?-}").placeholders[0].name, "X");
});

test("scan: trim markers need '?' and forbid defaults", () => {
  assert.equal(scanTemplate("{-X}").errors.length, 1);
  assert.equal(scanTemplate("{X?-}").errors.length, 0);
  assert.equal(scanTemplate('{-X?"d"}').errors.length, 1);
  assert.equal(scanTemplate('{X?"d"-}').errors.length, 1);
});

test("render: trim markers on if blocks", () => {
  // inline
  assert.equal(renderTemplate("a  {- if A {x} -}  b", {}).text, "ab");
  assert.equal(renderTemplate("a  { if A {x} -}  b", {}).text, "a  b");
  assert.equal(renderTemplate("a  {- if A {x} -}  b", { A: "1" }).text, "a  x  b");
  // whole lines
  const tpl = "a\n\n{- if A {\nx\n} -}\n\nb";
  assert.equal(renderTemplate(tpl, {}).text, "ab");
  assert.equal(renderTemplate(tpl, { A: "1" }).text, "a\n\nx\n\nb");
  assert.equal(scanTemplate(tpl).errors.length, 0);
});

test("scan: REF tags, and keywords still work as prop names", () => {
  assert.deepEqual(scanTemplate("{REF} {SLOT} {if} { REF } {REF?} {BEGIN}").placeholders.map((p) => p.name), ["REF", "SLOT", "if", "REF", "REF", "BEGIN"]);
  assert.deepEqual(scanTemplate("{ REF repo/layout } {REF-OVERRIDE a.b-c}").errors, []);
  assert.deepEqual(scanTemplate("{ REF repo/layout }").placeholders, []);
  assert.match(scanTemplate("{ REF a b }").errors[0].message, /Malformed 'REF'/);
  assert.match(scanTemplate("{REF-OVERRIDE}").errors[0].message, /Malformed 'REF'/);
  assert.match(scanTemplate("{ REF x").errors[0].message, /Malformed 'REF'/);
  assert.match(scanTemplate("{ REF BEGIN }{ REF END }").errors[0].message, /'REF BEGIN' needs a section id/);
  assert.match(scanTemplate("{ REF END x }").errors[0].message, /'REF END' without a matching/);
  assert.equal(renderTemplate("a { REF x } b", {}).text, "a { REF x } b"); // no renderRef: left as written
});

test("render: REF calls renderRef and drops its line when empty", () => {
  const seen: string[] = [];
  const r = renderTemplate("a\n{ REF x }\nb { REF-OVERRIDE y } c", {}, { lineOffset: 2, renderRef: (ref) => {
    seen.push(`${ref.id}:${ref.override}:${ref.line}:${ref.column}`);
    return ref.id === "y" ? "Y" : "";
  } });
  assert.equal(r.text, "a\nb Y c");
  assert.deepEqual(seen, ["x:false:3:0", "y:true:4:2"]);
});

test("project: REF renders with the section's own props, REF-OVERRIDE with the includer's on top", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.mkdirSync(path.join(dir, "parts"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), JSON.stringify({ props: { CFG: "cfg" } }));
  fs.writeFileSync(path.join(dir, "parts/b.ggen.md"), "---\ndefaults:\n  WHO: b\n---\nB: {WHO} {CFG} {T}");
  fs.writeFileSync(path.join(dir, "a.ggen.md"), "---\ndefaults:\n  WHO: a\n  ONLY_A: x\n---\nA:\n{ REF b }\n{ REF-OVERRIDE parts/b }\n{ REF c }");
  fs.writeFileSync(path.join(dir, "c.ggen.md"), "C sees {ONLY_A?\"nothing\"}");
  fs.writeFileSync(path.join(dir, "t.agent.ggen.json"), JSON.stringify({ name: "t", props: { T: "t" }, sections: [{ use: "a", props: { WHO: "entry" } }] }));
  const project = loadProject(path.join(dir, "glugent.config.json"));
  const res = compileTarget(project, project.targets[0]);
  assert.deepEqual(res.diagnostics, []);
  assert.equal(res.content, "A:\nB: b cfg t\nB: entry cfg t\nC sees nothing\n");
  // CLI overrides still win everywhere
  assert.equal(compileTarget(project, project.targets[0], { overrides: { WHO: "cli" } }).content, "A:\nB: cli cfg t\nB: cli cfg t\nC sees nothing\n");
});

test("project: REF problems are reported where they happen", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), "{}");
  fs.writeFileSync(path.join(dir, "c.ggen.md"), "{ REF d }\n{ REF nope }");
  fs.writeFileSync(path.join(dir, "d.ggen.md"), "d {NEED}\n{ REF c }");
  fs.writeFileSync(path.join(dir, "t.agent.ggen.json"), JSON.stringify({ name: "t", sections: ["c"] }));
  const project = loadProject(path.join(dir, "glugent.config.json"));
  const res = compileTarget(project, project.targets[0]);
  const found = res.diagnostics.map((d) => `${path.basename(d.file)}:${d.line}:${d.column} ${d.message}`);
  assert.deepEqual(found, [
    "d.ggen.md:1:0 Section 'c' includes itself: 'c' → 'd' → 'c'",
    "t.agent.ggen.json:0:24 Target 't': required prop 'NEED' of section 'd' (via 'c') has no value",
    "c.ggen.md:1:0 Unknown section 'nope'",
  ]);
  assert.equal(res.content, "d\n");
});

test("scan: slot definitions", () => {
  const { slots, errors } = scanTemplate("a\n{ # }\n  {#extra?}\n{- #notes? -}\nb");
  assert.deepEqual(errors, []);
  assert.deepEqual(slots.map((s) => `${s.name}:${s.optional}:${s.line}`), ["default:false:1", "extra:true:2", "notes:true:3"]);
  assert.match(scanTemplate("a { # } b").errors[0].message, /must be on a line of its own/);
  assert.match(scanTemplate("{ # }\n{ #default? }").errors[0].message, /Slot 'default' is defined twice/);
  assert.match(scanTemplate("{- # -}").errors[0].message, /Trim markers need '\?'/);
  assert.deepEqual(scanTemplate("{SLOT} {SLOT?}").placeholders.map((p) => p.name), ["SLOT", "SLOT"]);
  assert.equal(renderTemplate("a\n\n{- #? -}\n\nb", {}).text, "ab"); // trims like {-X?-} when empty
  assert.equal(renderTemplate("a\n{ #? }\nb", {}, { slots: { default: () => "x\ny" } }).text, "a\nx\ny\nb");
  assert.deepEqual(renderTemplate("{ # }", {}).missingSlots.map((s) => s.name), ["default"]);
});

test("scan: REF blocks and SLOT blocks", () => {
  const ok = "{ REF BEGIN b }\n{ SLOT BEGIN }\nx\n{ SLOT END }\n{ SLOT-INHERIT BEGIN extra }\n{Y}\n{ SLOT END extra }\n{ REF END b }";
  assert.deepEqual(scanTemplate(ok).errors, []);
  assert.deepEqual(scanTemplate(ok).placeholders.map((p) => p.name), ["Y"]);
  const err = (t: string) => scanTemplate(t).errors.map((e) => e.message);
  assert.match(err("{ REF BEGIN b }x{ REF END c }")[0], /'REF END c' does not match 'REF BEGIN b'/);
  assert.match(err("{ REF BEGIN b }x")[0], /Unclosed 'REF BEGIN b'/);
  assert.match(err("{ REF BEGIN b }stray{ SLOT BEGIN }x{ SLOT END }{ REF END b }")[0], /can hold only SLOT blocks/);
  assert.match(err("{ REF BEGIN b }{ SLOT BEGIN }x{ SLOT END }{ SLOT BEGIN default }y{ SLOT END }{ REF END b }")[0], /filled twice/);
  assert.match(err("{ REF BEGIN b }{ SLOT BEGIN a }x{ SLOT END z }{ REF END b }")[0], /'SLOT END z' does not match/);
  assert.match(err("{ SLOT BEGIN }x{ SLOT END }")[0], /SLOT blocks go directly inside/);
  assert.match(err("{ SLOT BEGIN x y }")[0], /Malformed 'SLOT'/);
});

test("project: slots filled from a REF block, from SLOT blocks and from the target", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), "{}");
  // card: a required default slot, an optional named one, an optional trimmed one
  fs.writeFileSync(path.join(dir, "card.ggen.md"), "---\ndefaults:\n  WHO: card\n---\n## {WHO}\n{ # }\n{ #extra? }\n\n{ #notes? -}\n\nend");
  fs.writeFileSync(path.join(dir, "page.ggen.md"), [
    "---", "defaults:", "  WHO: page", "---",
    "{ REF BEGIN card }", "default by {WHO}", "{ REF END card }",
    "---",
    "{ REF BEGIN card }",
    "{ SLOT BEGIN }", "mine: {WHO}", "{ SLOT END }",
    "{ SLOT-INHERIT BEGIN extra }", "inherited: {WHO} {ONLY_PAGE}", "{ SLOT END extra }",
    "{ REF END card }",
  ].join("\n").replace("defaults:\n  WHO: page", "defaults:\n  WHO: page\n  ONLY_PAGE: p"));
  fs.writeFileSync(path.join(dir, "t.agent.ggen.json"), JSON.stringify({
    name: "t",
    sections: ["page", { use: "card", props: { WHO: "entry" }, slots: { default: "from the target, {WHO}", notes: "{ REF note }" } }],
  }));
  fs.writeFileSync(path.join(dir, "note.ggen.md"), "a note");
  const project = loadProject(path.join(dir, "glugent.config.json"));
  assert.deepEqual(project.diagnostics, []);
  const res = compileTarget(project, project.targets[0]);
  assert.deepEqual(res.diagnostics, []);
  assert.equal(res.content, [
    "## card", "default by page", "", "end",
    "---",
    "## card", "mine: page", "inherited: card p", "", "end",
    "",
    "## entry", "from the target, entry", "", "a note", "", "end", "",
  ].join("\n"));
});

test("project: slot problems are reported", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), "{}");
  fs.writeFileSync(path.join(dir, "card.ggen.md"), "{ # }\n{ #opt? }");
  fs.writeFileSync(path.join(dir, "page.ggen.md"), "{ REF card }\n{ REF BEGIN card }\n{ SLOT BEGIN nope }\nx\n{ SLOT END nope }\n{ REF END card }");
  fs.writeFileSync(path.join(dir, "t.agent.ggen.json"), JSON.stringify({ name: "t", sections: ["page", "card", { use: "card", slots: { default: "{NEED}", missing: "x" } }] }));
  const project = loadProject(path.join(dir, "glugent.config.json"));
  const found = compileTarget(project, project.targets[0]).diagnostics.map((d) => `${path.basename(d.file)}:${d.line} ${d.message}`);
  assert.deepEqual(found, [
    "page.ggen.md:0 Required slot 'default' of section 'card' is not filled",
    "page.ggen.md:2 Section 'card' has no slot 'nope'",
    "page.ggen.md:1 Required slot 'default' of section 'card' is not filled",
    "t.agent.ggen.json:0 Required slot 'default' of section 'card' is not filled",
    "t.agent.ggen.json:0 Section 'card' has no slot 'missing'",
    "t.agent.ggen.json:0 In slot 'default' of section 'card': required prop 'NEED' has no value",
  ]);
});

test("scan: props passed to a REF", () => {
  const err = (t: string) => scanTemplate(t).errors.map((e) => e.message);
  assert.deepEqual(err('{ REF a | X="1" Y=true Z=-2.5 W=false } { REF-OVERRIDE BEGIN b | H="{TITLE} x" }{ REF END b }'), []);
  assert.deepEqual(scanTemplate('{ REF a | HEAD="{TITLE} test" }').placeholders.map((p) => p.name), ["TITLE"]);
  assert.deepEqual(scanTemplate('{ REF a | HEAD="{{literal}}" }').placeholders, []);
  assert.match(err("{ REF a | X=maybe }")[0], /Malformed props on 'REF'/);
  assert.match(err('{ REF a | X="1",Y="2" }')[0], /Malformed props on 'REF'/);
  assert.match(err('{ REF a | X="1" X="2" }')[0], /Prop 'X' is passed twice/);
  assert.match(err('{ REF a | X="{oops" }')[0], /In prop 'X': Unexpected '\{'/);
  assert.deepEqual(scanTemplate("{REF} {REF?}").placeholders.map((p) => p.name), ["REF", "REF"]);
});

test("render: REF props are rendered with the including template's props", () => {
  const seen: unknown[] = [];
  const renderRef = (ref: { props?: unknown }) => {
    seen.push(ref.props);
    return "";
  };
  renderTemplate('{ REF a | HEAD="{TITLE} test" N=3 B=false OPT="{X?}" }\n{ REF b }', { TITLE: "Title" }, { renderRef });
  assert.deepEqual(seen, [{ HEAD: "Title test", N: 3, B: false, OPT: "" }, undefined]);
  assert.deepEqual(renderTemplate('{ REF a | HEAD="{NOPE}" }', {}, { renderRef }).missing.map((m) => m.name), ["NOPE"]);
});

test("project: REF props beat the section's own and inherited props, config and CLI beat them", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), JSON.stringify({ props: { CFG: "cfg" } }));
  fs.writeFileSync(path.join(dir, "h.ggen.md"), "---\ndefaults:\n  HEAD: own\n---\n{HEAD} {LEVEL} {CFG}");
  fs.writeFileSync(path.join(dir, "card.ggen.md"), "## {HEAD}\n{ # }");
  fs.writeFileSync(path.join(dir, "a.ggen.md"), [
    "---", "defaults:", "  HEAD: from-a", "  TITLE: Title", "---",
    '{ REF h | HEAD="{TITLE} test" }',
    "{ REF-OVERRIDE h }",
    '{ REF-OVERRIDE h | HEAD="passed" }',
    '{ REF h | CFG="ref" LEVEL=3 }',
    '{ REF BEGIN card | HEAD="card head" }', "body by {TITLE}", "{ REF END card }",
  ].join("\n"));
  fs.writeFileSync(path.join(dir, "t.agent.ggen.json"), JSON.stringify({ name: "t", props: { LEVEL: 2 }, sections: ["a"] }));
  const project = loadProject(path.join(dir, "glugent.config.json"));
  assert.deepEqual(project.diagnostics, []);
  const res = compileTarget(project, project.targets[0]);
  assert.deepEqual(res.diagnostics, []);
  assert.equal(res.content, [
    "Title test 2 cfg", // passed, rendered with a's props; target LEVEL
    "from-a 2 cfg", //     REF-OVERRIDE: a's HEAD
    "passed 2 cfg", //     passed beats inherited
    "own 3 cfg", //        passed LEVEL beats the target's; config beats passed CFG
    "## card head", "body by Title", "",
  ].join("\n"));
  const cli = compileTarget(project, project.targets[0], { overrides: { HEAD: "cli" } }).content;
  assert.equal(cli.split("\n").filter((l) => l.includes("cli")).length, 5); // --set beats everything
});

test("project: a missing prop in a REF value is the including section's", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-"));
  fs.writeFileSync(path.join(dir, "glugent.config.json"), "{}");
  fs.writeFileSync(path.join(dir, "h.ggen.md"), "# {HEAD}");
  fs.writeFileSync(path.join(dir, "a.ggen.md"), '{ REF h | HEAD="{TITLE}" }');
  fs.writeFileSync(path.join(dir, "t.agent.ggen.json"), JSON.stringify({ name: "t", sections: ["a"] }));
  const project = loadProject(path.join(dir, "glugent.config.json"));
  assert.deepEqual(compileTarget(project, project.targets[0]).diagnostics.map((d) => d.message), [
    "Target 't': required prop 'TITLE' of section 'a' has no value",
  ]);
});
