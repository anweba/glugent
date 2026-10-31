---
description: The mental model of Glugent
---
{ REF BEGIN common/h2 | HEAD="How Glugent works" }
Glugent builds Markdown files, such as an agent's instructions or a README, from reusable pieces.

- A **section** is a Markdown file ending in `.ggen.md`. It may start with YAML frontmatter (`description`, and `defaults` for props) and contains ordinary Markdown plus Glugent tags.
- A **target** is a small JSON file that lists, in order, which sections to glue together and which props to give them, and names one output file. Its suffix says what it builds: `.agent.ggen.json` for an agent, `.doc.ggen.json` for a document, `.target.ggen.json` for anything else. The three are interchangeable.
- The **config**, `glugent.config.json`, tells Glugent where sections and targets live, supplies project-wide props and sets the output folder.
- **Props** are named values. A section uses them with tags such as `{{NAME}}`, and they are supplied by the layers listed under "Prop precedence".
- **Building** a target renders each section in order with the merged props and writes the result to the target's output file, `<outDir>/<name>.md` unless the target sets `output`.

The config is authoritative: file locations are only the globs it declares, and no folder layout is assumed. The config is found by walking up from the current directory.

Good use of Glugent: write each fact once, in one section, and share that section between targets. Vary behaviour with props and `if` blocks instead of copying a section.
{ REF END common/h2 }
