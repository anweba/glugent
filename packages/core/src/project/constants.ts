export const CONFIG_FILE = "glugent.config.json";
export const DEFAULT_SECTION_INCLUDE = ["**/*.ggen.md"];
export const DEFAULT_TARGET_INCLUDE = ["**/*.{target,agent,doc}.ggen.json"];
/** @deprecated Use `DEFAULT_TARGET_INCLUDE`. */
export const DEFAULT_AGENT_INCLUDE = DEFAULT_TARGET_INCLUDE;
export const ALWAYS_IGNORE = ["**/node_modules/**", "**/.git/**"];
