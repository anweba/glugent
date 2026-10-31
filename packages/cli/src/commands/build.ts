import { Target, compileTarget, Project, writeBuild } from "@anweba/glugent-core";
import { CliError } from "../errors";
import { Reporter } from "../reporter";
import { Command } from "./command";

/** `glugent build [target...]`: compile targets and write their output files. */
export class BuildCommand extends Command {
  run(project: Project): number {
    const targets = this.selectTargets(project);

    this.out.diagnostics(project.diagnostics);
    let ok = !Reporter.hasErrors(project.diagnostics);
    for (const target of targets) {
      if (!this.build(project, target)) ok = false;
    }
    return ok ? 0 : 1;
  }

  /** The targets named on the command line, or all of them. */
  private selectTargets(project: Project): Target[] {
    const targets = this.args.names.length ? this.args.names.map((name) => this.find(project, name)) : project.targets;
    if (!targets.length) throw new CliError("no targets found");
    return targets;
  }

  private find(project: Project, name: string): Target {
    const target = project.targets.find((t) => t.name === name);
    if (!target) throw new CliError(`unknown target '${name}'`);
    return target;
  }

  /** Builds one target; returns false (and writes nothing) if it has errors. */
  private build(project: Project, target: Target): boolean {
    const result = compileTarget(project, target, { overrides: this.args.overrides });
    this.out.diagnostics(result.diagnostics);
    if (Reporter.hasErrors(result.diagnostics)) {
      this.out.error(`✗ ${target.name} (not written)`);
      return false;
    }
    if (!this.args.dryRun) writeBuild(result);
    const note = this.args.dryRun ? " (dry run)" : "";
    this.out.info(`✓ ${target.name} → ${this.out.relative(result.outputFile)}${note}`);
    return true;
  }
}
