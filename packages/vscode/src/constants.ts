import * as path from "path";
import * as vscode from "vscode";

export const SECTION_LANG = "glugent";
export const TARGET_FILE = /\.(target|agent|doc)\.ggen\.json$/;
export const CONFIG_FILE_NAME = "glugent.config.json";

/** Sections can sit anywhere the config says, and VS Code may still call them markdown. */
const SECTION_FILE = /\.md$/;

/** Files whose edits can change the project's diagnostics. */
export function isGlugentFile(doc: vscode.TextDocument): boolean {
  const file = doc.uri.fsPath;
  return doc.languageId === SECTION_LANG || SECTION_FILE.test(file) || TARGET_FILE.test(file) || path.basename(file) === CONFIG_FILE_NAME;
}
