---
name: my-skill-name
description: >-
  ONE-LINE on what this skill produces, then WHEN to use it with concrete trigger
  phrases — this text is the only thing Claude sees before activating the skill,
  so front-load the keywords. e.g. "Generates X from Y. Use when the user wants …,
  says '…', or asks to …. Do NOT use when …."
license: MIT
compatibility: >-
  Declare dependencies and where it runs (e.g. "Claude Code only; needs Node 20+
  and puppeteer; no external services"). Keep ≤ 500 chars.
metadata:
  author: your-handle
  version: "1.0"
---

# My Skill Name

A one-paragraph overview: what the skill does and the shape of its output.

## Workflow

Write the steps Claude should follow. Use imperative instructions and explain the
*why* behind each one — capable models follow reasoning better than rigid rules.

### 1. ...
### 2. ...

## What "good" looks like

Bullet the qualities of a great result so the model can self-check.

<!--
  Optional bundled resources (delete what you don't use):
    references/   docs loaded on demand (keep SKILL.md lean; point here for detail)
    assets/       templates, fonts, icons used in the output
    scripts/      executable helpers (more reliable + token-saving than regenerating code)
  Keep this SKILL.md under ~500 lines.
-->
