import * as fs from "fs";
import * as path from "path";
import { BuildResult } from "../types";

/**
 * Writes a build result to its output file. A result with errors is refused, as its output
 * path may be one the build must not write (see `outputPathProblem`). The file is opened
 * without following a symbolic link where the platform allows it (not on Windows).
 */
export function writeBuild(result: BuildResult): void {
  if (result.diagnostics.some((d) => d.severity === "error")) {
    throw new Error(`Not writing ${result.outputFile}: target '${result.target.name}' has errors`);
  }
  fs.mkdirSync(path.dirname(result.outputFile), { recursive: true });
  const { O_WRONLY, O_CREAT, O_TRUNC, O_NOFOLLOW = 0 } = fs.constants;
  const fd = fs.openSync(result.outputFile, O_WRONLY | O_CREAT | O_TRUNC | O_NOFOLLOW, 0o666);
  try {
    fs.writeFileSync(fd, result.content);
  } finally {
    fs.closeSync(fd);
  }
}

/** Whether the output file on disk is exactly what `result` would write. */
export type BuildStatus = "current" | "stale" | "missing";

/** Compares a build result with its output file, without writing anything. */
export function checkBuild(result: BuildResult): BuildStatus {
  if (!fs.existsSync(result.outputFile)) return "missing";
  return fs.readFileSync(result.outputFile, "utf8") === result.content ? "current" : "stale";
}
