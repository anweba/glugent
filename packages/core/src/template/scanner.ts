import { ConditionParser } from "./condition";
import { BRACE, ELSE, IF_CLOSE, IF_OPEN, IF_START, PLACEHOLDER, TAG, unquote } from "./grammar";
import { Branch, Piece, Scanned } from "./pieces";

/**
 * Accumulates the pieces of one stretch of the template. Text between the
 * recognised constructs is collected lazily: the scanner only says where the
 * next construct starts and the segment fills the gap with a text piece.
 */
class Segment {
  readonly pieces: Piece[] = [];
  private cursor: number;

  constructor(from: number) {
    this.cursor = from;
  }

  /** Where scanning resumes. */
  get position(): number {
    return this.cursor;
  }

  /** Emits the plain text between the cursor and `to`. */
  textUntil(to: number): void {
    if (to > this.cursor) this.pieces.push({ kind: "text", start: this.cursor, end: to });
  }

  /** Adds a piece and moves on to `resumeAt`. */
  add(piece: Piece, resumeAt: number): void {
    this.pieces.push(piece);
    this.cursor = resumeAt;
  }

  /** Adds a piece without moving the cursor (used for errors found inside a construct). */
  note(piece: Piece): void {
    this.pieces.push(piece);
  }
}

/**
 * Turns template source into pieces. Every `{` and `}` belongs to the template
 * language; a stray one becomes an error piece.
 *
 *   {{ / }}         literal `{` / `}`
 *   {!...!}         raw block: content kept as-is, delimiters dropped
 *   {NAME}          required prop
 *   {NAME?}         optional prop
 *   {NAME?"text"}   optional prop with a default value (may span lines)
 *   {-NAME?-}       optional prop; when empty, also removes the whitespace on the side(s) with a `-`
 *   {- if A { ... } -}
 *                   same trim markers on an `if` block that renders nothing
 *   { if A && (B || C) { ... } else if D { ... } else { ... } }
 *                   the first branch whose condition holds is rendered
 */
export class TemplateScanner {
  constructor(private readonly body: string) {}

  /**
   * Scans from `from`. When `nested` (inside an `if` branch) it stops at the
   * tag that ends the branch (`} else ... {` or `} }`) instead of reaching the end.
   */
  scan(from = 0, nested = false): Scanned {
    const segment = new Segment(from);
    const braces = new RegExp(BRACE.source, "g");
    braces.lastIndex = from;

    for (let m = braces.exec(this.body); m; m = braces.exec(this.body)) {
      const start = m.index;
      segment.textUntil(start);
      const ended = m[0] === "}" ? this.closingBrace(segment, start, nested) : this.opening(segment, start, m[0]);
      if (ended) return ended;
      braces.lastIndex = segment.position;
    }
    segment.textUntil(this.body.length);
    return { pieces: segment.pieces, stop: "eof", closeStart: this.body.length, end: this.body.length };
  }

  // --- a `}` -------------------------------------------------------------

  /** Returns the scan result when this `}` ends the current branch. */
  private closingBrace(segment: Segment, start: number, nested: boolean): Scanned | undefined {
    if (this.body[start + 1] === "}") {
      segment.add({ kind: "literal", start, end: start + 2, value: "}" }, start + 2);
      return;
    }
    if (nested) {
      const close = this.match(IF_CLOSE, start);
      if (close) return { pieces: segment.pieces, stop: "end", closeStart: start, end: start + close[0].length };
      if (this.match(ELSE, start)) return { pieces: segment.pieces, stop: "else", closeStart: start, end: start };
    }
    const message = "Unexpected '}' (use '}}' for a literal '}', or wrap text in {!...!})";
    segment.add({ kind: "error", start, end: start + 1, message }, start + 1);
  }

  // --- a `{` -------------------------------------------------------------

  private opening(segment: Segment, start: number, brace: string): undefined {
    if (brace === "{!") this.rawBlock(segment, start);
    else if (brace === "{{") segment.add({ kind: "literal", start, end: start + 2, value: "{" }, start + 2);
    else if (!this.ifBlock(segment, start) && !this.placeholder(segment, start)) this.strayBrace(segment, start);
  }

  private rawBlock(segment: Segment, start: number): void {
    const close = this.body.indexOf("!}", start + 2);
    if (close === -1) {
      segment.add({ kind: "error", start, end: start + 2, message: "Unclosed '{!' (expected '!}')" }, start + 2);
    } else {
      segment.add({ kind: "raw", start, end: close + 2 }, close + 2);
    }
  }

  private placeholder(segment: Segment, start: number): boolean {
    const tag = this.match(TAG, start);
    if (!tag) return false;
    const end = start + tag[0].length;
    const parts = PLACEHOLDER.exec(tag[1]);
    if (!parts) {
      const message = `Invalid placeholder '${tag[0]}' (expected {NAME}, {NAME?}, {NAME?"default"}, {-NAME?-} or { if NAME { ... } })`;
      segment.add({ kind: "error", start, end, message }, end);
    } else if (parts[4] && !parts[3]) {
      segment.add({ kind: "error", start, end, message: "A default value needs '?' after the name" }, end);
    } else if ((parts[1] || parts[5]) && !parts[3]) {
      segment.add({ kind: "error", start, end, message: "Trim markers need '?' after the name ({-NAME?-})" }, end);
    } else if ((parts[1] || parts[5]) && parts[4]) {
      segment.add({ kind: "error", start, end, message: "Trim markers cannot be combined with a default value" }, end);
    } else {
      const [, left, name, optional, quoted, right] = parts;
      segment.add({
        kind: "token", start, end, name, optional: !!optional,
        default: quoted ? unquote(quoted) : undefined, trimLeft: !!left, trimRight: !!right,
      }, end);
    }
    return true;
  }

  private strayBrace(segment: Segment, start: number): void {
    const message = this.match(IF_START, start)
      ? "Malformed 'if' (expected { if NAME && (NAME || NAME) { ... } else { ... } })"
      : "Unexpected '{' (use '{{' for a literal '{', or wrap text in {!...!})";
    segment.add({ kind: "error", start, end: start + 1, message }, start + 1);
  }

  // --- if blocks ---------------------------------------------------------

  /** `{ if c { ... } else if c { ... } else { ... } }`. Returns false if no `if` starts here. */
  private ifBlock(segment: Segment, start: number): boolean {
    const open = this.match(IF_OPEN, start);
    if (!open) return false;

    const branches: Branch[] = [];
    let tagStart = start;
    let tagEnd = start + open[0].length;
    let conditionText: string | undefined = open[2];
    let conditionAt = start + open[1].length;
    let after: Scanned;
    let sawElse = false;

    for (;;) {
      const parsed = conditionText === undefined ? undefined : ConditionParser.parse(conditionText, conditionAt);
      if (parsed?.error) {
        segment.note({ kind: "error", start: conditionAt, end: conditionAt + conditionText!.length, message: parsed.error });
      }
      after = this.scan(tagEnd, true);
      branches.push({ condition: parsed?.condition, tagStart, tagEnd, closeStart: after.closeStart, children: after.pieces });
      if (after.stop !== "else" || sawElse) break;

      const elseTag = this.match(ELSE, after.closeStart)!;
      tagStart = after.closeStart;
      tagEnd = tagStart + elseTag[0].length;
      conditionText = elseTag[1];
      conditionAt = tagStart + elseTag[0].lastIndexOf(elseTag[1] ?? "");
      sawElse = conditionText === undefined;
    }

    if (after.stop !== "end") {
      segment.note({ kind: "error", start, end: branches[0].tagEnd, message: "Unclosed 'if' block (expected '} }')" });
    }
    const trimLeft = this.body[start + 1] === "-";
    const trimRight = after.stop === "end" && this.body[after.end - 2] === "-";
    segment.add({ kind: "if", start, end: after.end, branches, trimLeft, trimRight }, after.end);
    return true;
  }

  // --- helpers -----------------------------------------------------------

  /** Matches a sticky pattern exactly at `at`. */
  private match(pattern: RegExp, at: number): RegExpExecArray | null {
    pattern.lastIndex = at;
    return pattern.exec(this.body);
  }
}
