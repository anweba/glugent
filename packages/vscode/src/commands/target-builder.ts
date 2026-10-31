import * as vscode from "vscode";
import { Target, compileTarget, Project, writeBuild } from "@anweba/glugent-core";
import { readFile } from "../editor-files";

/** Compiles targets and writes them to disk, telling the user how it went. */
export class TargetBuilder {
  build(project: Project, targets: Target[] = project.targets): void {
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
