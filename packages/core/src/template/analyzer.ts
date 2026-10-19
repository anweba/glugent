import { Placeholder } from "../types";
import { conditionRefs } from "./condition";
import { LineIndex } from "./line-index";
import { Piece } from "./pieces";
import { TemplateScanner } from "./scanner";

export interface TemplateError {
  message: string;
  line: number;
  column: number;
  /** Length on the first line of the error. */
  length: number;
}

/** Lists the placeholders and syntax errors of a template, with positions for editors. */
export class TemplateAnalyzer {
  private readonly index: LineIndex;
  private readonly placeholders: Placeholder[] = [];
  private readonly errors: TemplateError[] = [];

  constructor(
    private readonly body: string,
    private readonly lineOffset = 0,
  ) {
    this.index = new LineIndex(body);
  }

  analyze(): { placeholders: Placeholder[]; errors: TemplateError[] } {
    this.visit(new TemplateScanner(this.body).scan().pieces);
    return { placeholders: this.placeholders, errors: this.errors };
  }

  private visit(pieces: Piece[]): void {
    for (const piece of pieces) {
      if (piece.kind === "token") {
        const { name, optional, default: fallback } = piece;
        this.placeholders.push({ name, optional, default: fallback, ...this.locate(piece.start, piece.end) });
      } else if (piece.kind === "error") {
        const { endLine, endColumn, ...position } = this.locate(piece.start, piece.end);
        this.errors.push({ message: piece.message, ...position });
      } else if (piece.kind === "if") {
        for (const branch of piece.branches) {
          const refs = branch.condition ? conditionRefs(branch.condition) : [];
          for (const ref of refs) {
            this.placeholders.push({ name: ref.name, optional: true, condition: true, ...this.locate(ref.start, ref.end) });
          }
          this.visit(branch.children);
        }
      }
    }
  }

  private locate(start: number, end: number) {
    const from = this.index.position(start);
    const to = this.index.position(end);
    const firstLineEnd = from.line === to.line ? end : this.index.lineStart(from.line + 1) - 1;
    return {
      line: from.line + this.lineOffset, column: from.column, length: firstLineEnd - start,
      endLine: to.line + this.lineOffset, endColumn: to.column,
    };
  }
}
