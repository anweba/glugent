import * as fs from "fs";
import * as path from "path";
import { CONFIG_FILE } from "./constants";

/** Walks up from `start` looking for glugent.config.json. */
export function findConfigUp(start: string): string | undefined {
  let dir = fs.existsSync(start) && fs.statSync(start).isDirectory() ? start : path.dirname(start);
  for (;;) {
    const candidate = path.join(dir, CONFIG_FILE);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}
