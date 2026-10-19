import * as vscode from "vscode";
import { validateProject } from "@glugent/core";
import { readFile } from "../editor-files";
import { ProjectStore } from "../project-store";
import { Command } from "./command";

/** Glugent: Validate Project */
export class ValidateCommand extends Command {
  constructor(store: ProjectStore) {
    super("glugent.validate", store);
  }

  async run(): Promise<void> {
    const project = await this.picker.project();
    if (!project) return;
    const diagnostics = validateProject(this.store.refresh(project.configFile), { readFile });
    const errors = diagnostics.filter((d) => d.severity === "error").length;
    vscode.window.showInformationMessage(errors ? `Glugent: ${errors} error(s) — see Problems.` : "Glugent: project is valid.");
  }
}
