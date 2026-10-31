import { Props } from "@anweba/glugent-core";
import { CliError } from "./errors";

/** The parsed command line: `glugent <command> [names...] [flags]`. */
export class Arguments {
  command?: string;
  /** Positional arguments after the command (e.g. target names). */
  names: string[] = [];
  /** `--set KEY=VALUE` overrides; they win over every other prop layer. */
  overrides: Props = {};
  config?: string;
  dryRun = false;
  force = false;

  static parse(argv: string[]): Arguments {
    const args = new Arguments();
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === "--set") args.addOverride(argv[++i] ?? "");
      else if (arg === "--config" || arg === "-c") args.config = argv[++i];
      else if (arg === "--dry-run") args.dryRun = true;
      else if (arg === "--force") args.force = true;
      else if (arg === "-h" || arg === "--help") args.command = "help";
      else if (!args.command) args.command = arg;
      else args.names.push(arg);
    }
    return args;
  }

  private addOverride(assignment: string): void {
    const eq = assignment.indexOf("=");
    if (eq < 1) throw new CliError(`--set expects KEY=VALUE, got '${assignment}'`);
    this.overrides[assignment.slice(0, eq)] = assignment.slice(eq + 1);
  }
}
