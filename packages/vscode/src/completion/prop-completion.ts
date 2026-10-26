import * as vscode from "vscode";
import { Project } from "@anweba/glugent-core";
import { SECTION_LANG } from "../constants";
import { Feature } from "../feature";
import { ProjectStore } from "../project-store";

/** What we know about a prop name across the project. */
interface PropUsage {
  optional: boolean;
  sections: Set<string>;
}

/** Suggests prop names after a `{` in a section. */
export class PropCompletion implements Feature, vscode.CompletionItemProvider {
  constructor(private readonly store: ProjectStore) {}

  register(): vscode.Disposable[] {
    return [vscode.languages.registerCompletionItemProvider({ language: SECTION_LANG }, this, "{")];
  }

  provideCompletionItems(doc: vscode.TextDocument, pos: vscode.Position): vscode.CompletionItem[] | undefined {
    const prefix = doc.lineAt(pos).text.slice(0, pos.character);
    if (!/\{\s*[\w.]*$/.test(prefix)) return;
    const project = this.store.forDocument(doc);
    if (!project) return;
    return [...this.collectUsage(project)].map(([name, usage]) => this.toItem(name, usage));
  }

  private collectUsage(project: Project): Map<string, PropUsage> {
    const usages = new Map<string, PropUsage>();
    const note = (name: string, optional: boolean, source: string) => {
      const usage = usages.get(name) ?? { optional, sections: new Set<string>() };
      usage.optional = usage.optional && optional;
      usage.sections.add(source);
      usages.set(name, usage);
    };
    for (const section of project.sections) {
      for (const p of section.placeholders) {
        note(p.name, p.optional || p.name in section.defaults || p.default !== undefined, section.id);
      }
    }
    for (const name of Object.keys(project.config.props ?? {})) note(name, true, "glugent.config.json");
    return usages;
  }

  private toItem(name: string, usage: PropUsage): vscode.CompletionItem {
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
    item.detail = usage.optional ? "optional prop" : "required prop";
    item.documentation = `Used in: ${[...usage.sections].join(", ")}`;
    return item;
  }
}
