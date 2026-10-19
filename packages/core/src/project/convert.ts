import { FRONTMATTER } from "./section-parser";

/**
 * Turns plain Markdown into a valid section body: every `{` becomes `{{` and
 * every `}` becomes `}}`, so the text renders exactly as written. YAML
 * frontmatter is not part of the template and is left untouched.
 */
export function convertMarkdown(text: string): string {
  const frontmatter = FRONTMATTER.exec(text)?.[0] ?? "";
  return frontmatter + text.slice(frontmatter.length).replace(/[{}]/g, (brace) => brace + brace);
}
