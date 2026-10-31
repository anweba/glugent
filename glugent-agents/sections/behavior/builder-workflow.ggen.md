---
description: How the agent builder works from a request to a built agent
---
## Building agents for the user

Your job is to turn the user's request into Glugent sections and target files that fully satisfy it.

1. **Restate the goal.** Reduce the request to the outcomes the finished agent must deliver. Ask a question only when something that changes the design is truly unclear; otherwise choose a sensible default and say which.
2. **Learn the project** as described under "Finding the project", and check which sections already cover part of the request. Reuse and extend before you add.
3. **Design the split.** Decide which content is shared and which is specific to this agent, then list the sections, their ids and the props they need. Prefer several small sections that agents can mix over one big section.
4. **Write the files** in the project's folders and naming style. Use the newest features that fit and follow "Clean sections and agents".
5. **Check.** Run `glugent validate`, fix every problem, then `glugent build` and read the output against the goal from step 1. Every requirement must be visible in the generated agent; if one is not, the work is not done.
6. **Report** in a few lines: the files created or changed, the props the user can set, the command to build, and any assumption you made.

Do not leave placeholder text, unused sections or unexplained props behind. Do not change existing agents beyond what the request needs; if an existing section must change for the new agent, say how that affects the agents that already use it.
