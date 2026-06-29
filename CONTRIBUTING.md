# Contributing

Thanks for wanting to add to this collection! Skills here are small, self-contained, and held to a consistent bar so the repo stays trustworthy and easy to browse.

## What a skill must look like

Every skill is a folder under [`skills/`](skills/) named in `lower-kebab-case`:

```
skills/<your-skill-name>/
├── SKILL.md            # required
├── README.md           # optional human-facing notes
├── references/         # optional: docs loaded on demand
├── assets/             # optional: templates, fonts, icons
└── scripts/            # optional: executable helpers
```

Start from the [`template/`](template/) scaffold — copy it to `skills/<name>/` and fill it in.

### The `SKILL.md` contract

YAML frontmatter, following the [agentskills.io spec](https://agentskills.io/specification):

| Field | Required | Rule |
|---|---|---|
| `name` | ✅ | lowercase `[a-z0-9-]`, ≤ 64 chars, **must equal the folder name** |
| `description` | ✅ | ≤ 1024 chars; say **what it does AND when to use it** — this is the only thing Claude sees before activating the skill, so front-load the trigger keywords |
| `license` | recommended | e.g. `MIT` |
| `compatibility` | recommended | ≤ 500 chars; declare dependencies (Node/Python/network/Claude Code-only, etc.) |
| `metadata` | recommended | a map for `author` and `version` (e.g. `version: "1.0"`) |

Keep the `SKILL.md` body under ~500 lines; push detail into `references/`. (Why: the whole body enters the model's context when the skill activates and stays there — every line is recurring token cost.)

## Submitting

1. Copy `template/` → `skills/<name>/` and write your skill.
2. Add an entry to [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) (`name`, `source: "./skills/<name>"`, `description`, `version`, `license`).
3. Run the validator locally: `python3 .github/scripts/validate_skills.py`
4. Sign your commits (DCO): `git commit -s` — this adds a `Signed-off-by` line attesting you have the right to contribute the work under this repo's license. (We use the DCO, not a CLA.)
5. Open a PR. The PR template includes a short **security review checklist** a maintainer will confirm before merge.

## The bar for merging

A reviewer will confirm (see the PR template):

- The `description` matches what the scripts actually do — **no surprises**.
- **No undisclosed network calls** or external-URL fetches (or they're documented and justified).
- No access to credentials, `.env`, SSH keys, or paths outside the working directory.
- No `curl … | bash`, no obfuscated/encoded payloads, no destructive commands without confirmation.
- Third-party dependencies (packages, CDN/font URLs) are declared.
- `name` equals the folder name; frontmatter validates.

These checks exist because **other people will download and run your skill**. Thank you for keeping it safe and honest.
