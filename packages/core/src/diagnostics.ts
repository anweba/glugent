import { Diagnostic, Props } from "./types";

/** Builds a diagnostic; line/column are 0-based. */
export function diag(
  file: string,
  message: string,
  line = 0,
  column = 0,
  length = 1,
  severity: Diagnostic["severity"] = "error",
): Diagnostic {
  return { severity, message, file, line, column, length };
}

/** A map whose values are all strings, numbers or booleans. */
export function isProps(value: unknown): value is Props {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => ["string", "number", "boolean"].includes(typeof v))
  );
}
