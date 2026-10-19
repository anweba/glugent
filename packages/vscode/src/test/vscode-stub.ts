/**
 * A minimal in-memory stand-in for the `vscode` module, just enough for the
 * unit tests. `setup.ts` makes `require("vscode")` resolve to this file.
 */

export class Position {
  constructor(
    public line: number,
    public character: number,
  ) {}
}

export class Range {
  start: Position;
  end: Position;
  constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
    this.start = new Position(startLine, startChar);
    this.end = new Position(endLine, endChar);
  }
  contains(pos: Position): boolean {
    const after = (a: Position, b: Position) => a.line > b.line || (a.line === b.line && a.character >= b.character);
    return after(pos, this.start) && after(this.end, pos);
  }
}

export const Uri = {
  file: (fsPath: string) => ({ scheme: "file", fsPath }),
};

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
}

export class Diagnostic {
  source?: string;
  constructor(
    public range: Range,
    public message: string,
    public severity: DiagnosticSeverity,
  ) {}
}

export enum CompletionItemKind {
  Variable = 5,
  File = 16,
}

export class CompletionItem {
  detail?: string;
  documentation?: string;
  constructor(
    public label: string,
    public kind?: CompletionItemKind,
  ) {}
}

export class MarkdownString {
  value = "";
  appendMarkdown(text: string): this {
    this.value += text;
    return this;
  }
}

export class Hover {
  constructor(
    public contents: MarkdownString,
    public range?: Range,
  ) {}
}

export class Disposable {
  constructor(private readonly onDispose: () => void = () => {}) {}
  dispose(): void {
    this.onDispose();
  }
}

class FakeDiagnosticCollection extends Disposable {
  readonly entries = new Map<string, Diagnostic[]>();
  set(uri: { fsPath: string }, diagnostics: Diagnostic[]): void {
    this.entries.set(uri.fsPath, diagnostics);
  }
  delete(uri: { fsPath: string }): void {
    this.entries.delete(uri.fsPath);
  }
}

type Listener = (...args: any[]) => void;

/** Everything the code under test did to the fake VS Code, plus knobs to steer it. */
export const state = {
  collections: [] as FakeDiagnosticCollection[],
  providers: [] as { kind: "completion" | "hover"; selector: unknown; provider: any; triggers: string[] }[],
  commands: new Map<string, () => unknown>(),
  listeners: new Map<string, Listener>(),
  messages: [] as { level: "info" | "warning" | "error"; text: string }[],
  /** Config files returned by `workspace.findFiles`. */
  configFiles: [] as string[],
  /** What the next `showQuickPick` returns, given its items. */
  pick: (items: any[]): any => items[0],
};

export function reset(): void {
  state.collections = [];
  state.providers = [];
  state.commands.clear();
  state.listeners.clear();
  state.messages = [];
  state.configFiles = [];
  state.pick = (items) => items[0];
}

const listen = (name: string) => (listener: Listener) => {
  state.listeners.set(name, listener);
  return new Disposable();
};

export const languages = {
  createDiagnosticCollection: () => {
    const collection = new FakeDiagnosticCollection();
    state.collections.push(collection);
    return collection;
  },
  registerCompletionItemProvider: (selector: unknown, provider: any, ...triggers: string[]) => {
    state.providers.push({ kind: "completion", selector, provider, triggers });
    return new Disposable();
  },
  registerHoverProvider: (selector: unknown, provider: any) => {
    state.providers.push({ kind: "hover", selector, provider, triggers: [] });
    return new Disposable();
  },
};

export const workspace = {
  textDocuments: [] as any[],
  findFiles: async () => state.configFiles.map((f) => Uri.file(f)),
  onDidOpenTextDocument: listen("open"),
  onDidChangeTextDocument: listen("change"),
  onDidSaveTextDocument: listen("save"),
  onDidCreateFiles: listen("create"),
  onDidDeleteFiles: listen("delete"),
  onDidRenameFiles: listen("rename"),
};

const message = (level: "info" | "warning" | "error") => async (text: string) => {
  state.messages.push({ level, text });
};

export const window = {
  showInformationMessage: message("info"),
  showWarningMessage: message("warning"),
  showErrorMessage: message("error"),
  showQuickPick: async (items: any[]) => state.pick(items),
};

export const commands = {
  registerCommand: (id: string, handler: () => unknown) => {
    state.commands.set(id, handler);
    return new Disposable();
  },
};
