import { Placeholder, Props, SlotDef } from "../types";
import { conditionHolds } from "./condition";
import { LineIndex } from "./line-index";
import { Fill, IfPiece, Piece, RefPiece, RefProp, SlotPiece } from "./pieces";
import { TemplateScanner } from "./scanner";

/** A position for diagnostics: 0-based, shifted by the renderer's `lineOffset`; `length` counts the first line only. */
export interface TemplatePosition {
  line: number;
  column: number;
  length: number;
}

/** A `{ REF id }` or `{ REF BEGIN id } ... { REF END id }` met while rendering. */
export interface TemplateRef extends TemplatePosition {
  id: string;
  override: boolean;
  /** `{ REF id | NAME="value" }`: the props passed, quoted values already rendered with this template's props. */
  props?: Props;
  /** What the block form puts into the section's slots; absent for `{ REF id }`. */
  fills?: TemplateFill[];
}

/** The content for one slot, rendered by the including template with whatever props the caller picks. */
export interface TemplateFill extends TemplatePosition {
  name: string;
  /** `SLOT-INHERIT`: the caller should let the filled section's props win. */
  inherit: boolean;
  render(values: Props): string;
}

/** Renders a referenced section. The template layer knows no sections, so the caller supplies this. */
export type RefRenderer = (ref: TemplateRef) => string;

export interface RenderOptions {
  /** Shifts reported lines (the frontmatter before the body). */
  lineOffset?: number;
  /** Renders `{ REF id }`; without it a REF is left as written. */
  renderRef?: RefRenderer;
  /** Content for this template's slots by name, rendered only when the slot is. */
  slots?: Record<string, () => string>;
}

/** A slot definition left empty, though filling it is required. */
export type MissingSlot = Omit<SlotDef, "optional">;

/** A prop holds in an `if` condition when it has a non-empty value (not `false`). */
const isSet = (value: Props[string] | undefined) => value !== undefined && value !== false && String(value) !== "";

/** Trim markers of a placeholder (`{-NAME-}`). */
interface Trim {
  trimLeft?: boolean;
  trimRight?: boolean;
}

/** Where each branch's content lies when the block's tags sit on lines of their own. */
interface WholeLines {
  ranges: { lo: number; hi: number }[];
  /** Offset just past the block's last line. */
  skip: number;
}

/** The text rendered so far for one stretch of the template, with line-level edits. */
class Output {
  private text = "";
  private skipUntil = 0;

  constructor(private readonly source: string) {}

  /** Copies source text in `[from, to)`, minus anything already skipped. */
  copy(from: number, to: number): void {
    const start = Math.max(from, this.skipUntil);
    if (to > start) this.text += this.source.slice(start, to);
  }

  append(text: string): void {
    this.text += text;
  }

  /** Removes the indentation already written on the current line. */
  dropIndent(): void {
    this.text = this.text.replace(/[ \t]*$/, "");
  }

  /** Removes whitespace already written at the end; newlines too unless `inline`. */
  trimEnd(inline: boolean): void {
    this.text = this.text.replace(inline ? /[ \t]*$/ : /\s*$/, "");
  }

  /** Ignores source text before `offset` (used to swallow a newline). */
  skipTo(offset: number): void {
    this.skipUntil = offset;
  }

  toString(): string {
    return this.text;
  }
}

/**
 * Renders a template. A placeholder's inline default is the lowest-priority
 * value. A placeholder or inline `if` block that renders to "" and is the only
 * content of its line removes the whole line. A block whose tags (`{ if ... {`,
 * `} else {`, `} }`) each sit alone on their lines is rendered as whole lines
 * (the tag lines never appear in the output). Only rendered branches report
 * missing props. A `{ REF id }` and a slot `{ # }` are replaced by what
 * `renderRef` / `slots` give, and like a placeholder they remove their line
 * when that is empty; without `renderRef` a REF is left as written.
 */
export class TemplateRenderer {
  private readonly index: LineIndex;
  private readonly pieces: Piece[];
  private readonly missing: Placeholder[];
  private readonly missingSlots: MissingSlot[];

  /** `shared`: the renderer this one forks, to render part of the same template with other values. */
  constructor(
    private readonly body: string,
    private readonly values: Props,
    private readonly options: RenderOptions = {},
    shared?: TemplateRenderer,
  ) {
    this.index = shared?.index ?? new LineIndex(body);
    this.pieces = shared?.pieces ?? new TemplateScanner(body).scan().pieces;
    this.missing = shared?.missing ?? [];
    this.missingSlots = shared?.missingSlots ?? [];
  }

  render(): { text: string; missing: Placeholder[]; missingSlots: MissingSlot[] } {
    const text = this.renderRange(this.pieces, 0, this.body.length);
    return { text, missing: this.missing, missingSlots: this.missingSlots };
  }

  private get lineOffset(): number {
    return this.options.lineOffset ?? 0;
  }

  /** Renders `pieces`, clipping text to the source range `[lo, hi)`. */
  private renderRange(pieces: Piece[], lo: number, hi: number): string {
    const out = new Output(this.body);
    for (const piece of pieces) {
      switch (piece.kind) {
        case "text":
          out.copy(Math.max(piece.start, lo), Math.min(piece.end, hi));
          break;
        case "error":
          out.append(this.body.slice(piece.start, piece.end));
          break;
        case "literal":
          out.append(piece.value);
          break;
        case "raw":
          out.append(this.body.slice(piece.start + 2, piece.end - 2));
          break;
        case "token":
          this.renderToken(out, piece);
          break;
        case "if":
          this.renderIf(out, piece);
          break;
        case "ref":
          this.renderRefPiece(out, piece);
          break;
        case "slot":
          this.renderSlot(out, piece);
          break;
      }
    }
    return out.toString();
  }

  // --- placeholders ------------------------------------------------------

  private renderToken(out: Output, token: Extract<Piece, { kind: "token" }>): void {
    const given = this.lookup(token.name);
    let text: string;
    if (given !== undefined) text = String(given);
    else if (token.default !== undefined) text = token.default;
    else if (token.optional) text = "";
    else return void this.reportMissing(token);
    this.emit(out, token, text, token);
  }

  private reportMissing(token: { name: string; start: number; end: number }): void {
    const at = this.index.position(token.start);
    const end = this.index.position(token.end);
    this.missing.push({
      name: token.name, optional: false, line: at.line + this.lineOffset, column: at.column,
      length: token.end - token.start, endLine: end.line + this.lineOffset, endColumn: end.column,
    });
  }

  // --- section references ------------------------------------------------

  private renderRefPiece(out: Output, piece: RefPiece): void {
    const { renderRef } = this.options;
    if (!renderRef) return out.append(this.body.slice(piece.start, piece.end));
    const fills = piece.fills?.map((fill): TemplateFill => ({
      name: fill.name, inherit: fill.inherit, ...this.position(fill.start, fill.end),
      render: (values) => this.renderFill(fill, values),
    }));
    const props = piece.props && this.refProps(piece.props);
    this.emit(out, piece, renderRef({ id: piece.id, override: piece.override, props, fills, ...this.position(piece.start, piece.end) }));
  }

  /**
   * The props a REF passes. A quoted value is a template of its own, rendered with this
   * template's props; a required prop it is missing is reported here, at the `NAME="..."`.
   */
  private refProps(props: RefProp[]): Props {
    const passed: Props = {};
    for (const prop of props) {
      if (prop.template === undefined) {
        passed[prop.name] = prop.value!;
        continue;
      }
      const value = new TemplateRenderer(prop.template, this.values, { renderRef: this.options.renderRef }).render();
      for (const m of value.missing) this.reportMissing({ name: m.name, start: prop.start, end: prop.end });
      passed[prop.name] = value.text;
    }
    return passed;
  }

  /**
   * A fill's content with `values`, still part of this template: its missing props and
   * slots are reported here. The line breaks right after the opening tag and before
   * the closing one are not content.
   */
  private renderFill(fill: Fill, values: Props): string {
    const text = new TemplateRenderer(this.body, values, this.options, this).renderRange(fill.children, fill.contentStart, fill.contentEnd);
    return text.replace(/^[ \t]*\n/, "").replace(/\s+$/, "");
  }

  private renderSlot(out: Output, slot: SlotPiece): void {
    const content = this.options.slots?.[slot.name];
    if (!content && !slot.optional) this.missingSlots.push({ name: slot.name, ...this.position(slot.start, slot.end) });
    this.emit(out, slot, content ? content() : "", slot);
  }

  // --- if blocks ---------------------------------------------------------

  private renderIf(out: Output, block: IfPiece): void {
    const lines = this.wholeLines(block);
    const text = this.renderChosenBranch(block, lines);
    if (!lines) return this.emit(out, block, text, block);
    out.dropIndent();
    out.append(text);
    let skip = lines.skip;
    if (text === "") {
      if (block.trimLeft) out.trimEnd(false);
      if (block.trimRight) skip = this.skipWhitespace(skip, false);
    }
    out.skipTo(skip);
  }

  private renderChosenBranch(block: IfPiece, lines: WholeLines | undefined): string {
    const chosen = block.branches.findIndex((b) => !b.condition || conditionHolds(b.condition, (n) => isSet(this.lookup(n))));
    if (chosen === -1) return "";
    const branch = block.branches[chosen];
    const range = lines ? lines.ranges[chosen] : { lo: branch.tagEnd, hi: branch.closeStart };
    return this.renderRange(branch.children, range.lo, range.hi);
  }

  /** Content ranges per branch when every tag of the block sits alone on its line. */
  private wholeLines(block: IfPiece): WholeLines | undefined {
    const last = block.branches[block.branches.length - 1];
    const closeNewline = this.body.indexOf("\n", block.end);
    const afterClose = closeNewline === -1 ? this.body.length : closeNewline;
    const closeLine = this.index.lineStartOf(last.closeStart);
    if (!this.index.isBlank(block.end, afterClose) || !this.index.isBlank(closeLine, last.closeStart)) return undefined;
    if (!block.branches.every((b) => this.index.isAloneOnLine(b.tagStart, b.tagEnd))) return undefined;

    const ranges = block.branches.map((b) => ({
      lo: this.body.indexOf("\n", b.tagEnd) + 1,
      hi: this.index.lineStartOf(b.closeStart),
    }));
    return { ranges, skip: closeNewline === -1 ? this.body.length : closeNewline + 1 };
  }

  // --- shared ------------------------------------------------------------

  /** Writes `text`; if it is empty and the construct is alone on its line, drops the whole line. */
  private emit(out: Output, piece: { start: number; end: number }, text: string, trim: Trim = {}): void {
    if (text !== "") return out.append(text);
    const alone = this.isAloneOnItsLine(piece);
    let skip = piece.end;
    if (alone) {
      out.dropIndent();
      const newline = this.body.indexOf("\n", piece.end);
      skip = newline === -1 ? this.body.length : newline + 1;
    }
    // Inline, trimming stays on the line; on a line of its own it also eats newlines.
    if (trim.trimLeft) out.trimEnd(!alone);
    if (trim.trimRight) skip = this.skipWhitespace(skip, !alone);
    if (skip > piece.end) out.skipTo(skip);
  }

  /** The offset of the first non-whitespace character at or after `from` (not crossing newlines if `inline`). */
  private skipWhitespace(from: number, inline: boolean): number {
    const blank = inline ? /[ \t]/ : /\s/;
    let at = from;
    while (at < this.body.length && blank.test(this.body[at])) at++;
    return at;
  }

  private isAloneOnItsLine(piece: { start: number; end: number }): boolean {
    const newline = this.body.indexOf("\n", piece.end);
    const lineEnd = newline === -1 ? this.body.length : newline;
    return this.index.isBlank(this.index.lineStartOf(piece.start), piece.start) && this.index.isBlank(piece.end, lineEnd);
  }

  /** Where `[start, end)` is, for diagnostics; the length counts the first line only. */
  private position(start: number, end: number): TemplatePosition {
    const at = this.index.position(start);
    const newline = this.body.indexOf("\n", start);
    const firstLineEnd = newline === -1 || newline > end ? end : newline;
    return { line: at.line + this.lineOffset, column: at.column, length: firstLineEnd - start };
  }

  private lookup(name: string): Props[string] | undefined {
    return Object.prototype.hasOwnProperty.call(this.values, name) ? this.values[name] : undefined;
  }
}
