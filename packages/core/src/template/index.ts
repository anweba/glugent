import { Placeholder, Props, SlotDef } from "../types";
import { TemplateAnalyzer, TemplateError } from "./analyzer";
import { MissingSlot, RefRenderer, RenderOptions, TemplateFill, TemplatePosition, TemplateRef, TemplateRenderer } from "./renderer";

export { TemplateError, MissingSlot, RefRenderer, RenderOptions, TemplateFill, TemplatePosition, TemplateRef };
export { DEFAULT_SLOT } from "./grammar";

/** Finds the placeholders, slots and syntax errors in a template body. `lineOffset` shifts reported lines. */
export function scanTemplate(body: string, lineOffset = 0): { placeholders: Placeholder[]; slots: SlotDef[]; errors: TemplateError[] } {
  return new TemplateAnalyzer(body, lineOffset).analyze();
}

/**
 * Renders a template body with the given prop values. The third argument is the
 * `lineOffset`, or options that also say how to render `{ REF id }` and what fills the slots.
 */
export function renderTemplate(
  body: string,
  values: Props,
  options: number | RenderOptions = 0,
): { text: string; missing: Placeholder[]; missingSlots: MissingSlot[] } {
  return new TemplateRenderer(body, values, typeof options === "number" ? { lineOffset: options } : options).render();
}
