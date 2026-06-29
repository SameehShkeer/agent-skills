# Security Policy

## ⚠️ Read this before installing any skill

Skills in this repo are **not passive documents**. They contain instructions **and executable scripts** that an AI agent (Claude) will run on **your** machine, with **your** user privileges and access. Treat installing a skill exactly like installing software from the internet.

- **Review before you run.** Read the `SKILL.md` and every bundled script, template, and resource before installing. Watch for: unexpected network calls or external-URL fetches, file access outside the working directory, reading credentials / `.env` / SSH keys, `curl … | bash`, obfuscated payloads, or anything that doesn't match the skill's stated purpose.
- **Run at your own risk.** These skills are provided **as is**, with no warranty (see [LICENSE](LICENSE)). You are responsible for what runs on your system.
- **Prefer isolation.** Run unfamiliar skills in a container, VM, or sandbox, and grant the agent the least privilege needed for the task.
- **External dependencies drift.** Even a trustworthy skill can change behavior if a dependency it fetches (a CDN script, a package) changes upstream. Pin versions where you can.

This mirrors [Anthropic's own guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview): use skills only from trusted sources, and audit anything from an unknown source before use.

## Reporting a vulnerability

Please report security issues **privately** — do **not** open a public issue.

- Use GitHub's **private vulnerability reporting**: the repo's **Security** tab → **"Report a vulnerability."**
- Or email **s.shkeer@gmail.com** with `SECURITY` in the subject.

Please include: the affected skill, a description, reproduction steps, the impact, and any suggested fix.

## Our commitments

- This is a small, maintainer-run project — we'll acknowledge reports on a **best-effort** basis, as fast as we reasonably can.
- We coordinate a fix and disclose publicly only **after a patch is available** (coordinated disclosure), and we'll credit reporters who want credit.

## Scope

**In scope:** skills/scripts in this repo that could harm a user who installs and runs them (data exfiltration, destructive commands, prompt-injection traps, malicious external fetches).

**Out of scope:** vulnerabilities in Claude or Claude Code itself (report those to [Anthropic](https://platform.claude.com)), and issues that require the user to ignore the warnings above.
