import { diag, isProps } from "../diagnostics";
import { AgentDef, Diagnostic, SectionRef } from "../types";

const PROPS_HINT = "must be a map of string/number/boolean";

/** Parses a `*.agent.ggen.json` file into an AgentDef, reporting every problem found. */
export class AgentParser {
  private readonly diagnostics: Diagnostic[] = [];

  constructor(
    private readonly file: string,
    private readonly text: string,
  ) {}

  parse(): { agent?: AgentDef; diagnostics: Diagnostic[] } {
    const data = this.readJson();
    if (data === undefined) return { diagnostics: this.diagnostics };

    this.checkShape(data);
    if (this.diagnostics.length) return { diagnostics: this.diagnostics };

    const sections = (data.sections as unknown[]).flatMap((entry) => this.sectionRef(entry));
    const agent: AgentDef = {
      file: this.file,
      name: data.name,
      output: typeof data.output === "string" ? data.output : undefined,
      props: data.props,
      sections,
    };
    return { agent, diagnostics: this.diagnostics };
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
      this.fail("Agent definition must be a JSON object");
      return;
    }
    return data;
  }

  private checkShape(data: any): void {
    if (typeof data.name !== "string" || !data.name) this.fail("Agent needs a string 'name'");
    if (!Array.isArray(data.sections)) this.fail("Agent needs a 'sections' array");
    if (data.props !== undefined && !isProps(data.props)) this.fail(`'props' ${PROPS_HINT}`);
  }

  /** A section entry is `"name"` or `{ "use": "name", "props": {...} }`. */
  private sectionRef(entry: any): SectionRef[] {
    if (typeof entry === "string") return [{ use: entry }];
    if (entry && typeof entry.use === "string") {
      if (entry.props !== undefined && !isProps(entry.props)) this.fail(`'props' of section '${entry.use}' ${PROPS_HINT}`);
      return [{ use: entry.use, props: entry.props }];
    }
    this.fail('Each section must be a string or { "use": "..." }');
    return [];
  }

  private fail(message: string): void {
    this.diagnostics.push(diag(this.file, message));
  }
}

export function parseAgent(file: string, text: string): { agent?: AgentDef; diagnostics: Diagnostic[] } {
  return new AgentParser(file, text).parse();
}
