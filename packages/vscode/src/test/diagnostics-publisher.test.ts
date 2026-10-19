import { test } from "node:test";
import assert from "node:assert";
import { DiagnosticsPublisher } from "../diagnostics-publisher";
import { DiagnosticSeverity, reset, state } from "./vscode-stub";

const diagnostic = (file: string, message: string, severity: "error" | "warning" = "error") =>
  ({ file, message, severity, line: 2, column: 4, length: 3 });

test("publishes diagnostics per file with range, severity and source", () => {
  reset();
  const publisher = new DiagnosticsPublisher();
  publisher.publish("/p/glugent.config.json", [diagnostic("/p/a.ggen.md", "bad"), diagnostic("/p/b.ggen.md", "meh", "warning")]);

  const entries = state.collections[0].entries;
  const [a] = entries.get("/p/a.ggen.md")!;
  assert.equal(a.message, "bad");
  assert.equal(a.severity, DiagnosticSeverity.Error);
  assert.equal(a.source, "glugent");
  assert.deepEqual([a.range.start.line, a.range.start.character, a.range.end.character], [2, 4, 7]);
  assert.equal(entries.get("/p/b.ggen.md")![0].severity, DiagnosticSeverity.Warning);
});

test("clears files that no longer have problems, keeps other projects", () => {
  reset();
  const publisher = new DiagnosticsPublisher();
  publisher.publish("/p/config", [diagnostic("/p/a", "x"), diagnostic("/p/b", "y")]);
  publisher.publish("/q/config", [diagnostic("/q/c", "z")]);
  publisher.publish("/p/config", [diagnostic("/p/b", "y")]);

  assert.deepEqual([...state.collections[0].entries.keys()].sort(), ["/p/b", "/q/c"]);
});

test("registers its collection for disposal", () => {
  reset();
  assert.equal(new DiagnosticsPublisher().register().length, 1);
});
