import { Project, Section } from "../types";

/** Finds the section an agent refers to. */
export class SectionResolver {
  constructor(private readonly project: Project) {}

  /** Exact id match first, otherwise a unique path-suffix match ("identity" → "base/identity"). */
  resolve(ref: string): { section?: Section; error?: string } {
    const wanted = ref.replace(/\.ggen\.md$/, "").replace(/^\.?\//, "");
    const sections = this.project.sections;

    const exact = sections.find((s) => s.id === wanted);
    if (exact) return { section: exact };

    const suffixMatches = sections.filter((s) => s.id.endsWith("/" + wanted));
    if (suffixMatches.length === 1) return { section: suffixMatches[0] };
    if (suffixMatches.length > 1) {
      return { error: `Section '${ref}' is ambiguous: ${suffixMatches.map((s) => s.id).join(", ")}` };
    }
    return { error: `Unknown section '${ref}'` };
  }
}

export function resolveSection(project: Project, ref: string): { section?: Section; error?: string } {
  return new SectionResolver(project).resolve(ref);
}
