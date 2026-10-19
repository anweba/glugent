export const HELP = `glugent - glue Markdown sections into agents

Usage:
  glugent build [agent...] [--set KEY=VALUE]... [--config <path>] [--dry-run]
  glugent validate [--set KEY=VALUE]... [--config <path>]
  glugent list [--config <path>]
  glugent convert <file.md>... [--force] [--dry-run]

convert writes <file>.ggen.md next to each Markdown file, escaping { and } as {{ and }}.
With no agent names, build builds every agent.`;
