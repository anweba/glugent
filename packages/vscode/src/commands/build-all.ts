import { ProjectStore } from "../project-store";
import { TargetBuilder } from "./target-builder";
import { Command } from "./command";

/** Glugent: Build All Targets */
export class BuildAllCommand extends Command {
  constructor(
    store: ProjectStore,
    private readonly builder: TargetBuilder,
  ) {
    super("glugent.buildAll", store);
  }

  async run(): Promise<void> {
    const project = await this.picker.project();
    if (project) this.builder.build(this.store.refresh(project.configFile));
  }
}
