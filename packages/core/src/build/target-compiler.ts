import { SectionResolver, readFromDisk } from "../project";
import { renderTemplate, scanTemplate, TemplatePosition, TemplateRef } from "../template";
import { Target, BuildResult, Diagnostic, Project, Props, Section, SectionRef } from "../types";
import { TargetFile } from "./target-file";
import { BuildOptions } from "./options";
import { outputPathFor } from "./output-path";

/** Reports a problem where the including side wrote it: at a REF (or one of its fills) in a section, or at a target entry. */
type Report = (message: string, at?: TemplatePosition) => void;

/** Slot contents by name, rendered only when the slot is. */
type Slots = Record<string, () => string>;

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
    const props = this.propsFor(section, ref.props);
    const here: Report = (message) => this.report(message, ref);
    return [this.renderSection(section, props, ref, [], this.entrySlots(section, ref, props), here)];
  }

  /**
   * Renders a section body; each `{ REF id }` in it renders that section in turn.
   * `chain` holds the sections whose REFs led here, outermost first; `here` is
   * where an unfilled required slot is reported.
   */
  private renderSection(section: Section, props: Props, entry: SectionRef, chain: Section[], slots: Slots, here: Report): string {
    const path = [...chain, section];
    const { text, missing, missingSlots } = renderTemplate(section.body, props, {
      lineOffset: section.bodyLineOffset,
      renderRef: (ref) => this.renderRef(ref, path, props, entry, (message, at = ref) => this.reportAt(message, section, at)),
      slots,
    });
    const via = chain.length ? ` (via ${chain.map((s) => `'${s.id}'`).join(" → ")})` : "";
    for (const m of missing) {
      this.report(`Target '${this.target.name}': required prop '${m.name}' of section '${section.id}'${via} has no value`, entry);
    }
    for (const slot of missingSlots) here(`Required slot '${slot.name}' of section '${section.id}' is not filled`);
    return text.trim();
  }

  /**
   * `{ REF id }` renders the section as if the target listed it: with its own prop layers,
   * not the including section's. `{ REF-OVERRIDE id }` lays the including section's props
   * on top, so they win wherever both set a prop. Props passed with `{ REF id | NAME="..." }`
   * act as that include's entry props: above all of those, below config and CLI props.
   *
   * Slot content belongs to the including section and renders with its props;
   * `SLOT-INHERIT` content renders with the filled section's props first, falling back
   * to the including section's.
   */
  private renderRef(ref: TemplateRef, path: Section[], parentProps: Props, entry: SectionRef, here: Report): string {
    const { section, error } = this.resolver.resolve(ref.id);
    if (!section) {
      here(error!);
      return "";
    }
    if (path.includes(section)) {
      const cycle = [...path.slice(path.indexOf(section)), section].map((s) => `'${s.id}'`).join(" → ");
      here(`Section '${section.id}' includes itself: ${cycle}`);
      return "";
    }
    const props = this.propsFor(section, ref.props, ref.override ? parentProps : undefined);
    const slots: Slots = {};
    for (const fill of ref.fills ?? []) {
      if (!this.hasSlot(section, fill.name, (message) => here(message, fill))) continue;
      slots[fill.name] = () => fill.render(fill.inherit ? { ...parentProps, ...props } : parentProps);
    }
    return this.renderSection(section, props, entry, path, slots, here);
  }

  /** The target entry's `slots`: template text rendered with the entry's props. */
  private entrySlots(section: Section, entry: SectionRef, props: Props): Slots {
    const slots: Slots = {};
    for (const [name, text] of Object.entries(entry.slots ?? {})) {
      const where = `slot '${name}' of section '${section.id}'`;
      const here: Report = (message) => this.report(`In ${where}: ${message}`, entry);
      if (!this.hasSlot(section, name, (message) => this.report(message, entry))) continue;
      const scanned = scanTemplate(text);
      for (const e of scanned.errors) here(e.message);
      if (scanned.slots.length) here("slots can only be defined in sections");
      slots[name] = () => {
        const rendered = renderTemplate(text, props, { renderRef: (ref) => this.renderRef(ref, [], props, entry, here) });
        for (const m of rendered.missing) here(`required prop '${m.name}' has no value`);
        return rendered.text.trim();
      };
    }
    return slots;
  }

  private hasSlot(section: Section, name: string, report: (message: string) => void): boolean {
    if (section.slots.some((s) => s.name === name)) return true;
    report(`Section '${section.id}' has no slot '${name}'`);
    return false;
  }

  /**
   * Prop precedence, lowest → highest:
   *   section defaults → target props → [inherited] → entry props → config props → CLI overrides
   * `entryProps` are a target entry's `props`, or the props a REF passes. `inherited` are the
   * including section's props, for `REF-OVERRIDE`.
   */
  private propsFor(section: Section, entryProps?: Props, inherited?: Props): Props {
    return {
      ...section.defaults,
      ...this.target.props,
      ...inherited,
      ...entryProps,
      ...this.project.config.props,
      ...this.options.overrides,
    };
  }

  private report(message: string, ref: SectionRef): void {
    this.diagnostics.push({ severity: "error", message, file: this.target.file, ...this.targetFile.locate(ref.use) });
  }

  /** Reports a problem at a position in a section file. */
  private reportAt(message: string, section: Section, at: TemplatePosition): void {
    const { line, column, length } = at;
    this.diagnostics.push({ severity: "error", message, file: section.file, line, column, length });
  }
}

export function compileTarget(project: Project, target: Target, options: BuildOptions = {}): BuildResult {
  return new TargetCompiler(project, target, options).compile();
}

/** @deprecated Use `compileTarget`. */
export const compileAgent = compileTarget;
