import * as vscode from "vscode";

/** A piece of the extension that hooks into VS Code when activated. */
export interface Feature {
  register(): vscode.Disposable[];
}
