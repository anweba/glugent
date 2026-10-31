import * as vscode from "vscode";
import { BuildTargetCommand } from "./commands/build-target";
import { BuildAllCommand } from "./commands/build-all";
import { TargetBuilder } from "./commands/target-builder";
import { ValidateCommand } from "./commands/validate";
import { PropCompletion } from "./completion/prop-completion";
import { SectionCompletion } from "./completion/section-completion";
import { DiagnosticsPublisher } from "./diagnostics-publisher";
import { Feature } from "./feature";
import { PropHover } from "./hover/prop-hover";
import { ProjectStore } from "./project-store";
import { RefreshScheduler } from "./refresh-scheduler";

/** Wires the features together; each one registers itself with VS Code. */
export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = new DiagnosticsPublisher();
  const store = new ProjectStore(diagnostics);
  const builder = new TargetBuilder();

  const features: Feature[] = [
    diagnostics,
    new RefreshScheduler(store),
    new PropCompletion(store),
    new SectionCompletion(store),
    new PropHover(store),
    new BuildAllCommand(store, builder),
    new BuildTargetCommand(store, builder),
    new ValidateCommand(store),
  ];
  for (const feature of features) context.subscriptions.push(...feature.register());
}

export function deactivate(): void {}
