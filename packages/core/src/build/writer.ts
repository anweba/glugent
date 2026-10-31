import * as fs from "fs";
import * as path from "path";
import { BuildResult } from "../types";

export function writeBuild(result: BuildResult): void {
  fs.mkdirSync(path.dirname(result.outputFile), { recursive: true });
  fs.writeFileSync(result.outputFile, result.content);
}

/** Whether the output file on disk is exactly what `result` would write. */
export type BuildStatus = "current" | "stale" | "missing";

/** Compares a build result with its output file, without writing anything. */
export function checkBuild(result: BuildResult): BuildStatus {
  if (!fs.existsSync(result.outputFile)) return "missing";
  return fs.readFileSync(result.outputFile, "utf8") === result.content ? "current" : "stale";
}
