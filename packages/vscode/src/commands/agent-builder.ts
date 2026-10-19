import * as vscode from "vscode";
import { AgentDef, compileAgent, Project, writeBuild } from "@glugent/core";
import { readFile } from "../editor-files";

/** Compiles agents and writes them to disk, telling the user how it went. */
export class AgentBuilder {
  build(project: Project, agents: AgentDef[] = project.agents): void {
    const built = agents.filter((agent) => this.buildOne(project, agent)).length;
    if (built) vscode.window.showInformationMessage(`Glugent: built ${built} agent${built > 1 ? "s" : ""}.`);
  }

  private buildOne(project: Project, agent: AgentDef): boolean {
    const result = compileAgent(project, agent, { readFile });
    if (result.diagnostics.some((d) => d.severity === "error")) {
      vscode.window.showErrorMessage(`Glugent: '${agent.name}' has errors (see Problems).`);
      return false;
    }
    writeBuild(result);
    return true;
  }
}
