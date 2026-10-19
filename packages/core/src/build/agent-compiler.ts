import { SectionResolver, readFromDisk } from "../project";
import { renderTemplate } from "../template";
import { AgentDef, BuildResult, Diagnostic, Project, Props, Section, SectionRef } from "../types";
import { AgentFile } from "./agent-file";
import { BuildOptions } from "./options";
import { outputPathFor } from "./output-path";

/** Glues an agent's sections together into one Markdown document. */
export class AgentCompiler {
  private readonly diagnostics: Diagnostic[] = [];
  private readonly resolver: SectionResolver;
  private readonly agentFile: AgentFile;

  constructor(
    private readonly project: Project,
    private readonly agent: AgentDef,
    private readonly options: BuildOptions = {},
  ) {
    this.resolver = new SectionResolver(project);
    this.agentFile = new AgentFile((options.readFile ?? readFromDisk)(agent.file));
  }

  compile(): BuildResult {
    const parts = this.agent.sections.flatMap((ref) => this.renderEntry(ref));
    return {
      agent: this.agent,
      outputFile: outputPathFor(this.project, this.agent),
      content: parts.filter(Boolean).join("\n\n") + "\n",
      diagnostics: this.diagnostics,
    };
  }

  /** Renders one section entry of the agent; unknown sections are reported and skipped. */
  private renderEntry(ref: SectionRef): string[] {
    const { section, error } = this.resolver.resolve(ref.use);
    if (!section) {
      this.report(error!, ref);
      return [];
    }
    const { text, missing } = renderTemplate(section.body, this.propsFor(section, ref), section.bodyLineOffset);
    for (const m of missing) {
      this.report(`Agent '${this.agent.name}': required prop '${m.name}' of section '${section.id}' has no value`, ref);
    }
    return [text.trim()];
  }

  /**
   * Prop precedence, lowest → highest:
   *   section defaults → agent props → agent section-entry props → config props → CLI overrides
   */
  private propsFor(section: Section, ref: SectionRef): Props {
    return {
      ...section.defaults,
      ...this.agent.props,
      ...ref.props,
      ...this.project.config.props,
      ...this.options.overrides,
    };
  }

  private report(message: string, ref: SectionRef): void {
    this.diagnostics.push({ severity: "error", message, file: this.agent.file, ...this.agentFile.locate(ref.use) });
  }
}

export function compileAgent(project: Project, agent: AgentDef, options: BuildOptions = {}): BuildResult {
  return new AgentCompiler(project, agent, options).compile();
}
