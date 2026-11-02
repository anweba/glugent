import * as vscode from "vscode";
import { Target, compileTarget, Project, writeBuild } from "@anweba/glugent-core";
import { readFile } from "../editor-files";

/**
 * Compiles targets and writes them to disk, telling the user how it went. Writing is the
 * one thing the extension does to a workspace, so it is off in Restricted Mode: the
 * palette hides the build commands there, and this refuses them if run some other way.
 */
export class TargetBuilder {
  build(project: Project, targets: Target[] = project.targets): void {
    if (!vscode.workspace.isTrusted) {
      vscode.window.showWarningMessage("Glugent: building writes files, so it is off in Restricted Mode. Trust this workspace to build.");
      return;
    }
    const built = targets.filter((target) => this.buildOne(project, target)).length;
    if (built) vscode.window.showInformationMessage(`Glugent: built ${built} target${built > 1 ? "s" : ""}.`);
  }

  private buildOne(project: Project, target: Target): boolean {
    const result = compileTarget(project, target, { readFile });
    if (result.diagnostics.some((d) => d.severity === "error")) {
      vscode.window.showErrorMessage(`Glugent: '${target.name}' has errors (see Problems).`);
      return false;
    }
    writeBuild(result);
    return true;
  }
}
