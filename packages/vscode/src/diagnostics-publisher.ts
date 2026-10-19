import * as vscode from "vscode";
import { Diagnostic } from "@glugent/core";
import { Feature } from "./feature";

/** Shows a project's diagnostics in the Problems panel, clearing ones that no longer apply. */
export class DiagnosticsPublisher implements Feature {
  private readonly collection = vscode.languages.createDiagnosticCollection("glugent");
  /** Files we published diagnostics for, per config file, so stale ones can be cleared. */
  private readonly published = new Map<string, Set<string>>();

  register(): vscode.Disposable[] {
    return [this.collection];
  }

  publish(configFile: string, diagnostics: Diagnostic[]): void {
    const byFile = this.groupByFile(diagnostics);
    for (const file of this.published.get(configFile) ?? []) {
      if (!byFile.has(file)) this.collection.delete(vscode.Uri.file(file));
    }
    for (const [file, list] of byFile) this.collection.set(vscode.Uri.file(file), list);
    this.published.set(configFile, new Set(byFile.keys()));
  }

  private groupByFile(diagnostics: Diagnostic[]): Map<string, vscode.Diagnostic[]> {
    const byFile = new Map<string, vscode.Diagnostic[]>();
    for (const d of diagnostics) {
      const list = byFile.get(d.file) ?? [];
      list.push(this.toVsCode(d));
      byFile.set(d.file, list);
    }
    return byFile;
  }

  private toVsCode(d: Diagnostic): vscode.Diagnostic {
    const range = new vscode.Range(d.line, d.column, d.line, d.column + Math.max(d.length, 1));
    const severity = d.severity === "error" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
    const diagnostic = new vscode.Diagnostic(range, d.message, severity);
    diagnostic.source = "glugent";
    return diagnostic;
  }
}
