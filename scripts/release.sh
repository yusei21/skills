#!/usr/bin/env bash
set -euo pipefail

# Release script for bumping plugin version
# Usage: ./scripts/release.sh VERSION

VERSION="${1:-}"
ROOT_PACKAGE_JSON="package.json"
PACKAGE_LOCK_JSON="package-lock.json"
ROOT_AGENTS_MD="AGENTS.md"
AGENT_YAML="agent.yaml"
VERSION_FILE="VERSION"
PLUGIN_JSON=".claude-plugin/plugin.json"
MARKETPLACE_JSON=".claude-plugin/marketplace.json"
CODEX_MARKETPLACE_JSON=".agents/plugins/marketplace.json"
CODEX_PLUGIN_JSON=".codex-plugin/plugin.json"
QODER_PLUGIN_JSON=".qoder-plugin/plugin.json"
CODEX_MARKETPLACE_PLUGIN_JSON="plugins/ecc/.codex-plugin/plugin.json"
OPENCODE_PACKAGE_JSON=".opencode/package.json"
OPENCODE_PACKAGE_LOCK_JSON=".opencode/package-lock.json"
OPENCODE_ECC_HOOKS_PLUGIN=".opencode/plugins/ecc-hooks.ts"
SELECTIVE_INSTALL_ARCHITECTURE_DOC="docs/SELECTIVE-INSTALL-ARCHITECTURE.md"

# Function to show usage
usage() {
  echo "Usage: $0 VERSION"
  echo "Example: $0 1.5.0"
  exit 1
}

# Validate VERSION is provided
if [[ -z "$VERSION" ]]; then
  echo "Error: VERSION argument is required"
  usage
fi

# Validate VERSION is semver format (X.Y.Z or X.Y.Z-prerelease)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Error: VERSION must be in semver format (e.g., 1.5.0 or 2.0.0-rc.1)"
  exit 1
fi

# Check current branch is main
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: Must be on main branch (currently on $CURRENT_BRANCH)"
  exit 1
fi

# Check working tree is clean, including untracked files
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo "Error: Working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Verify versioned manifests exist
for FILE in "$ROOT_PACKAGE_JSON" "$PACKAGE_LOCK_JSON" "$ROOT_AGENTS_MD" "$AGENT_YAML" "$VERSION_FILE" "$PLUGIN_JSON" "$MARKETPLACE_JSON" "$CODEX_MARKETPLACE_JSON" "$CODEX_PLUGIN_JSON" "$QODER_PLUGIN_JSON" "$OPENCODE_PACKAGE_JSON" "$OPENCODE_PACKAGE_LOCK_JSON" "$OPENCODE_ECC_HOOKS_PLUGIN" "$SELECTIVE_INSTALL_ARCHITECTURE_DOC"; do
  if [[ ! -f "$FILE" ]]; then
    echo "Error: $FILE not found"
    exit 1
  fi
done

# Read current version from plugin.json
OLD_VERSION=$(grep -oE '"version": *"[^"]*"' "$PLUGIN_JSON" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?')
if [[ -z "$OLD_VERSION" ]]; then
  echo "Error: Could not extract current version from $PLUGIN_JSON"
  exit 1
fi

if [[ "$OLD_VERSION" == "$VERSION" ]]; then
  echo "Error: Version $VERSION is already declared in release metadata."
  echo "After the merged commit passes CI, publish it through the tag workflow:"
  echo "  git tag -s \"v$VERSION\" -m \"Release v$VERSION\""
  echo "  git push origin \"v$VERSION\""
  exit 1
fi

echo "Bumping version: $OLD_VERSION -> $VERSION"

update_version() {
  local file="$1"
  local pattern="$2"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

update_package_lock_version() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const version = process.argv[2];
    const lock = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!lock || typeof lock !== "object") {
      console.error(`Error: ${file} does not contain a JSON object`);
      process.exit(1);
    }
    lock.version = version;
    if (!lock.packages || typeof lock.packages !== "object" || Array.isArray(lock.packages)) {
      console.error(`Error: ${file} is missing lock.packages`);
      process.exit(1);
    }
    if (!lock.packages[""] || typeof lock.packages[""] !== "object" || Array.isArray(lock.packages[""])) {
      console.error(`Error: ${file} is missing lock.packages[\"\"]`);
      process.exit(1);
    }
    lock.packages[""].version = version;
    fs.writeFileSync(file, `${JSON.stringify(lock, null, 2)}\n`);
  ' "$1" "$VERSION"
}

update_marketplace_plugin_version() {
  local file="$1"
  # Was `sed "0,/re/s|..."`, which is a GNU extension. BSD sed on macOS ignores
  # it and still exits 0, so the bump silently no-opped here and only surfaced
  # later as a plugin-manifest test failure. Node replaces the first match on
  # every platform and fails loudly.
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const version = process.argv[2];
    const current = fs.readFileSync(file, "utf8");
    const updated = current.replace(
      /"version": *"[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?"/,
      `"version": "${version}"`
    );
    if (updated === current) {
      console.error(`Error: could not update plugin version in ${file}`);
      process.exit(1);
    }
    fs.writeFileSync(file, updated);
  ' "$file" "$VERSION"
}

update_selective_install_repo_version() {
  local file="$1"
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const version = process.argv[2];
    const current = fs.readFileSync(file, "utf8");
    const updated = current.replace(
      /("repoVersion":\s*")[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(")/,
      `$1${version}$2`
    );
    if (updated === current) {
      console.error(`Error: could not update repoVersion example in ${file}`);
      process.exit(1);
    }
    fs.writeFileSync(file, updated);
  ' "$file" "$VERSION"
}

update_agents_version() {
  local file="$1"
  local label="$2"
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const version = process.argv[2];
    const label = process.argv[3];
    const current = fs.readFileSync(file, "utf8");
    const updated = current.replace(
      new RegExp(`^\\*\\*${label}:\\*\\* [0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?$`, "m"),
      `**${label}:** ${version}`
    );
    if (updated === current) {
      console.error(`Error: could not update AGENTS version line in ${file}`);
      process.exit(1);
    }
    fs.writeFileSync(file, updated);
  ' "$file" "$VERSION" "$label"
}

update_agent_yaml_version() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const version = process.argv[2];
    const current = fs.readFileSync(file, "utf8");
    const updated = current.replace(
      /^version:\s*[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/m,
      `version: ${version}`
    );
    if (updated === current) {
      console.error(`Error: could not update agent.yaml version line in ${file}`);
      process.exit(1);
    }
    fs.writeFileSync(file, updated);
  ' "$AGENT_YAML" "$VERSION"
}

update_version_file() {
  printf '%s\n' "$VERSION" > "$VERSION_FILE"
}

update_codex_marketplace_version() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const version = process.argv[2];
    const marketplace = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!marketplace || typeof marketplace !== "object" || !Array.isArray(marketplace.plugins)) {
      console.error(`Error: ${file} does not contain a marketplace plugins array`);
      process.exit(1);
    }
    const plugin = marketplace.plugins.find(entry => entry && entry.name === "ecc");
    if (!plugin || typeof plugin !== "object") {
      console.error(`Error: could not find ecc plugin entry in ${file}`);
      process.exit(1);
    }
    plugin.version = version;
    fs.writeFileSync(file, `${JSON.stringify(marketplace, null, 2)}\n`);
  ' "$CODEX_MARKETPLACE_JSON" "$VERSION"
}

update_opencode_hook_banner_version() {
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const version = process.argv[2];
    const current = fs.readFileSync(file, "utf8");
    const updated = current.replace(
      /(## Active Plugin: (?:Everything Claude Code|ECC) v)[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?/,
      `$1${version}`
    );
    if (updated === current) {
      console.error(`Error: could not update OpenCode hook banner version in ${file}`);
      process.exit(1);
    }
    fs.writeFileSync(file, updated);
  ' "$OPENCODE_ECC_HOOKS_PLUGIN" "$VERSION"
}

# Update all shipped package/plugin manifests
update_version "$ROOT_PACKAGE_JSON" "s|\"version\": *\"[^\"]*\"|\"version\": \"$VERSION\"|"
update_package_lock_version "$PACKAGE_LOCK_JSON"
update_agents_version "$ROOT_AGENTS_MD" "Version"
update_agent_yaml_version
update_version_file
update_version "$PLUGIN_JSON" "s|\"version\": *\"[^\"]*\"|\"version\": \"$VERSION\"|"
update_marketplace_plugin_version "$MARKETPLACE_JSON"
update_codex_marketplace_version
update_version "$CODEX_PLUGIN_JSON" "s|\"version\": *\"[^\"]*\"|\"version\": \"$VERSION\"|"
update_version "$QODER_PLUGIN_JSON" "s|\"version\": *\"[^\"]*\"|\"version\": \"$VERSION\"|"
update_version "$CODEX_MARKETPLACE_PLUGIN_JSON" "s|\"version\": *\"[^\"]*\"|\"version\": \"$VERSION\"|"
update_version "$OPENCODE_PACKAGE_JSON" "s|\"version\": *\"[^\"]*\"|\"version\": \"$VERSION\"|"
update_package_lock_version "$OPENCODE_PACKAGE_LOCK_JSON"
update_opencode_hook_banner_version
update_selective_install_repo_version "$SELECTIVE_INSTALL_ARCHITECTURE_DOC"

# Verify the bumped release surface is still internally consistent before
# writing a release commit, tag, or push.
echo "Verifying OpenCode build and npm pack payload..."
node scripts/build-opencode.js
node tests/scripts/build-opencode.test.js
node tests/plugin-manifest.test.js

# Stage, commit, explicitly sign an annotated tag, and push. Signing failure
# stops here under set -e; no personal tag.gpgSign default is assumed.
git add "$ROOT_PACKAGE_JSON" "$PACKAGE_LOCK_JSON" "$ROOT_AGENTS_MD" "$AGENT_YAML" "$VERSION_FILE" "$PLUGIN_JSON" "$MARKETPLACE_JSON" "$CODEX_MARKETPLACE_JSON" "$CODEX_PLUGIN_JSON" "$QODER_PLUGIN_JSON" "$CODEX_MARKETPLACE_PLUGIN_JSON" "$OPENCODE_PACKAGE_JSON" "$OPENCODE_PACKAGE_LOCK_JSON" "$OPENCODE_ECC_HOOKS_PLUGIN" "$SELECTIVE_INSTALL_ARCHITECTURE_DOC"
git commit -m "chore: bump plugin version to $VERSION"
git tag -s "v$VERSION" -m "Release v$VERSION"
git push origin main "v$VERSION"

echo "Released v$VERSION"
