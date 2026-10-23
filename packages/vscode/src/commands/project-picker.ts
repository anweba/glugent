import * as path from "path";
import * as vscode from "vscode";
import { AgentDef, Project } from "@anweba/glugent-core";
import { ProjectStore } from "../project-store";

/** Asks the user which project (and agent) a command should act on. */
export class ProjectPicker {
  constructor(private readonly store: ProjectStore) {}

  /** The only project in the workspace, or the user's choice among several. */
  async project(): Promise<Project | undefined> {
    const all = await this.store.refreshAll();
    if (!all.length) {
      void vscode.window.showWarningMessage("No glugent.config.json found in the workspace.");
      return;
    }
    if (all.length === 1) return all[0];
    const items = all.map((project) => ({ label: path.basename(project.root), description: project.root, project }));
    return (await vscode.window.showQuickPick(items))?.project;
  }

  async agent(project: Project): Promise<AgentDef | undefined> {
    const items = project.agents.map((agent) => ({
      label: agent.name,
      description: path.relative(project.root, agent.file),
      agent,
    }));
    return (await vscode.window.showQuickPick(items, { placeHolder: "Agent to build" }))?.agent;
  }
}
