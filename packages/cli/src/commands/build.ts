import { AgentDef, compileAgent, Project, writeBuild } from "@glugent/core";
import { CliError } from "../errors";
import { Reporter } from "../reporter";
import { Command } from "./command";

/** `glugent build [agent...]`: compile agents and write their output files. */
export class BuildCommand extends Command {
  run(project: Project): number {
    const agents = this.selectAgents(project);

    this.out.diagnostics(project.diagnostics);
    let ok = !Reporter.hasErrors(project.diagnostics);
    for (const agent of agents) {
      if (!this.build(project, agent)) ok = false;
    }
    return ok ? 0 : 1;
  }

  /** The agents named on the command line, or all of them. */
  private selectAgents(project: Project): AgentDef[] {
    const agents = this.args.names.length ? this.args.names.map((name) => this.find(project, name)) : project.agents;
    if (!agents.length) throw new CliError("no agents found");
    return agents;
  }

  private find(project: Project, name: string): AgentDef {
    const agent = project.agents.find((a) => a.name === name);
    if (!agent) throw new CliError(`unknown agent '${name}'`);
    return agent;
  }

  /** Builds one agent; returns false (and writes nothing) if it has errors. */
  private build(project: Project, agent: AgentDef): boolean {
    const result = compileAgent(project, agent, { overrides: this.args.overrides });
    this.out.diagnostics(result.diagnostics);
    if (Reporter.hasErrors(result.diagnostics)) {
      this.out.error(`✗ ${agent.name} (not written)`);
      return false;
    }
    if (!this.args.dryRun) writeBuild(result);
    const note = this.args.dryRun ? " (dry run)" : "";
    this.out.info(`✓ ${agent.name} → ${this.out.relative(result.outputFile)}${note}`);
    return true;
  }
}
