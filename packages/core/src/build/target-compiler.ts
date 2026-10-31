import { SectionResolver, readFromDisk } from "../project";
import { renderTemplate, TemplateRef } from "../template";
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
    return [this.renderSection(section, this.propsFor(section, ref), ref, [])];
  }

  /**
   * Renders a section body; each `{ REF id }` in it renders that section in turn.
   * `chain` holds the sections whose REFs led here, outermost first.
   */
  private renderSection(section: Section, props: Props, entry: SectionRef, chain: Section[]): string {
    const path = [...chain, section];
    const { text, missing } = renderTemplate(section.body, props, section.bodyLineOffset, (ref) =>
      this.renderRef(ref, path, props, entry),
    );
    const via = chain.length ? ` (via ${chain.map((s) => `'${s.id}'`).join(" → ")})` : "";
    for (const m of missing) {
      this.report(`Target '${this.target.name}': required prop '${m.name}' of section '${section.id}'${via} has no value`, entry);
    }
    return text.trim();
  }

  /**
   * `{ REF id }` renders the section as if the target listed it: with its own prop layers,
   * not the including section's. `{ REF-OVERRIDE id }` lays the including section's props
   * on top, so they win wherever both set a prop.
   */
  private renderRef(ref: TemplateRef, path: Section[], parentProps: Props, entry: SectionRef): string {
    const parent = path[path.length - 1];
    const { section, error } = this.resolver.resolve(ref.id);
    if (!section) {
      this.reportAt(error!, parent, ref);
      return "";
    }
    if (path.includes(section)) {
      const cycle = [...path.slice(path.indexOf(section)), section].map((s) => `'${s.id}'`).join(" → ");
      this.reportAt(`Section '${section.id}' includes itself: ${cycle}`, parent, ref);
      return "";
    }
    const own = this.propsFor(section);
    return this.renderSection(section, ref.override ? { ...own, ...parentProps } : own, entry, path);
  }

  /**
   * Prop precedence, lowest → highest:
   *   section defaults → target props → target section-entry props → config props → CLI overrides
   * A section reached through `{ REF id }` has no entry, so no entry props.
   */
  private propsFor(section: Section, ref?: SectionRef): Props {
    return {
      ...section.defaults,
      ...this.target.props,
      ...ref?.props,
      ...this.project.config.props,
      ...this.options.overrides,
    };
  }

  private report(message: string, ref: SectionRef): void {
    this.diagnostics.push({ severity: "error", message, file: this.target.file, ...this.targetFile.locate(ref.use) });
  }

  /** Reports a problem with a `{ REF id }` at its position in the section file. */
  private reportAt(message: string, section: Section, ref: TemplateRef): void {
    const { line, column, length } = ref;
    this.diagnostics.push({ severity: "error", message, file: section.file, line, column, length });
  }
}

export function compileTarget(project: Project, target: Target, options: BuildOptions = {}): BuildResult {
  return new TargetCompiler(project, target, options).compile();
}

/** @deprecated Use `compileTarget`. */
export const compileAgent = compileTarget;
