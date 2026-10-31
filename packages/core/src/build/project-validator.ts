import { Diagnostic, Project } from "../types";
import { compileTarget } from "./target-compiler";
import { BuildOptions } from "./options";

/** Project-wide validation: load problems plus a dry-run build of every target. */
export class ProjectValidator {
  private readonly found: Diagnostic[];

  constructor(
    private readonly project: Project,
    private readonly options: BuildOptions = {},
  ) {
    this.found = [...project.diagnostics];
  }

  validate(): Diagnostic[] {
    for (const target of this.project.targets) {
      compileTarget(this.project, target, this.options).diagnostics.forEach((d) => this.addOnce(d));
    }
    return this.found;
  }

  /** The same problem reported by several targets is listed once. */
  private addOnce(d: Diagnostic): void {
    const duplicate = this.found.some((f) => f.file === d.file && f.message === d.message && f.line === d.line);
    if (!duplicate) this.found.push(d);
  }
}

export function validateProject(project: Project, options: BuildOptions = {}): Diagnostic[] {
  return new ProjectValidator(project, options).validate();
}
