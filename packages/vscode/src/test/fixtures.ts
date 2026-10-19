import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Position } from "./vscode-stub";

/** Writes a project to a temp directory; returns its root. */
export function createProject(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ggen-vscode-"));
  const all = { "glugent.config.json": "{}", ...files };
  for (const [name, content] of Object.entries(all)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), content);
  }
  return root;
}

export const configOf = (root: string) => path.join(root, "glugent.config.json");

export const agentJson = (name: string, sections: string[]) => JSON.stringify({ name, sections });

/** The parts of a TextDocument the extension reads. */
export function documentAt(file: string, languageId = "glugent", scheme = "file") {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  return {
    uri: { scheme, fsPath: file },
    languageId,
    getText: () => text,
    lineAt: (pos: Position) => ({ text: lines[pos.line] }),
  } as any;
}

/** The position just before the first occurrence of `needle` (or its end with `after`). */
export function positionOf(file: string, needle: string, after = false): any {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (let line = 0; line < lines.length; line++) {
    const column = lines[line].indexOf(needle);
    if (column !== -1) return new Position(line, column + (after ? needle.length : 0));
  }
  throw new Error(`'${needle}' not found in ${file}`);
}
