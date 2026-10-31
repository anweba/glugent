import { Placeholder, Props } from "../types";
import { TemplateAnalyzer, TemplateError } from "./analyzer";
import { RefRenderer, TemplateRef, TemplateRenderer } from "./renderer";

export { TemplateError, RefRenderer, TemplateRef };

/** Finds the placeholders and syntax errors in a template body. `lineOffset` shifts reported lines. */
export function scanTemplate(body: string, lineOffset = 0): { placeholders: Placeholder[]; errors: TemplateError[] } {
  return new TemplateAnalyzer(body, lineOffset).analyze();
}

/** Renders a template body with the given prop values. `renderRef` renders `{ REF id }`; without it they are left as written. */
export function renderTemplate(
  body: string,
  values: Props,
  lineOffset = 0,
  renderRef?: RefRenderer,
): { text: string; missing: Placeholder[] } {
  return new TemplateRenderer(body, values, lineOffset, renderRef).render();
}
