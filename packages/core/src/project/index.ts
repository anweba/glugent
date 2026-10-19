import { Project } from "../types";
import { LoadOptions } from "./file-reader";
import { ProjectLoader } from "./project-loader";

export { CONFIG_FILE, DEFAULT_AGENT_INCLUDE, DEFAULT_SECTION_INCLUDE } from "./constants";
export { findConfigUp } from "./config-finder";
export { LoadOptions, ReadFile } from "./file-reader";
export { convertMarkdown } from "./convert";
export { parseSection } from "./section-parser";
export { resolveSection, SectionResolver } from "./section-resolver";
export { readFromDisk } from "./file-reader";

export function loadProject(configFile: string, options: LoadOptions = {}): Project {
  return new ProjectLoader(configFile, options).load();
}
