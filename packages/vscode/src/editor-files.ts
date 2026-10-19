import * as fs from "fs";
import * as vscode from "vscode";

/** Reads unsaved editor buffers first so diagnostics update while typing. */
export function readFile(file: string): string {
  const open = vscode.workspace.textDocuments.find((d) => d.uri.scheme === "file" && d.uri.fsPath === file);
  return open ? open.getText() : fs.readFileSync(file, "utf8");
}
