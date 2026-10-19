import * as vscode from "vscode";
import { Feature } from "../feature";
import { ProjectStore } from "../project-store";
import { ProjectPicker } from "./project-picker";

/** A command-palette command that acts on a project chosen by the user. */
export abstract class Command implements Feature {
  protected readonly picker: ProjectPicker;

  constructor(
    private readonly id: string,
    protected readonly store: ProjectStore,
  ) {
    this.picker = new ProjectPicker(store);
  }

  abstract run(): Promise<void>;

  register(): vscode.Disposable[] {
    return [vscode.commands.registerCommand(this.id, () => this.run())];
  }
}
