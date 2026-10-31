import { ConditionParser } from "./condition";
import {
  BRACE, DEFAULT_SLOT, ELSE, IF_CLOSE, IF_OPEN, IF_START, PLACEHOLDER, REF, REF_BEGIN, REF_END, REF_PROP, REF_START,
  SLOT_BEGIN, SLOT_DEF, SLOT_END, SLOT_START, TAG, unquote,
} from "./grammar";
import { Branch, Fill, Piece, RefProp, Scanned } from "./pieces";

/** What the scan of a nested stretch stops at: the end of an `if` branch, a REF block or a SLOT block. */
type Until = "if" | "ref" | "slot";

/**
 * Accumulates the pieces of one stretch of the template. Text between the
 * recognised constructs is collected lazily: the scanner only says where the
 * next construct starts and the segment fills the gap with a text piece.
 */
class Segment {
  readonly pieces: Piece[] = [];
  readonly fills: Fill[] = [];
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

  /** Records a SLOT block and moves past it. */
  fill(fill: Fill): void {
    this.fills.push(fill);
    this.cursor = fill.end;
  }

  /** The scan result when a stopping tag is reached. */
  stop(stop: Scanned["stop"], closeStart: number, end: number, endName?: string): Scanned {
    return { pieces: this.pieces, fills: this.fills, stop, closeStart, end, endName };
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
 *   { REF id }      the section `id`, rendered with its own props
 *   { REF-OVERRIDE id }
 *                   the same, but the including section's props win over the section's own
 *   { REF BEGIN id } ... { REF END id }
 *                   the same, filling the section's slots: the content fills the default
 *                   slot, or holds only `{ SLOT BEGIN name } ... { SLOT END name }` blocks
 *                   (`SLOT-INHERIT`: the filled section's props win)
 *   { # }, { #? }, { #name }, { #name? }, {- #? -}
 *                   a slot, alone on its line; `?` when filling it is optional
 */
export class TemplateScanner {
  constructor(private readonly body: string) {}

  /**
   * Scans from `from`. Nested stretches stop at the tag that ends them instead of
   * reaching the end: an `if` branch at `} else ... {` or `} }`, a REF block at
   * `{ REF END }`, a SLOT block at `{ SLOT END }`.
   */
  scan(from = 0, until?: Until): Scanned {
    const segment = new Segment(from);
    const braces = new RegExp(BRACE.source, "g");
    braces.lastIndex = from;

    for (let m = braces.exec(this.body); m; m = braces.exec(this.body)) {
      const start = m.index;
      segment.textUntil(start);
      const ended = m[0] === "}" ? this.closingBrace(segment, start, until) : this.opening(segment, start, m[0], until);
      if (ended) return ended;
      braces.lastIndex = segment.position;
    }
    segment.textUntil(this.body.length);
    return segment.stop("eof", this.body.length, this.body.length);
  }

  // --- a `}` -------------------------------------------------------------

  /** Returns the scan result when this `}` ends the current branch. */
  private closingBrace(segment: Segment, start: number, until?: Until): Scanned | undefined {
    if (this.body[start + 1] === "}") {
      segment.add({ kind: "literal", start, end: start + 2, value: "}" }, start + 2);
      return;
    }
    if (until === "if") {
      const close = this.match(IF_CLOSE, start);
      if (close) return segment.stop("end", start, start + close[0].length);
      if (this.match(ELSE, start)) return segment.stop("else", start, start);
    }
    const message = "Unexpected '}' (use '}}' for a literal '}', or wrap text in {!...!})";
    segment.add({ kind: "error", start, end: start + 1, message }, start + 1);
  }

  // --- a `{` -------------------------------------------------------------

  private opening(segment: Segment, start: number, brace: string, until?: Until): Scanned | undefined {
    if (brace === "{!") return void this.rawBlock(segment, start);
    if (brace === "{{") return void segment.add({ kind: "literal", start, end: start + 2, value: "{" }, start + 2);

    const end = this.endTag(segment, start, until);
    if (end) return end;
    if (until === "ref" && this.slotBlock(segment, start)) return;
    if (
      !this.refBlock(segment, start) && !this.misplacedTag(segment, start) && !this.ref(segment, start) &&
      !this.slotDefinition(segment, start) && !this.ifBlock(segment, start) && !this.placeholder(segment, start)
    ) {
      this.strayBrace(segment, start);
    }
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
      const isRef = !!this.match(REF_START, start);
      const message = isRef && tag[1].includes("|")
        ? `Malformed props on 'REF' (expected | NAME="text", NAME=true, NAME=false or NAME=3, separated by spaces)`
        : isRef
        ? "Malformed 'REF' (expected { REF section/id } or { REF-OVERRIDE section/id })"
        : this.match(SLOT_START, start)
          ? "Malformed 'SLOT' (expected { SLOT BEGIN name } or { SLOT END name })"
          : `Invalid placeholder '${tag[0]}' (expected {NAME}, {NAME?}, {NAME?"default"}, {-NAME?-}, { if NAME { ... } } or { REF section/id })`;
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
      : this.match(REF_START, start)
        ? "Malformed 'REF' (expected { REF section/id } or { REF-OVERRIDE section/id })"
        : "Unexpected '{' (use '{{' for a literal '{', or wrap text in {!...!})";
    segment.add({ kind: "error", start, end: start + 1, message }, start + 1);
  }

  // --- section references and slots ---------------------------------------

  /** `{ REF id }` / `{ REF-OVERRIDE id }`, with optional `| NAME=value ...`. Returns false if none starts here. */
  private ref(segment: Segment, start: number): boolean {
    const ref = this.match(REF, start);
    if (!ref) return false;
    const end = start + ref[0].length;
    const props = this.refProps(segment, start, ref);
    segment.add({ kind: "ref", start, end, id: ref[2], override: ref[1] === "REF-OVERRIDE", props }, end);
    return true;
  }

  /** The `| NAME=value ...` of a REF tag (group 3 of `tag`); a name given twice is an error. */
  private refProps(segment: Segment, start: number, tag: RegExpExecArray): RefProp[] | undefined {
    const text = tag[3];
    if (!text) return undefined;
    const at = start + tag[0].indexOf(text, tag[0].indexOf("|"));
    const props: RefProp[] = [];
    for (const m of text.matchAll(REF_PROP)) {
      const [whole, name, written] = m;
      const prop: RefProp = { name, start: at + m.index!, end: at + m.index! + whole.length };
      if (written.startsWith('"')) prop.template = unquote(written);
      else prop.value = written === "true" ? true : written === "false" ? false : Number(written);
      if (props.some((p) => p.name === name)) {
        segment.note({ kind: "error", start: prop.start, end: prop.end, message: `Prop '${name}' is passed twice` });
      } else {
        props.push(prop);
      }
    }
    return props;
  }

  /** `{ REF BEGIN id } ... { REF END id }`. Returns false if no block starts here. */
  private refBlock(segment: Segment, start: number): boolean {
    const open = this.match(REF_BEGIN, start);
    if (!open) return false;
    const [, keyword, id] = open;
    const tagEnd = start + open[0].length;
    const props = this.refProps(segment, start, open);
    const after = this.scan(tagEnd, "ref");
    const error = (message: string, from = start, to = tagEnd) => segment.note({ kind: "error", start: from, end: to, message });

    if (!id) {
      const message = `'${keyword} BEGIN' needs a section id ({ ${keyword} BEGIN section/id })`;
      segment.add({ kind: "error", start, end: tagEnd, message }, after.end);
      return true;
    }
    if (after.stop !== "ref-end") error(`Unclosed '${keyword} BEGIN ${id}' (expected { REF END ${id} })`);
    else if (after.endName !== id) error(`'REF END ${after.endName ?? ""}' does not match '${keyword} BEGIN ${id}'`, after.closeStart, after.end);

    const fills = after.fills.length ? this.slotBlocksOnly(segment, after) : [{
      name: DEFAULT_SLOT, inherit: false, start, end: after.end, contentStart: tagEnd, contentEnd: after.closeStart, children: after.pieces,
    }];
    segment.add({ kind: "ref", start, end: after.end, id, override: keyword === "REF-OVERRIDE", props, fills }, after.end);
    return true;
  }

  /** A REF block with SLOT blocks holds nothing else; returns its fills, reporting strays and duplicates. */
  private slotBlocksOnly(segment: Segment, content: Scanned): Fill[] {
    for (const piece of content.pieces) {
      if (piece.kind === "error") segment.note(piece);
      else if (piece.kind !== "text" || this.body.slice(piece.start, piece.end).trim()) {
        const message = "A REF block with SLOT blocks can hold only SLOT blocks (wrap the rest in { SLOT BEGIN } ... { SLOT END })";
        segment.note({ kind: "error", start: piece.start, end: piece.end, message });
      }
    }
    const seen = new Set<string>();
    return content.fills.filter((fill) => {
      if (!seen.has(fill.name)) return seen.add(fill.name);
      segment.note({ kind: "error", start: fill.start, end: fill.contentStart, message: `Slot '${fill.name}' is filled twice` });
      return false;
    });
  }

  /** `{ SLOT BEGIN name } ... { SLOT END name }`, directly inside a REF block. */
  private slotBlock(segment: Segment, start: number): boolean {
    const open = this.match(SLOT_BEGIN, start);
    if (!open) return false;
    const [, keyword, name = DEFAULT_SLOT] = open;
    const tagEnd = start + open[0].length;
    const after = this.scan(tagEnd, "slot");
    if (after.stop !== "slot-end") {
      segment.note({ kind: "error", start, end: tagEnd, message: `Unclosed '${keyword} BEGIN' (expected { SLOT END${name === DEFAULT_SLOT ? "" : " " + name} })` });
    } else if ((after.endName ?? DEFAULT_SLOT) !== name) {
      segment.note({ kind: "error", start: after.closeStart, end: after.end, message: `'SLOT END ${after.endName ?? ""}' does not match '${keyword} BEGIN ${name}'` });
    }
    // Errors inside the content travel with it; the fill's children keep them.
    segment.fill({ name, inherit: keyword === "SLOT-INHERIT", start, end: after.end, contentStart: tagEnd, contentEnd: after.closeStart, children: after.pieces });
    return true;
  }

  /** `{ REF END }` ends a REF block and `{ SLOT END }` a SLOT block, when one is open. */
  private endTag(segment: Segment, start: number, until?: Until): Scanned | undefined {
    const pattern = until === "ref" ? REF_END : until === "slot" ? SLOT_END : undefined;
    const end = pattern && this.match(pattern, start);
    if (end) return segment.stop(until === "ref" ? "ref-end" : "slot-end", start, start + end[0].length, end[1]);
  }

  /** END tags with nothing open, and SLOT blocks outside a REF block. */
  private misplacedTag(segment: Segment, start: number): boolean {
    const tag = this.match(REF_END, start) ?? this.match(SLOT_BEGIN, start) ?? this.match(SLOT_END, start);
    if (!tag) return false;
    const end = start + tag[0].length;
    const message = /^\{\s*REF/.test(tag[0])
      ? "'REF END' without a matching { REF BEGIN section/id }"
      : /BEGIN/.test(tag[0])
        ? "SLOT blocks go directly inside { REF BEGIN section/id } ... { REF END section/id }"
        : "'SLOT END' without a matching { SLOT BEGIN }";
    segment.add({ kind: "error", start, end, message }, end);
    return true;
  }

  /** `{ #name? }`: must sit alone on its line. */
  private slotDefinition(segment: Segment, start: number): boolean {
    const def = this.match(SLOT_DEF, start);
    if (!def) return false;
    const end = start + def[0].length;
    const [, left, name = DEFAULT_SLOT, optional, right] = def;
    if ((left || right) && !optional) {
      segment.add({ kind: "error", start, end, message: "Trim markers need '?' after the slot ({- #name? -})" }, end);
    } else if (!this.isAloneOnLine(start, end)) {
      segment.add({ kind: "error", start, end, message: `Slot '${name}' must be on a line of its own` }, end);
    } else {
      segment.add({ kind: "slot", start, end, name, optional: !!optional, trimLeft: !!left, trimRight: !!right }, end);
    }
    return true;
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
      after = this.scan(tagEnd, "if");
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

  /** Only spaces and tabs share the line with `[start, end)`. */
  private isAloneOnLine(start: number, end: number): boolean {
    const lineStart = this.body.lastIndexOf("\n", start - 1) + 1;
    const newline = this.body.indexOf("\n", end);
    const lineEnd = newline === -1 ? this.body.length : newline;
    return /^[ \t]*$/.test(this.body.slice(lineStart, start)) && /^[ \t]*$/.test(this.body.slice(end, lineEnd));
  }
}
