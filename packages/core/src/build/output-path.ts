import * as fs from "fs";
import * as path from "path";
import { inGitFolder, isInside } from "../paths";
import { Target, Project } from "../types";

/** Where a target's compiled Markdown is written. */
export function outputPathFor(project: Project, target: Target): string {
  if (target.output) return path.resolve(project.root, target.output);
  return path.resolve(project.root, project.config.outDir ?? "dist/agents", `${target.name}.md`);
}

/**
 * Why `file` may not be written, or undefined if it may. A build only writes inside the
 * project folder (the config file's folder), never into a `.git` folder, and never through
 * a symbolic link that leads elsewhere: a cloned project could otherwise overwrite any file
 * the user can write, such as ~/.bashrc or a git hook.
 */
export function outputPathProblem(root: string, file: string): string | undefined {
  if (!isInside(root, file)) return `is outside the project folder ${root}`;
  if (inGitFolder(root, file)) return "is inside a .git folder";

  const existing = nearestExisting(file);
  if (existing === file && fs.lstatSync(file).isSymbolicLink()) return "is a symbolic link";
  const realRoot = fs.realpathSync(root);
  const realExisting = fs.realpathSync(existing);
  if (!isInside(realRoot, realExisting)) return `leads outside the project folder ${root} through a symbolic link`;
  if (inGitFolder(realRoot, realExisting)) return "leads into a .git folder through a symbolic link";
  return undefined;
}

/** `file` itself if it exists (a dangling symbolic link counts), else its nearest existing ancestor. */
function nearestExisting(file: string): string {
  for (let current = file; ; current = path.dirname(current)) {
    try {
      fs.lstatSync(current);
      return current;
    } catch {
      if (path.dirname(current) === current) return current;
    }
  }
}
