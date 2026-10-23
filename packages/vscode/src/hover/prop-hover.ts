import * as vscode from "vscode";
import { Placeholder, Project, scanTemplate, Section } from "@anweba/glugent-core";
import { SECTION_LANG } from "../constants";
import { Feature } from "../feature";
import { ProjectStore } from "../project-store";

/** Explains a prop on hover: where its value can come from. */
export class PropHover implements Feature, vscode.HoverProvider {
  constructor(private readonly store: ProjectStore) {}

  register(): vscode.Disposable[] {
    return [vscode.languages.registerHoverProvider({ language: SECTION_LANG }, this)];
  }

  provideHover(doc: vscode.TextDocument, pos: vscode.Position): vscode.Hover | undefined {
    const project = this.store.forDocument(doc);
    if (!project) return;
    const placeholder = this.placeholderAt(doc, pos);
    if (!placeholder) return;
    const section = project.sections.find((s) => s.file === doc.uri.fsPath);
    return new vscode.Hover(this.describe(placeholder, project, section), this.rangeOf(placeholder));
  }

  private placeholderAt(doc: vscode.TextDocument, pos: vscode.Position): Placeholder | undefined {
    return scanTemplate(doc.getText()).placeholders.find((p) => this.rangeOf(p).contains(pos));
  }

  private rangeOf(p: Placeholder): vscode.Range {
    return new vscode.Range(p.line, p.column, p.endLine ?? p.line, p.endColumn ?? p.column + p.length);
  }

  private describe(p: Placeholder, project: Project, section: Section | undefined): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    const line = (text: string) => md.appendMarkdown(`${text}\n\n`);
    const configProps = project.config.props ?? {};

    line(`**${p.name}** — ${p.optional ? "optional" : "required"} prop`);
    if (p.condition) line("Used in an `if` condition: holds when it has a non-empty value");
    if (p.default !== undefined) line(`When missing: \`${p.default}\``);
    if (section && p.name in section.defaults) line(`Section default: \`${section.defaults[p.name]}\``);
    if (p.name in configProps) line(`Config value: \`${configProps[p.name]}\``);

    const agents = project.agents.filter((a) => a.props && p.name in a.props);
    if (agents.length) md.appendMarkdown(`Set by agents: ${agents.map((a) => `\`${a.name}\``).join(", ")}`);
    return md;
  }
}
