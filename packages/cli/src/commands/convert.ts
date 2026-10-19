import * as fs from "fs";
import * as path from "path";
import { convertMarkdown } from "@glugent/core";
import { Arguments } from "../arguments";
import { CliError } from "../errors";
import { Reporter } from "../reporter";

/**
 * `glugent convert <file.md>...`: writes `<file>.ggen.md` next to each Markdown
 * file, with its braces escaped. Needs no project. Existing outputs are never
 * overwritten.
 */
export class ConvertCommand {
  constructor(
    private readonly args: Arguments,
    private readonly out: Reporter,
  ) {}

  run(): number {
    if (this.args.names.length === 0) throw new CliError("convert expects at least one .md file");
    let failed = false;
    for (const file of this.args.names) {
      try {
        this.convert(file);
      } catch (e) {
        if (!(e instanceof CliError)) throw e;
        this.out.error(`glugent: ${e.message}`);
        failed = true;
      }
    }
    return failed ? 1 : 0;
  }

  private convert(file: string): void {
    if (!/\.md$/i.test(file) || /\.ggen\.md$/i.test(file)) throw new CliError(`'${file}' is not a plain .md file`);
    if (!fs.existsSync(file)) throw new CliError(`'${file}' not found`);
    const target = file.replace(/\.md$/i, ".ggen.md");
    if (fs.existsSync(target) && !this.args.force) throw new CliError(`'${target}' already exists (use --force to overwrite)`);

    const converted = convertMarkdown(fs.readFileSync(file, "utf8"));
    if (!this.args.dryRun) fs.writeFileSync(target, converted);
    this.out.info(`${this.args.dryRun ? "would write" : "wrote"} ${path.relative(process.cwd(), target) || target}`);
  }
}
