import { ProjectStore } from "../project-store";
import { AgentBuilder } from "./agent-builder";
import { Command } from "./command";

/** Glugent: Build All Agents */
export class BuildAllCommand extends Command {
  constructor(
    store: ProjectStore,
    private readonly builder: AgentBuilder,
  ) {
    super("glugent.buildAll", store);
  }

  async run(): Promise<void> {
    const project = await this.picker.project();
    if (project) this.builder.build(this.store.refresh(project.configFile));
  }
}
