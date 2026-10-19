import * as path from "path";
import fg from "fast-glob";
import { diag } from "../diagnostics";
import { AgentDef, Diagnostic, GlugentConfig, Project, Section } from "../types";
import { AgentParser } from "./agent-parser";
import { ALWAYS_IGNORE, DEFAULT_AGENT_INCLUDE, DEFAULT_SECTION_INCLUDE } from "./constants";
import { LoadOptions, ReadFile, readFromDisk } from "./file-reader";
import { SectionParser } from "./section-parser";

/** Reads glugent.config.json and every section and agent file it points at. */
export class ProjectLoader {
  private readonly configFile: string;
  private readonly root: string;
  private readonly read: ReadFile;
  private readonly diagnostics: Diagnostic[] = [];
  private config: GlugentConfig = {};

  constructor(configFile: string, options: LoadOptions = {}) {
    this.configFile = path.resolve(configFile);
    this.root = path.dirname(this.configFile);
    this.read = options.readFile ?? readFromDisk;
  }

  load(): Project {
    this.readConfig();
    const sections = this.loadSections();
    const agents = this.loadAgents();
    this.reportDuplicateAgents(agents);
    return {
      root: this.root,
      configFile: this.configFile,
      config: this.config,
      sections,
      agents,
      diagnostics: this.diagnostics,
    };
  }

  private readConfig(): void {
    try {
      this.config = JSON.parse(this.read(this.configFile));
    } catch (e) {
      this.diagnostics.push(diag(this.configFile, `Cannot read config: ${(e as Error).message}`));
    }
  }

  private loadSections(): Section[] {
    const sectionRoot = path.resolve(this.root, this.config.sections?.root ?? ".");
    const files = this.glob(this.config.sections?.include ?? DEFAULT_SECTION_INCLUDE, this.config.sections?.exclude);

    const sections: Section[] = [];
    const fileById = new Map<string, string>();
    for (const file of files) {
      const id = SectionIds.fromPath(path.relative(sectionRoot, file));
      if (fileById.has(id)) {
        this.diagnostics.push(diag(file, `Duplicate section id '${id}' (also ${fileById.get(id)})`));
        continue;
      }
      fileById.set(id, file);
      const parsed = new SectionParser(file, this.read(file), id).parse();
      sections.push(parsed.section);
      this.diagnostics.push(...parsed.diagnostics);
    }
    return sections;
  }

  private loadAgents(): AgentDef[] {
    const agents: AgentDef[] = [];
    for (const file of this.glob(this.config.agents?.include ?? DEFAULT_AGENT_INCLUDE, this.config.agents?.exclude)) {
      const parsed = new AgentParser(file, this.read(file)).parse();
      this.diagnostics.push(...parsed.diagnostics);
      if (parsed.agent) agents.push(parsed.agent);
    }
    return agents;
  }

  private reportDuplicateAgents(agents: AgentDef[]): void {
    const fileByName = new Map<string, string>();
    for (const agent of agents) {
      if (fileByName.has(agent.name)) {
        this.diagnostics.push(diag(agent.file, `Duplicate agent name '${agent.name}' (also ${fileByName.get(agent.name)})`));
      } else {
        fileByName.set(agent.name, agent.file);
      }
    }
  }

  private glob(include: string[], exclude: string[] = []): string[] {
    return fg.sync(include, { cwd: this.root, absolute: true, ignore: [...ALWAYS_IGNORE, ...exclude], dot: false }).sort();
  }
}

/** Section ids are paths relative to the section root, without the extension. */
class SectionIds {
  static fromPath(relativePath: string): string {
    return relativePath.split(path.sep).join("/").replace(/\.ggen\.md$/, "").replace(/\.md$/, "");
  }
}
