/** Maps character offsets in a text to 0-based line/column positions. */
export class LineIndex {
  private readonly starts: number[] = [0];

  constructor(private readonly text: string) {
    for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) this.starts.push(i + 1);
  }

  position(offset: number): { line: number; column: number } {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo, column: offset - this.starts[lo] };
  }

  lineOf(offset: number): number {
    return this.position(offset).line;
  }

  /** Offset where the line containing `offset` begins. */
  lineStartOf(offset: number): number {
    return this.starts[this.lineOf(offset)];
  }

  /** Offset where the given line begins. */
  lineStart(line: number): number {
    return this.starts[line];
  }

  /** True when only whitespace precedes `start` on its line and only whitespace follows `end` up to a newline. */
  isAloneOnLine(start: number, end: number): boolean {
    const newline = this.text.indexOf("\n", end);
    return newline !== -1 && this.isBlank(this.lineStartOf(start), start) && this.isBlank(end, newline);
  }

  isBlank(from: number, to: number): boolean {
    return this.text.slice(from, to).trim() === "";
  }
}
