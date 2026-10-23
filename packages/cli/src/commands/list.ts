import { Project } from "@anweba/glugent-core";
import { Command } from "./command";

/** `glugent list`: the agents and sections found in the project. */
export class ListCommand extends Command {
  run(project: Project): number {
    this.out.info("Agents:");
    for (const agent of project.agents) {
      this.out.info(`  ${agent.name}  (${this.out.relative(agent.file, project.root)})`);
    }
    this.out.info("Sections:");
    for (const section of project.sections) this.out.info(`  ${section.id}`);
    return 0;
  }
}
