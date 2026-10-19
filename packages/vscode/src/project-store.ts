import * as vscode from "vscode";
import { findConfigUp, loadProject, Project, validateProject } from "@glugent/core";
import { DiagnosticsPublisher } from "./diagnostics-publisher";
import { readFile } from "./editor-files";

/** The loaded Glugent projects of the workspace, kept fresh and published as diagnostics. */
export class ProjectStore {
  private readonly projects = new Map<string, Project>();

  constructor(private readonly diagnostics: DiagnosticsPublisher) {}

  /** Reloads one project from disk and the open editors, and republishes its diagnostics. */
  refresh(configFile: string): Project {
    const project = loadProject(configFile, { readFile });
    this.projects.set(configFile, project);
    this.diagnostics.publish(configFile, validateProject(project, { readFile }));
    return project;
  }

  async refreshAll(): Promise<Project[]> {
    const configs = await vscode.workspace.findFiles("**/glugent.config.json", "**/node_modules/**");
    return configs.map((uri) => this.refresh(uri.fsPath));
  }

  /** The project a document belongs to, loading it on first use. */
  forDocument(doc: vscode.TextDocument): Project | undefined {
    const configFile = this.configFor(doc);
    return configFile ? (this.projects.get(configFile) ?? this.refresh(configFile)) : undefined;
  }

  configFor(doc: vscode.TextDocument): string | undefined {
    return doc.uri.scheme === "file" ? findConfigUp(doc.uri.fsPath) : undefined;
  }
}
