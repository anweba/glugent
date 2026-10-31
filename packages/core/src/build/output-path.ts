import * as path from "path";
import { Target, Project } from "../types";

/** Where a target's compiled Markdown is written. */
export function outputPathFor(project: Project, target: Target): string {
  if (target.output) return path.resolve(project.root, target.output);
  return path.resolve(project.root, project.config.outDir ?? "dist/agents", `${target.name}.md`);
}
