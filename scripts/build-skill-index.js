#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const skillsRoot = path.join(repoRoot, 'skills');
const indexPath = path.join(repoRoot, '.skill-index', 'skills.json');

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.length >= 2 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

function parseFrontmatter(text, filePath) {
  if (!text.startsWith('---\n')) {
    throw new Error(`${filePath}: missing YAML frontmatter`);
  }

  const end = text.indexOf('\n---', 4);
  if (end === -1) {
    throw new Error(`${filePath}: unterminated YAML frontmatter`);
  }

  const lines = text.slice(4, end).split(/\r?\n/);
  const values = {};

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (!match) continue;

    const key = match[1];
    const raw = (match[2] || '').trim();

    if (raw === '>' || raw === '>-' || raw === '|' || raw === '|-') {
      const block = [];
      for (i += 1; i < lines.length; i += 1) {
        const next = lines[i];
        if (!/^\s+/.test(next)) {
          i -= 1;
          break;
        }
        block.push(next.trim());
      }
      values[key] = raw.startsWith('>') ? block.join(' ').trim() : block.join('\n').trim();
      continue;
    }

    values[key] = unquote(raw);
  }

  if (!values.name) {
    throw new Error(`${filePath}: frontmatter is missing name`);
  }
  if (!values.description) {
    throw new Error(`${filePath}: frontmatter is missing description`);
  }

  return {
    name: values.name,
    description: values.description,
  };
}

function buildIndex() {
  const skills = [];
  const seenNames = new Set();

  const entries = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const relativePath = path.posix.join('skills', entry.name, 'SKILL.md');
    const absolutePath = path.join(skillsRoot, entry.name, 'SKILL.md');
    if (!fs.existsSync(absolutePath)) continue;

    const parsed = parseFrontmatter(fs.readFileSync(absolutePath, 'utf8'), relativePath);
    if (seenNames.has(parsed.name)) {
      throw new Error(`duplicate skill name: ${parsed.name}`);
    }
    seenNames.add(parsed.name);

    skills.push({
      name: parsed.name,
      path: relativePath,
      description: parsed.description,
    });
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  return {
    version: 1,
    count: skills.length,
    skills,
  };
}

function serialize(index) {
  return `${JSON.stringify(index, null, 2)}\n`;
}

function main() {
  const check = process.argv.includes('--check');
  const generated = serialize(buildIndex());

  if (check) {
    const current = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
    if (current !== generated) {
      console.error('.skill-index/skills.json is stale. Run: node scripts/build-skill-index.js');
      process.exit(1);
    }
    console.log('Skill index is up to date.');
    return;
  }

  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, generated, 'utf8');
  console.log(`Wrote ${path.relative(repoRoot, indexPath)} with ${JSON.parse(generated).count} skills.`);
}

main();
