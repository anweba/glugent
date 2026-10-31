import * as path from "path";
import fg from "fast-glob";
import { diag } from "../diagnostics";
import { Target, Diagnostic, GlugentConfig, Project, Section } from "../types";
import { TargetParser } from "./target-parser";
import { ALWAYS_IGNORE, DEFAULT_TARGET_INCLUDE, DEFAULT_SECTION_INCLUDE } from "./constants";
import { LoadOptions, ReadFile, readFromDisk } from "./file-reader";
import { SectionParser } from "./section-parser";

/** Reads glugent.config.json and every section and target file it points at. */
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
    const targets = this.loadTargets();
    this.reportDuplicateTargets(targets);
    return {
      root: this.root,
      configFile: this.configFile,
      config: this.config,
      sections,
      targets,
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

  private loadTargets(): Target[] {
    const { targets, agents } = this.config;
    const include = [...(targets?.include ?? []), ...(agents?.include ?? [])];
    const exclude = [...(targets?.exclude ?? []), ...(agents?.exclude ?? [])];
    const found: Target[] = [];
    for (const file of this.glob(include.length ? include : DEFAULT_TARGET_INCLUDE, exclude)) {
      const parsed = new TargetParser(file, this.read(file)).parse();
      this.diagnostics.push(...parsed.diagnostics);
      if (parsed.target) found.push(parsed.target);
    }
    return found;
  }

  private reportDuplicateTargets(targets: Target[]): void {
    const fileByName = new Map<string, string>();
    for (const target of targets) {
      if (fileByName.has(target.name)) {
        this.diagnostics.push(diag(target.file, `Duplicate target name '${target.name}' (also ${fileByName.get(target.name)})`));
      } else {
        fileByName.set(target.name, target.file);
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
