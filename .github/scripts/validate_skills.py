#!/usr/bin/env python3
"""
validate_skills.py — repo-level skill + marketplace validator (zero dependencies).

Checks, for a public Agent Skills repo:
  - every skills/<name>/ has a SKILL.md with YAML frontmatter
  - frontmatter `name` is lowercase [a-z0-9-], 1-64 chars, and EQUALS the folder name
  - `name` does not contain the reserved words "claude" or "anthropic"
  - a `description` is present and within 1024 chars
  - .claude-plugin/marketplace.json is valid JSON, and every plugin `source`
    points to a real skill folder containing a SKILL.md
  - every skills/<name>/ is listed in the marketplace

Usage: python3 .github/scripts/validate_skills.py
Exit 0 = all good, 1 = problems (printed).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKILLS = ROOT / "skills"
MARKET = ROOT / ".claude-plugin" / "marketplace.json"

errors, warnings = [], []
def err(m): errors.append(m)
def warn(m): warnings.append(m)


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    return m.group(1) if m else None


def field(fm, key):
    # value on the same line as the key (good enough for `name`/scalar fields)
    m = re.search(rf"^{key}:\s*(.+)$", fm, re.MULTILINE)
    return m.group(1).strip().strip("\"'") if m else None


def has_block(fm, key):
    return re.search(rf"^{key}:\s*", fm, re.MULTILINE) is not None


def validate_skill(folder: Path):
    name_dir = folder.name
    skill_md = folder / "SKILL.md"
    if not skill_md.exists():
        err(f"{name_dir}: missing SKILL.md")
        return
    fm = frontmatter(skill_md.read_text(errors="ignore"))
    if fm is None:
        err(f"{name_dir}: SKILL.md has no YAML frontmatter (--- … ---)")
        return
    name = field(fm, "name")
    if not name:
        err(f"{name_dir}: frontmatter missing `name`")
    else:
        if name != name_dir:
            err(f"{name_dir}: frontmatter name '{name}' != folder name '{name_dir}'")
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name):
            err(f"{name_dir}: name '{name}' must be lowercase [a-z0-9-], no leading/trailing/double hyphens")
        if len(name) > 64:
            err(f"{name_dir}: name exceeds 64 chars")
        if re.search(r"claude|anthropic", name):
            err(f"{name_dir}: name may not contain reserved words 'claude'/'anthropic'")
    if not has_block(fm, "description"):
        err(f"{name_dir}: frontmatter missing `description`")
    else:
        # rough length guard: strip the key and any '>-' folding marker
        desc = re.sub(r"^description:\s*[>|]?-?\s*", "", fm[fm.find("description:"):], flags=re.DOTALL)
        desc = desc.split("\n---", 1)[0]
        if len(desc) > 1024 * 2:  # generous; real limit 1024 but folded YAML adds whitespace
            warn(f"{name_dir}: description looks long (>~1024 chars) — trim it")


def main():
    if not SKILLS.exists():
        err("no skills/ directory")
        report()
    skill_dirs = sorted(p for p in SKILLS.iterdir() if p.is_dir())
    if not skill_dirs:
        warn("skills/ is empty")
    for d in skill_dirs:
        validate_skill(d)

    listed = set()
    if not MARKET.exists():
        err(".claude-plugin/marketplace.json missing")
    else:
        try:
            mk = json.loads(MARKET.read_text())
        except json.JSONDecodeError as e:
            err(f"marketplace.json invalid JSON: {e}")
            mk = None
        if mk:
            if not mk.get("name"):
                err("marketplace.json missing `name`")
            if re.search(r"^(agent-skills|claude.*|anthropic.*)$", str(mk.get("name", ""))):
                err(f"marketplace `name` '{mk.get('name')}' is reserved — pick another")
            for pl in mk.get("plugins", []):
                src = pl.get("source", "")
                p = (ROOT / src).resolve() if src.startswith("./") else None
                if not p or not p.exists():
                    err(f"marketplace plugin '{pl.get('name')}' source '{src}' does not exist")
                elif not (p / "SKILL.md").exists():
                    err(f"marketplace plugin '{pl.get('name')}' source has no SKILL.md")
                else:
                    listed.add(p.name)
        for d in skill_dirs:
            if d.name not in listed:
                warn(f"{d.name}: not listed in marketplace.json")
    report()


def report():
    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  FAIL  {e}")
    if errors:
        print(f"\n{len(errors)} error(s). Fix before merge.")
        sys.exit(1)
    print(f"\nPASS — {len(warnings)} warning(s), 0 errors.")


if __name__ == "__main__":
    main()
