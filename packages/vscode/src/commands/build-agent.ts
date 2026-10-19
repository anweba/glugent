import { ProjectStore } from "../project-store";
import { AgentBuilder } from "./agent-builder";
import { Command } from "./command";

/** Glugent: Build Agent... */
export class BuildAgentCommand extends Command {
  constructor(
    store: ProjectStore,
    private readonly builder: AgentBuilder,
  ) {
    super("glugent.buildAgent", store);
  }

  async run(): Promise<void> {
    const project = await this.picker.project();
    if (!project) return;
    const agent = await this.picker.agent(project);
    if (agent) this.builder.build(this.store.refresh(project.configFile), [agent]);
  }
}
