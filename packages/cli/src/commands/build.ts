import { BuildResult, Target, checkBuild, compileTarget, Project, writeBuild } from "@anweba/glugent-core";
import { CliError } from "../errors";
import { Reporter } from "../reporter";
import { Command } from "./command";

/**
 * `glugent build [target...]`: compile targets and write their output files.
 * With `--check`, nothing is written: it fails if an output file is missing or differs.
 */
export class BuildCommand extends Command {
  run(project: Project): number {
    const targets = this.selectTargets(project);

    this.out.diagnostics(project.diagnostics);
    let ok = !Reporter.hasErrors(project.diagnostics);
    let outdated = false;
    for (const target of targets) {
      const result = this.build(project, target);
      if (!result) ok = false;
      else if (!this.args.check) this.write(result);
      else if (!this.check(result)) outdated = true;
    }
    if (outdated) this.out.error("Run 'glugent build' to update the files above.");
    return ok && !outdated ? 0 : 1;
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

  /** Compiles one target; returns undefined (and writes nothing) if it has errors. */
  private build(project: Project, target: Target): BuildResult | undefined {
    const result = compileTarget(project, target, { overrides: this.args.overrides });
    this.out.diagnostics(result.diagnostics);
    if (Reporter.hasErrors(result.diagnostics)) {
      this.out.error(`✗ ${target.name} (not written)`);
      return undefined;
    }
    return result;
  }

  private write(result: BuildResult): void {
    if (!this.args.dryRun) writeBuild(result);
    const note = this.args.dryRun ? " (dry run)" : "";
    this.out.info(`✓ ${result.target.name} → ${this.out.relative(result.outputFile)}${note}`);
  }

  /** `--check`: true when the file on disk is what the build would write. */
  private check(result: BuildResult): boolean {
    const status = checkBuild(result);
    const line = `${result.target.name} → ${this.out.relative(result.outputFile)}`;
    if (status === "current") this.out.info(`✓ ${line} (up to date)`);
    else this.out.error(`✗ ${line} (${status === "missing" ? "missing" : "out of date"})`);
    return status === "current";
  }
}
