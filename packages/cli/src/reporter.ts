import * as path from "path";
import { Diagnostic } from "@anweba/glugent-core";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const GREY = "\x1b[90m";
const RESET = "\x1b[0m";

/**
 * Whether to color a stream: on a terminal unless NO_COLOR is set; FORCE_COLOR
 * (anything but "0") turns it on when piped, e.g. by the git hooks.
 */
export function colorEnabled(env = process.env, isTTY = !!process.stderr.isTTY): boolean {
  if (env.NO_COLOR) return false;
  if (env.FORCE_COLOR !== undefined) return env.FORCE_COLOR !== "0";
  return isTTY;
}

/** Everything the CLI prints, so commands never touch `console` directly. */
export class Reporter {
  constructor(
    private readonly color = colorEnabled(),
    private readonly colorOut = colorEnabled(process.env, !!process.stdout.isTTY),
  ) {}

  info(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
  }

  /** Prints `✓ message`, with a green ✓ when colored. */
  success(message: string): void {
    this.info(this.colorOut ? `${GREEN}✓${RESET} ${message}` : `✓ ${message}`);
  }

  /** Prints `✗ message`: a red ✗ and yellow text when colored. */
  failure(message: string): void {
    this.error(this.color ? `${RED}✗${YELLOW} ${message}${RESET}` : `✗ ${message}`);
  }

  /** Prints what to run next, in grey when colored. */
  hint(message: string): void {
    this.error(this.color ? `${GREY}${message}${RESET}` : message);
  }

  /** Prints `file:line:column severity: message` (1-based, relative to the cwd). */
  diagnostic(d: Diagnostic): void {
    const file = path.relative(process.cwd(), d.file);
    this.error(`${file}:${d.line + 1}:${d.column + 1} ${d.severity}: ${d.message}`);
  }

  diagnostics(list: Diagnostic[]): void {
    list.forEach((d) => this.diagnostic(d));
  }

  /** A path as shown to the user. */
  relative(file: string, from = process.cwd()): string {
    return path.relative(from, file);
  }

  static hasErrors(list: Diagnostic[]): boolean {
    return list.some((d) => d.severity === "error");
  }
}
