export type PropValue = string | number | boolean;
export type Props = Record<string, PropValue>;

export interface Diagnostic {
  severity: "error" | "warning";
  message: string;
  /** Absolute file path. */
  file: string;
  /** 0-based. */
  line: number;
  column: number;
  length: number;
}

export interface Placeholder {
  name: string;
  optional: boolean;
  /** Inline default from {{NAME?"default"}}. */
  default?: string;
  /** True when this is a name used in an `{{ if ... }}` condition rather than a value. */
  condition?: boolean;
  /** 0-based position inside the scanned text (length counts the first line only). */
  line: number;
  column: number;
  length: number;
  /** End position; differs from `line` when the placeholder spans lines. */
  endLine?: number;
  endColumn?: number;
}

export interface GlugentConfig {
  sections?: { include?: string[]; exclude?: string[]; root?: string };
  agents?: { include?: string[]; exclude?: string[] };
  props?: Props;
  outDir?: string;
}

export interface Section {
  id: string;
  file: string;
  description?: string;
  defaults: Props;
  body: string;
  /** Number of lines before the body (frontmatter) in the file. */
  bodyLineOffset: number;
  placeholders: Placeholder[];
}

export interface SectionRef {
  use: string;
  props?: Props;
}

export interface AgentDef {
  file: string;
  name: string;
  output?: string;
  props?: Props;
  sections: SectionRef[];
}

export interface Project {
  root: string;
  configFile: string;
  config: GlugentConfig;
  sections: Section[];
  agents: AgentDef[];
  /** Problems found while loading (bad JSON, bad frontmatter, template syntax...). */
  diagnostics: Diagnostic[];
}

export interface BuildResult {
  agent: AgentDef;
  outputFile: string;
  content: string;
  diagnostics: Diagnostic[];
}
