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

  /**
   * Every value shown comes from the project's files, which may be untrusted, so each one is
   * inline code it cannot break out of, and the Markdown runs no command links or HTML.
   */
  private describe(p: Placeholder, project: Project, section: Section | undefined): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = false;
    md.supportHtml = false;
    const line = (text: string) => md.appendMarkdown(`${text}\n\n`);
    const configProps = project.config.props ?? {};

    line(`**${p.name}** — ${p.optional ? "optional" : "required"} prop`); // a name is [A-Za-z_][\w.]*: nothing to escape
    if (p.condition) line("Used in an `if` condition: holds when it has a non-empty value");
    if (p.default !== undefined) line(`When missing: ${code(p.default)}`);
    if (section && Object.hasOwn(section.defaults, p.name)) line(`Section default: ${code(section.defaults[p.name])}`);
    if (Object.hasOwn(configProps, p.name)) line(`Config value: ${code(configProps[p.name])}`);

    const targets = project.targets.filter((t) => t.props && Object.hasOwn(t.props, p.name));
    if (targets.length) md.appendMarkdown(`Set by targets: ${targets.map((a) => code(a.name)).join(", ")}`);
    return md;
  }
}

/**
 * `value` as Markdown inline code: fenced with more backticks than it contains, padded so a
 * backtick at either end is kept, on one line. Nothing inside inline code is Markdown.
 */
export function code(value: string | number | boolean): string {
  const text = String(value).replace(/\r?\n/g, " ");
  if (!text) return "*(empty)*";
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longestRun + 1);
  const pad = text.startsWith("`") || text.endsWith("`") || (text.startsWith(" ") && text.endsWith(" ") && text.trim()) ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}
