import { test } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renderTemplate, scanTemplate, loadProject, compileAgent, validateProject } from "../index";


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
  const res = compileAgent(project, project.agents[0], { overrides: { EXTRA: "!" } });
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
  assert.equal(scanTemplate("{A-B}").placeholders[0].name, "A-B");
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
