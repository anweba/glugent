import * as vscode from "vscode";
import { AgentBuilder } from "./commands/agent-builder";
import { BuildAgentCommand } from "./commands/build-agent";
import { BuildAllCommand } from "./commands/build-all";
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
  const builder = new AgentBuilder();

  const features: Feature[] = [
    diagnostics,
    new RefreshScheduler(store),
    new PropCompletion(store),
    new SectionCompletion(store),
    new PropHover(store),
    new BuildAllCommand(store, builder),
    new BuildAgentCommand(store, builder),
    new ValidateCommand(store),
  ];
  for (const feature of features) context.subscriptions.push(...feature.register());
}

export function deactivate(): void {}
