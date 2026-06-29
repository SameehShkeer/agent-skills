<!-- Thanks for contributing a skill or fix! -->

## What this PR does



## If you're adding or changing a skill

- [ ] The skill folder is `skills/<name>/` and `name` in `SKILL.md` **equals the folder name**
- [ ] `description` says **what it does AND when to use it** (≤ 1024 chars)
- [ ] Added/updated the entry in `.claude-plugin/marketplace.json`
- [ ] `python3 .github/scripts/validate_skills.py` passes locally

## Security review (a maintainer will confirm before merge)

- [ ] The `description` matches what the scripts actually do — **no surprises**
- [ ] No undisclosed network calls / external-URL fetches (or they're documented and justified)
- [ ] No access to credentials, `.env`, SSH keys, or paths outside the working dir
- [ ] No `curl … | bash`, no obfuscated/encoded payloads, no destructive commands without confirmation
- [ ] Third-party dependencies (packages, CDN/font URLs) are declared
- [ ] Installs any packages locally, not globally
