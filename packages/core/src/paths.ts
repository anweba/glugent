import * as path from "path";

/** Whether `file` is `root` or below it (both absolute, compared as written). */
export function isInside(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/** Whether `file` is in a `.git` folder below `root`; case-insensitive, as `.GIT` is the same folder on macOS and Windows. */
export function inGitFolder(root: string, file: string): boolean {
  return path
    .relative(root, file)
    .split(path.sep)
    .some((part) => part.toLowerCase() === ".git");
}
