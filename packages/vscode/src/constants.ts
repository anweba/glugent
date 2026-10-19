import * as path from "path";
import * as vscode from "vscode";

export const SECTION_LANG = "glugent";
export const AGENT_FILE = /\.agent\.ggen\.json$/;
export const CONFIG_FILE_NAME = "glugent.config.json";

/** Files whose edits can change the project's diagnostics. */
export function isGlugentFile(doc: vscode.TextDocument): boolean {
  const file = doc.uri.fsPath;
  return doc.languageId === SECTION_LANG || AGENT_FILE.test(file) || path.basename(file) === CONFIG_FILE_NAME;
}
