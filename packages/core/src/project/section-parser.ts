import { parse as parseYaml } from "yaml";
import { diag, isProps } from "../diagnostics";
import { scanTemplate } from "../template";
import { Diagnostic, Props, Section } from "../types";

export const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/;

/** Parses a `.ggen.md` file: optional YAML frontmatter, then the template body. */
export class SectionParser {
  private readonly diagnostics: Diagnostic[] = [];
  private body: string;
  private bodyLineOffset = 0;
  private defaults: Props = {};
  private description?: string;

  constructor(
    private readonly file: string,
    private readonly text: string,
    private readonly id: string,
  ) {
    this.body = text;
  }

  parse(): { section: Section; diagnostics: Diagnostic[] } {
    this.readFrontmatter();
    this.body = this.body.replace(/\r\n/g, "\n");
    const { placeholders, errors } = scanTemplate(this.body, this.bodyLineOffset);
    for (const e of errors) this.diagnostics.push(diag(this.file, e.message, e.line, e.column, e.length));

    const section: Section = {
      id: this.id,
      file: this.file,
      description: this.description,
      defaults: this.defaults,
      body: this.body,
      bodyLineOffset: this.bodyLineOffset,
      placeholders,
    };
    return { section, diagnostics: this.diagnostics };
  }

  private readFrontmatter(): void {
    const match = FRONTMATTER.exec(this.text);
    if (!match) return;
    this.body = this.text.slice(match[0].length);
    this.bodyLineOffset = match[0].split("\n").length - 1;
    try {
      this.applyFrontmatter(parseYaml(match[1]) ?? {});
    } catch (e) {
      this.diagnostics.push(diag(this.file, `Invalid frontmatter: ${(e as Error).message}`, 1));
    }
  }

  private applyFrontmatter(data: { description?: unknown; defaults?: unknown }): void {
    if (data.description !== undefined) this.description = String(data.description);
    if (data.defaults === undefined) return;
    if (isProps(data.defaults)) this.defaults = data.defaults;
    else this.diagnostics.push(diag(this.file, "'defaults' must be a map of string/number/boolean values", 1));
  }
}

export function parseSection(file: string, text: string, id: string): { section: Section; diagnostics: Diagnostic[] } {
  return new SectionParser(file, text, id).parse();
}
