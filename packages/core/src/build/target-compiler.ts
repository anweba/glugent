import { SectionResolver, readFromDisk } from "../project";
import { renderTemplate } from "../template";
import { Target, BuildResult, Diagnostic, Project, Props, Section, SectionRef } from "../types";
import { TargetFile } from "./target-file";
import { BuildOptions } from "./options";
import { outputPathFor } from "./output-path";

/** Glues a target's sections together into one Markdown document. */
export class TargetCompiler {
  private readonly diagnostics: Diagnostic[] = [];
  private readonly resolver: SectionResolver;
  private readonly targetFile: TargetFile;

  constructor(
    private readonly project: Project,
    private readonly target: Target,
    private readonly options: BuildOptions = {},
  ) {
    this.resolver = new SectionResolver(project);
    this.targetFile = new TargetFile((options.readFile ?? readFromDisk)(target.file));
  }

  compile(): BuildResult {
    const parts = this.target.sections.flatMap((ref) => this.renderEntry(ref));
    return {
      target: this.target,
      outputFile: outputPathFor(this.project, this.target),
      content: parts.filter(Boolean).join("\n\n") + "\n",
      diagnostics: this.diagnostics,
    };
  }

  /** Renders one section entry of the target; unknown sections are reported and skipped. */
  private renderEntry(ref: SectionRef): string[] {
    const { section, error } = this.resolver.resolve(ref.use);
    if (!section) {
      this.report(error!, ref);
      return [];
    }
    const { text, missing } = renderTemplate(section.body, this.propsFor(section, ref), section.bodyLineOffset);
    for (const m of missing) {
      this.report(`Target '${this.target.name}': required prop '${m.name}' of section '${section.id}' has no value`, ref);
    }
    return [text.trim()];
  }

  /**
   * Prop precedence, lowest → highest:
   *   section defaults → target props → target section-entry props → config props → CLI overrides
   */
  private propsFor(section: Section, ref: SectionRef): Props {
    return {
      ...section.defaults,
      ...this.target.props,
      ...ref.props,
      ...this.project.config.props,
      ...this.options.overrides,
    };
  }

  private report(message: string, ref: SectionRef): void {
    this.diagnostics.push({ severity: "error", message, file: this.target.file, ...this.targetFile.locate(ref.use) });
  }
}

export function compileTarget(project: Project, target: Target, options: BuildOptions = {}): BuildResult {
  return new TargetCompiler(project, target, options).compile();
}

/** @deprecated Use `compileTarget`. */
export const compileAgent = compileTarget;
