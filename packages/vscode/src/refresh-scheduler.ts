import * as vscode from "vscode";
import { isGlugentFile } from "./constants";
import { Feature } from "./feature";
import { ProjectStore } from "./project-store";

const DEBOUNCE_MS = 250;

/** Keeps diagnostics current: refreshes a project shortly after its files change. */
export class RefreshScheduler implements Feature {
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly store: ProjectStore) {}

  register(): vscode.Disposable[] {
    const refreshAll = () => void this.store.refreshAll();
    void this.store.refreshAll();
    return [
      vscode.workspace.onDidOpenTextDocument((doc) => this.schedule(doc)),
      vscode.workspace.onDidChangeTextDocument((e) => this.schedule(e.document)),
      vscode.workspace.onDidSaveTextDocument((doc) => this.schedule(doc)),
      vscode.workspace.onDidCreateFiles(refreshAll),
      vscode.workspace.onDidDeleteFiles(refreshAll),
      vscode.workspace.onDidRenameFiles(refreshAll),
      new vscode.Disposable(() => clearTimeout(this.timer)),
    ];
  }

  private schedule(doc: vscode.TextDocument): void {
    if (!isGlugentFile(doc)) return;
    const configFile = this.store.configFor(doc);
    if (!configFile) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.store.refresh(configFile), DEBOUNCE_MS);
  }
}
