import { CONDITION_TOKEN, NAME } from "./grammar";

/** A prop name used in a condition, with its source range. */
export interface Ref {
  name: string;
  start: number;
  end: number;
}

export type Condition =
  | { t: "name"; ref: Ref }
  | { t: "not"; item: Condition }
  | { t: "and" | "or"; items: Condition[] };

interface Token {
  value: string;
  start: number;
}

interface BinaryOperator {
  t: "and" | "or";
  negate: boolean;
}

export interface ParsedCondition {
  condition: Condition;
  error?: string;
}

/**
 * Parses `A && (B || C)`. Precedence, tightest first: `!` (not), then `&&` and
 * `!&` (nand), then `||` and `!|` (nor); same-level operators group left to right.
 */
export class ConditionParser {
  private static readonly AND_LEVEL: Record<string, BinaryOperator> = {
    "&&": { t: "and", negate: false },
    "!&": { t: "and", negate: true },
  };
  private static readonly OR_LEVEL: Record<string, BinaryOperator> = {
    "||": { t: "or", negate: false },
    "!|": { t: "or", negate: true },
  };
  /** A condition that never holds, used after an error. */
  private static readonly NEVER: Condition = { t: "or", items: [] };

  private readonly tokens: Token[];
  private next = 0;
  private error?: string;

  private constructor(text: string, offset: number) {
    this.tokens = ConditionParser.tokenize(text, offset);
  }

  /** `offset` is where `text` starts in the template, so refs carry real positions. */
  static parse(text: string, offset: number): ParsedCondition {
    return new ConditionParser(text, offset).parse();
  }

  private static tokenize(text: string, offset: number): Token[] {
    const tokens: Token[] = [];
    const re = new RegExp(CONDITION_TOKEN.source, "y");
    while (re.lastIndex < text.length) {
      const m = re.exec(text);
      if (!m) break; // trailing whitespace
      tokens.push({ value: m[1], start: offset + m.index + m[0].length - m[1].length });
    }
    return tokens;
  }

  private parse(): ParsedCondition {
    const condition = this.orLevel();
    if (this.next < this.tokens.length) this.fail(`Unexpected '${this.tokens[this.next].value}' in condition`);
    return this.error ? { condition: ConditionParser.NEVER, error: this.error } : { condition };
  }

  private orLevel(): Condition {
    return this.binary(ConditionParser.OR_LEVEL, () => this.andLevel());
  }

  private andLevel(): Condition {
    return this.binary(ConditionParser.AND_LEVEL, () => this.unary());
  }

  private binary(operators: Record<string, BinaryOperator>, operand: () => Condition): Condition {
    let left = operand();
    while (this.peek() && Object.hasOwn(operators, this.peek()!.value)) {
      const { t, negate } = operators[this.tokens[this.next++].value];
      const node: Condition = { t, items: [left, operand()] };
      left = negate ? { t: "not", item: node } : node;
    }
    return left;
  }

  private unary(): Condition {
    const token = this.peek();
    if (token?.value === "!") {
      this.next++;
      return { t: "not", item: this.unary() };
    }
    if (token?.value === "(") {
      this.next++;
      const inner = this.orLevel();
      if (this.peek()?.value === ")") this.next++;
      else this.fail("Missing ')' in condition");
      return inner;
    }
    if (token && new RegExp(`^${NAME}$`).test(token.value)) {
      this.next++;
      return { t: "name", ref: { name: token.value, start: token.start, end: token.start + token.value.length } };
    }
    this.fail(token ? `Unexpected '${token.value}' in condition` : "Incomplete condition");
    this.next++;
    return ConditionParser.NEVER;
  }

  private peek(): Token | undefined {
    return this.tokens[this.next];
  }

  private fail(message: string): void {
    this.error ??= message;
  }
}

/** Every prop name a condition mentions. */
export function conditionRefs(condition: Condition): Ref[] {
  if (condition.t === "name") return [condition.ref];
  if (condition.t === "not") return conditionRefs(condition.item);
  return condition.items.flatMap(conditionRefs);
}

/** Evaluates a condition, asking `isSet` whether each prop holds. */
export function conditionHolds(condition: Condition, isSet: (name: string) => boolean): boolean {
  if (condition.t === "name") return isSet(condition.ref.name);
  if (condition.t === "not") return !conditionHolds(condition.item, isSet);
  const holds = (c: Condition) => conditionHolds(c, isSet);
  return condition.t === "and" ? condition.items.every(holds) : condition.items.some(holds);
}
