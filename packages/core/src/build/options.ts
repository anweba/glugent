import { Props } from "../types";
import { ReadFile } from "../project";

export interface BuildOptions {
  /** Highest precedence (CLI --set). */
  overrides?: Props;
  readFile?: ReadFile;
}
