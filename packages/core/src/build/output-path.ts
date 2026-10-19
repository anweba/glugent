import * as path from "path";
import { AgentDef, Project } from "../types";

/** Where an agent's compiled Markdown is written. */
export function outputPathFor(project: Project, agent: AgentDef): string {
  if (agent.output) return path.resolve(project.root, agent.output);
  return path.resolve(project.root, project.config.outDir ?? "dist/agents", `${agent.name}.md`);
}
