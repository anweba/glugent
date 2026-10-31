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
  /** `{ REF id }`: the rendered section `id`. `override` for `REF-OVERRIDE` (the including section's props win). */
  | { kind: "ref"; start: number; end: number; id: string; override: boolean }
  | { kind: "error"; start: number; end: number; message: string };

export type IfPiece = Extract<Piece, { kind: "if" }>;
export type RefPiece = Extract<Piece, { kind: "ref" }>;

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

/** The result of scanning one stretch of the template. */
export interface Scanned {
  pieces: Piece[];
  /** Why scanning stopped. */
  stop: "eof" | "end" | "else";
  /** Offset where the stopping tag begins (`}`) and, for `end`, where it ends. */
  closeStart: number;
  end: number;
}
