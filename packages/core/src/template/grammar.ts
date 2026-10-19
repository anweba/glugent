/**
 * The lexicon of the template language, as regular expressions.
 * Sticky (`y`) ones are anchored at `lastIndex` and used to test "does this
 * construct start exactly here?".
 */

export const NAME = "[A-Za-z_][\\w.-]*";

/** A quoted default may contain anything, including raw newlines. */
export const STRING = '"(?:[^"\\\\]|\\\\[\\s\\S])*"';

/** Characters that can appear in an `if` condition. */
const CONDITION = "[\\w.()&|!\\s-]+?";

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
