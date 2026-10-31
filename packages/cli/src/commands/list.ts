import { Project } from "@anweba/glugent-core";
import { Command } from "./command";

/** `glugent list`: the targets and sections found in the project. */
export class ListCommand extends Command {
  run(project: Project): number {
    this.out.info("Targets:");
    for (const target of project.targets) {
      this.out.info(`  ${target.name}  (${this.out.relative(target.file, project.root)})`);
    }
    this.out.info("Sections:");
    for (const section of project.sections) this.out.info(`  ${section.id}`);
    return 0;
  }
}
