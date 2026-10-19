import { Project } from "@glugent/core";
import { Arguments } from "../arguments";
import { Reporter } from "../reporter";

/** One `glugent <name>` subcommand. `run` returns the process exit code. */
export abstract class Command {
  constructor(
    protected readonly args: Arguments,
    protected readonly out: Reporter,
  ) {}

  abstract run(project: Project): number;
}
