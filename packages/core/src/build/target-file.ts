/** A target's JSON text, used to point diagnostics at the right entry. */
export class TargetFile {
  private readonly lines: string[];

  constructor(text: string) {
    this.lines = text.split("\n");
  }

  /** Position of the first `"needle"` in the file, or the top of the file. */
  locate(needle: string): { line: number; column: number; length: number } {
    for (let line = 0; line < this.lines.length; line++) {
      const column = this.lines[line].indexOf(`"${needle}"`);
      if (column !== -1) return { line, column, length: needle.length + 2 };
    }
    return { line: 0, column: 0, length: 1 };
  }
}
