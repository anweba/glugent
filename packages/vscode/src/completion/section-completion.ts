import * as vscode from "vscode";
import { Section } from "@anweba/glugent-core";
import { Feature } from "../feature";
import { ProjectStore } from "../project-store";

/** Inside a `sections` list of a target file: suggests the project's section ids. */
const SECTION_POSITION = /(?:"use"\s*:\s*"|^\s*"|[\[,]\s*")[^"]*$/;

export class SectionCompletion implements Feature, vscode.CompletionItemProvider {
  constructor(private readonly store: ProjectStore) {}

  register(): vscode.Disposable[] {
    return [vscode.languages.registerCompletionItemProvider({ pattern: "**/*.{target,agent,doc}.ggen.json" }, this, '"')];
  }

  provideCompletionItems(doc: vscode.TextDocument, pos: vscode.Position): vscode.CompletionItem[] | undefined {
    const prefix = doc.lineAt(pos).text.slice(0, pos.character);
    if (!SECTION_POSITION.test(prefix)) return;
    return this.store.forDocument(doc)?.sections.map((section) => this.toItem(section));
  }

  private toItem(section: Section): vscode.CompletionItem {
    const item = new vscode.CompletionItem(section.id, vscode.CompletionItemKind.File);
    item.detail = section.description;
    item.documentation = section.placeholders.length ? `Props: ${this.propNames(section).join(", ")}` : undefined;
    return item;
  }

  private propNames(section: Section): string[] {
    return [...new Set(section.placeholders.map((p) => (p.optional ? `${p.name}?` : p.name)))];
  }
}
