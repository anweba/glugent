import { diag, isProps } from "../diagnostics";
import { Target, Diagnostic, SectionRef } from "../types";

const PROPS_HINT = "must be a map of string/number/boolean";

/** Parses a target file (`*.target.ggen.json`, `*.agent.ggen.json` or `*.doc.ggen.json`) into a Target, reporting every problem found. */
export class TargetParser {
  private readonly diagnostics: Diagnostic[] = [];

  constructor(
    private readonly file: string,
    private readonly text: string,
  ) {}

  parse(): { target?: Target; diagnostics: Diagnostic[] } {
    const data = this.readJson();
    if (data === undefined) return { diagnostics: this.diagnostics };

    this.checkShape(data);
    if (this.diagnostics.length) return { diagnostics: this.diagnostics };

    const sections = (data.sections as unknown[]).flatMap((entry) => this.sectionRef(entry));
    const target: Target = {
      file: this.file,
      name: data.name,
      output: typeof data.output === "string" ? data.output : undefined,
      props: data.props,
      sections,
    };
    return { target, diagnostics: this.diagnostics };
  }

  private readJson(): any | undefined {
    let data: any;
    try {
      data = JSON.parse(this.text);
    } catch (e) {
      this.fail(`Invalid JSON: ${(e as Error).message}`);
      return;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      this.fail("Target definition must be a JSON object");
      return;
    }
    return data;
  }

  private checkShape(data: any): void {
    if (typeof data.name !== "string" || !data.name) this.fail("Target needs a string 'name'");
    if (!Array.isArray(data.sections)) this.fail("Target needs a 'sections' array");
    if (data.props !== undefined && !isProps(data.props)) this.fail(`'props' ${PROPS_HINT}`);
  }

  /** A section entry is `"name"` or `{ "use": "name", "props": {...}, "slots": {...} }`. */
  private sectionRef(entry: any): SectionRef[] {
    if (typeof entry === "string") return [{ use: entry }];
    if (entry && typeof entry.use === "string") {
      if (entry.props !== undefined && !isProps(entry.props)) this.fail(`'props' of section '${entry.use}' ${PROPS_HINT}`);
      if (entry.slots !== undefined && !isStringMap(entry.slots)) this.fail(`'slots' of section '${entry.use}' must be a map of strings`);
      return [{ use: entry.use, props: entry.props, slots: entry.slots }];
    }
    this.fail('Each section must be a string or { "use": "..." }');
    return [];
  }

  private fail(message: string): void {
    this.diagnostics.push(diag(this.file, message));
  }
}

function isStringMap(value: unknown): value is Record<string, string> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((v) => typeof v === "string");
}

export function parseTarget(file: string, text: string): { target?: Target; diagnostics: Diagnostic[] } {
  return new TargetParser(file, text).parse();
}

/** @deprecated Use `parseTarget`. */
export const parseAgent = parseTarget;
