import * as path from "path";
import { Diagnostic } from "@anweba/glugent-core";

/** Everything the CLI prints, so commands never touch `console` directly. */
export class Reporter {
  info(message: string): void {
    console.log(message);
  }

  error(message: string): void {
    console.error(message);
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
