import { Condition } from "./condition";

/** What the scanner turns a template into: a tree of pieces, each tied to source offsets. */
export type Piece =
  | { kind: "text"; start: number; end: number }
  /** `{{` and `}}`, rendered as `{` and `}`. */
  | { kind: "literal"; start: number; end: number; value: string }
  /** `{!...!}`: content rendered as-is. */
  | { kind: "raw"; start: number; end: number }
  | { kind: "token"; start: number; end: number; name: string; optional: boolean; default?: string; trimLeft?: boolean; trimRight?: boolean }
  | { kind: "if"; start: number; end: number; branches: Branch[]; trimLeft?: boolean; trimRight?: boolean }
  /**
   * `{ REF id }`: the rendered section `id`. `override` for `REF-OVERRIDE` (the including section's props win).
   * `fills` for the block form `{ REF BEGIN id } ... { REF END id }`.
   */
  | { kind: "ref"; start: number; end: number; id: string; override: boolean; fills?: Fill[] }
  /** A slot definition `{ #name? }`, alone on its line. */
  | { kind: "slot"; start: number; end: number; name: string; optional: boolean; trimLeft?: boolean; trimRight?: boolean }
  | { kind: "error"; start: number; end: number; message: string };

export type IfPiece = Extract<Piece, { kind: "if" }>;
export type RefPiece = Extract<Piece, { kind: "ref" }>;
export type SlotPiece = Extract<Piece, { kind: "slot" }>;

/** One arm of an `if`: `{ if c {`, `} else if c {` or `} else {`, and what follows it. */
export interface Branch {
  /** Absent for `else`. */
  condition?: Condition;
  /** The tag opening this branch. */
  tagStart: number;
  tagEnd: number;
  /** Start of the tag closing this branch's content. */
  closeStart: number;
  children: Piece[];
}

/**
 * What a REF block puts into one slot: a `{ SLOT BEGIN name } ... { SLOT END name }` block,
 * or, when there are none, the whole content of the REF block for the default slot.
 */
export interface Fill {
  name: string;
  /** `SLOT-INHERIT`: the filled section's props win over the including section's. */
  inherit: boolean;
  /** From the opening tag to the closing one. */
  start: number;
  end: number;
  /** The content between the tags. */
  contentStart: number;
  contentEnd: number;
  children: Piece[];
}

/** The result of scanning one stretch of the template. */
export interface Scanned {
  pieces: Piece[];
  /** SLOT blocks met directly inside a REF block. */
  fills: Fill[];
  /** Why scanning stopped. */
  stop: "eof" | "end" | "else" | "ref-end" | "slot-end";
  /** Offset where the stopping tag begins and, except for `else`, where it ends. */
  closeStart: number;
  end: number;
  /** The id or slot name written in a `REF END` / `SLOT END` tag. */
  endName?: string;
}
