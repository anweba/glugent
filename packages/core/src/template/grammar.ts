/**
 * The lexicon of the template language, as regular expressions.
 * Sticky (`y`) ones are anchored at `lastIndex` and used to test "does this
 * construct start exactly here?".
 */

export const NAME = "[A-Za-z_][\\w.]*";

/** A quoted default may contain anything, including raw newlines. */
export const STRING = '"(?:[^"\\\\]|\\\\[\\s\\S])*"';

/** Characters that can appear in an `if` condition. */
const CONDITION = "[\\w.()&|!\\s]+?";

/** The next brace that may start or end something: `{{`, `{!`, any other `{`, or any `}`. */
export const BRACE = /\{\{|\{!|\{|\}/g;

/** `{ ... }` with no braces inside: a candidate placeholder. */
export const TAG = new RegExp(`\\{((?:${STRING}|[^{}"\\n])*)\\}`, "y");

/**
 * The inside of a placeholder: `NAME`, `NAME?` or `NAME?"default"`. Trim markers
 * need the `?`: `-NAME?`, `NAME?-`, `-NAME?-`.
 * Groups: 1 left marker, 2 name, 3 `?`, 4 default, 5 right marker.
 */
export const PLACEHOLDER = new RegExp(`^\\s*(-)?(${NAME})\\s*(?:(\\?)\\s*(${STRING})?\\s*(-)?)?\\s*$`);

/** `{ if <condition> {`: group 1 is the part before the condition, group 2 the condition. */
export const IF_OPEN = new RegExp(`(\\{-?\\s*if\\s+)(${CONDITION})\\s*\\{`, "y");

/** Just the start of an `if`, to tell a malformed one from a stray `{`. */
export const IF_START = /\{-?\s*if\b/y;

/** A section id as written in `{ REF id }`: a path such as `repo/layout` or a unique suffix of one. */
const SECTION_ID = "[\\w.\\-/]+";

/** A prop value passed to a REF: a quoted template, or a bare `true`, `false` or number. */
const REF_VALUE = `(?:${STRING}|true|false|-?\\d+(?:\\.\\d+)?)`;

/** `| NAME=value NAME=value`: props passed to a REF, separated by whitespace. */
const REF_PROPS = `(?:\\s*\\|\\s*(${NAME}\\s*=\\s*${REF_VALUE}(?:\\s+${NAME}\\s*=\\s*${REF_VALUE})*))?`;

/** One `NAME=value` of a REF's props: group 1 the name, group 2 the value as written. */
export const REF_PROP = new RegExp(`(${NAME})\\s*=\\s*(${REF_VALUE})`, "g");

/**
 * `{ REF id }` or `{ REF-OVERRIDE id }`, optionally with `| NAME=value ...`:
 * group 1 the keyword, group 2 the section id, group 3 the props.
 * A lone `{REF}` has no id, so it stays a prop.
 */
export const REF = new RegExp(`\\{\\s*(REF|REF-OVERRIDE)\\s+(${SECTION_ID})${REF_PROPS}\\s*\\}`, "y");

/** Just the start of a `REF` (`REF-OVERRIDE`, or `REF` and something like an id), to tell a malformed one from a bad placeholder. */
export const REF_START = /\{\s*REF(?:-OVERRIDE\b|\s+[\w.\-/])/y;

/**
 * `{ REF BEGIN id }` / `{ REF-OVERRIDE BEGIN id }`, optionally with `| NAME=value ...`:
 * group 1 the keyword, group 2 the id (absent if not written), group 3 the props.
 */
export const REF_BEGIN = new RegExp(`\\{\\s*(REF|REF-OVERRIDE)\\s+BEGIN(?:\\s+(${SECTION_ID}))?${REF_PROPS}\\s*\\}`, "y");

/** `{ REF END id }`, with either keyword: group 1 the id (absent if not written). */
export const REF_END = new RegExp(`\\{\\s*REF(?:-OVERRIDE)?\\s+END(?:\\s+(${SECTION_ID}))?\\s*\\}`, "y");

/** The slot a fill or definition names when it names none. */
export const DEFAULT_SLOT = "default";

/** `{ SLOT BEGIN name }` / `{ SLOT-INHERIT BEGIN }`: group 1 the keyword, group 2 the slot name (absent: the default slot). */
export const SLOT_BEGIN = new RegExp(`\\{\\s*(SLOT|SLOT-INHERIT)\\s+BEGIN(?:\\s+(${NAME}))?\\s*\\}`, "y");

/** `{ SLOT END name }`, with either keyword: group 1 the slot name (absent: the default slot). */
export const SLOT_END = new RegExp(`\\{\\s*SLOT(?:-INHERIT)?\\s+END(?:\\s+(${NAME}))?\\s*\\}`, "y");

/** Just the start of a SLOT tag, to tell a malformed one from a bad placeholder. A lone `{SLOT}` is a prop. */
export const SLOT_START = /\{\s*SLOT(?:-INHERIT\b|\s+(?:BEGIN|END)\b)/y;

/**
 * A slot definition: `{ # }`, `{ #? }`, `{ #name }`, `{ #name? }`, with trim markers `{- #? -}`.
 * Groups: 1 left marker, 2 name, 3 `?`, 4 right marker.
 */
export const SLOT_DEF = new RegExp(`\\{(-)?\\s*#(${NAME})?\\s*(\\?)?\\s*(-)?\\}`, "y");

/** `} else {` or `} else if <condition> {`. */
export const ELSE = new RegExp(`\\}\\s*else(?:\\s+if\\s+(${CONDITION}))?\\s*\\{`, "y");

/** `} }` or `} -}`: whitespace is required, because adjacent `}}` is a literal brace. */
export const IF_CLOSE = /\}[ \t\r\n]+-?\}/y;

/** One token of a condition: a name, an operator, a parenthesis, or any other character. */
export const CONDITION_TOKEN = new RegExp(`\\s*(${NAME}|&&|\\|\\||!&|!\\||!|\\(|\\)|\\S)`, "y");

/** Resolves the escapes allowed in a quoted default: `\"`, `\\` and `\n`. */
export function unquote(quoted: string): string {
  return quoted.slice(1, -1).replace(/\\(["\\n])/g, (_, c) => (c === "n" ? "\n" : c));
}
