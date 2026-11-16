---
name: taste-skill
description: Bootstrap pointer that installs Leonxlnx's taste-skill (design-taste-frontend), the anti-slop frontend skill for company, product and landing sites, from a pinned, reviewable commit. Use when the user wants taste-skill and it is not installed yet; this pointer does not design pages itself.
license: MIT
metadata:
  origin: community
  upstream: https://github.com/Leonxlnx/taste-skill/tree/f6b76575f949707b4e3c37cd86cb44b0b98643e8/skills/taste-skill
  upstream-commit: f6b76575f949707b4e3c37cd86cb44b0b98643e8
---

# taste-skill (pointer)

[taste-skill](https://github.com/Leonxlnx/taste-skill) builds company and product websites with one
design system per site, real photography and product UI, a hero entrance, and a browser-based finish
gate. Installed, it registers as the skill `design-taste-frontend`.

ECC ships this pointer instead of the skill because the skill carries about 37 MB of photos, icons and
scene assets. Installing it is a one-time step the user approves.

## When to Use

- The user asks for taste-skill, "tasteskill", or `design-taste-frontend` and it is not installed.
- A landing page, company or product site should get taste-skill's design system and finish gate.

Skip this pointer when `design-taste-frontend` is already available: use that skill directly.

## How It Works

1. Check whether `${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/design-taste-frontend/SKILL.md` exists. If it does, stop and use it.
2. Tell the user what will be installed (the pinned commit below, about 40 MB, MIT) and ask for a yes.
3. On a yes, run the script below. It clones the pinned commit, copies only `skills/frontend/taste-skill`, and refuses to overwrite an existing install.
4. Tell the user to start a new session so the skill is discovered.

The skill's helper scripts launch a local headless Chrome against `127.0.0.1` and download icon sets
from jsDelivr at pinned versions. Nothing runs at install time.

## Installation

```bash
set -euo pipefail
TASTE_COMMIT=f6b76575f949707b4e3c37cd86cb44b0b98643e8
SKILLS_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"
TARGET="$SKILLS_DIR/design-taste-frontend"
if [ -e "$TARGET" ]; then echo "Already installed: $TARGET"; exit 0; fi
mkdir -p "$SKILLS_DIR"
WORK="$(mktemp -d)"
trap 'rm -rf -- "$WORK"' EXIT
git -C "$WORK" init -q
git -C "$WORK" remote add origin https://github.com/Leonxlnx/taste-skill.git
git -C "$WORK" fetch -q --depth 1 origin "$TASTE_COMMIT"
git -C "$WORK" checkout -q FETCH_HEAD
test "$(git -C "$WORK" rev-parse HEAD)" = "$TASTE_COMMIT"
cp -R "$WORK/skills/taste-skill" "$TARGET"
cp "$WORK/LICENSE" "$TARGET/LICENSE"
echo "Installed design-taste-frontend at $TARGET (commit ${TASTE_COMMIT:0:7})"
```

To update, review the upstream changes since the pinned commit, then change `TASTE_COMMIT` here.

## Examples

- "Use taste-skill to redesign our landing page": install on approval, then run `design-taste-frontend`.
- "Is taste-skill installed?": run step 1 and answer.
