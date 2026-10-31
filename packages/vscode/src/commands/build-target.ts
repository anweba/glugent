import { ProjectStore } from "../project-store";
import { TargetBuilder } from "./target-builder";
import { Command } from "./command";

/** Glugent: Build Target... */
export class BuildTargetCommand extends Command {
  constructor(
    store: ProjectStore,
    private readonly builder: TargetBuilder,
  ) {
    super("glugent.buildTarget", store);
  }

  async run(): Promise<void> {
    const project = await this.picker.project();
    if (!project) return;
    const target = await this.picker.target(project);
    if (target) this.builder.build(this.store.refresh(project.configFile), [target]);
  }
}
