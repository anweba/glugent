import { Project, validateProject } from "@anweba/glugent-core";
import { Reporter } from "../reporter";
import { Command } from "./command";

/** `glugent validate`: report every problem without writing anything. */
export class ValidateCommand extends Command {
  run(project: Project): number {
    const diagnostics = validateProject(project, { overrides: this.args.overrides });
    this.out.diagnostics(diagnostics);
    const errors = diagnostics.filter((d) => d.severity === "error").length;
    this.out.info(errors ? `${errors} error(s)` : "OK");
    return errors ? 1 : 0;
  }
}
