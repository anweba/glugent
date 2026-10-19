import * as path from "path";
import { findConfigUp, loadProject, Project } from "@glugent/core";
import { Arguments } from "./arguments";
import { BuildCommand } from "./commands/build";
import { Command } from "./commands/command";
import { ConvertCommand } from "./commands/convert";
import { ListCommand } from "./commands/list";
import { ValidateCommand } from "./commands/validate";
import { CliError } from "./errors";
import { HELP } from "./help";
import { Reporter } from "./reporter";

type CommandClass = new (args: Arguments, out: Reporter) => Command;

const COMMANDS: Record<string, CommandClass> = {
  build: BuildCommand,
  validate: ValidateCommand,
  list: ListCommand,
};

/**
 * The program: parse the arguments, pick the command, load the project, run.
 * Each step lives in its own method so `run` reads top to bottom.
 */
export class Cli {
  constructor(private readonly out = new Reporter()) {}

  /** Returns the exit code; throws CliError for user mistakes. */
  run(argv: string[]): number {
    const args = Arguments.parse(argv);
    if (!args.command || args.command === "help") return this.help();

    if (args.command === "convert") return new ConvertCommand(args, this.out).run();

    const command = this.createCommand(args);
    return command.run(this.loadProject(args));
  }

  private help(): number {
    this.out.info(HELP);
    return 0;
  }

  private createCommand(args: Arguments): Command {
    const CommandType = COMMANDS[args.command!];
    if (!CommandType) throw new CliError(`unknown command '${args.command}'\n\n${HELP}`);
    return new CommandType(args, this.out);
  }

  private loadProject(args: Arguments): Project {
    const configFile = args.config ? path.resolve(args.config) : findConfigUp(process.cwd());
    if (!configFile) throw new CliError("glugent.config.json not found (searched upward from the current directory)");
    return loadProject(configFile);
  }
}

export function main(argv: string[]): void {
  const out = new Reporter();
  try {
    process.exit(new Cli(out).run(argv));
  } catch (e) {
    if (!(e instanceof CliError)) throw e;
    out.error(`glugent: ${e.message}`);
    process.exit(1);
  }
}
