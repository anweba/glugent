import * as fs from "fs";
import * as path from "path";
import { BuildResult } from "../types";

export function writeBuild(result: BuildResult): void {
  fs.mkdirSync(path.dirname(result.outputFile), { recursive: true });
  fs.writeFileSync(result.outputFile, result.content);
}
