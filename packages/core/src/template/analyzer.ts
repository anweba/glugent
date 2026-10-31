import { Placeholder, SlotDef } from "../types";
import { conditionRefs } from "./condition";
import { LineIndex } from "./line-index";
import { Piece, RefProp, SlotPiece } from "./pieces";
import { TemplateScanner } from "./scanner";

export interface TemplateError {
  message: string;
  line: number;
  column: number;
  /** Length on the first line of the error. */
  length: number;
}

/** Lists the placeholders, slots and syntax errors of a template, with positions for editors. */
export class TemplateAnalyzer {
  private readonly index: LineIndex;
  private readonly placeholders: Placeholder[] = [];
  private readonly slots: SlotDef[] = [];
  private readonly errors: TemplateError[] = [];

  constructor(
    private readonly body: string,
    private readonly lineOffset = 0,
  ) {
    this.index = new LineIndex(body);
  }

  analyze(): { placeholders: Placeholder[]; slots: SlotDef[]; errors: TemplateError[] } {
    this.visit(new TemplateScanner(this.body).scan().pieces);
    return { placeholders: this.placeholders, slots: this.slots, errors: this.errors };
  }

  private visit(pieces: Piece[]): void {
    for (const piece of pieces) {
      if (piece.kind === "token") {
        const { name, optional, default: fallback } = piece;
        this.placeholders.push({ name, optional, default: fallback, ...this.locate(piece.start, piece.end) });
      } else if (piece.kind === "error") {
        this.error(piece.message, piece.start, piece.end);
      } else if (piece.kind === "if") {
        for (const branch of piece.branches) {
          const refs = branch.condition ? conditionRefs(branch.condition) : [];
          for (const ref of refs) {
            this.placeholders.push({ name: ref.name, optional: true, condition: true, ...this.locate(ref.start, ref.end) });
          }
          this.visit(branch.children);
        }
      } else if (piece.kind === "ref") {
        for (const prop of piece.props ?? []) this.refProp(prop);
        for (const fill of piece.fills ?? []) this.visit(fill.children);
      } else if (piece.kind === "slot") {
        this.slot(piece);
      }
    }
  }

  /**
   * A quoted prop value passed to a REF is a template of its own, using this section's
   * props. Its placeholders and errors are reported at the `NAME="..."`.
   */
  private refProp(prop: RefProp): void {
    if (prop.template === undefined) return;
    const inner = new TemplateAnalyzer(prop.template).analyze();
    const at = this.locate(prop.start, prop.end);
    for (const p of inner.placeholders) this.placeholders.push({ ...p, ...at });
    for (const e of inner.errors) this.error(`In prop '${prop.name}': ${e.message}`, prop.start, prop.end);
    if (inner.slots.length) this.error(`In prop '${prop.name}': slots can only be defined in a section`, prop.start, prop.end);
  }

  /** Slot names are unique within a section, even across `if` branches. */
  private slot(piece: SlotPiece): void {
    if (this.slots.some((s) => s.name === piece.name)) {
      return this.error(`Slot '${piece.name}' is defined twice`, piece.start, piece.end);
    }
    const { line, column, length } = this.locate(piece.start, piece.end);
    this.slots.push({ name: piece.name, optional: piece.optional, line, column, length });
  }

  private error(message: string, start: number, end: number): void {
    const { endLine, endColumn, ...position } = this.locate(start, end);
    this.errors.push({ message, ...position });
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
