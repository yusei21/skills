#!/usr/bin/env node
/**
 * Keep the fixed context of the root `yus` plugin within a budget.
 *
 * Every session with the `yus` plugin installed reads the name and description
 * of each skill it lists, each command under commands/ and each agent under
 * agents/, whether or not any of them is used. This check sums that text per
 * category and fails when a category grows past its budget, so a new or
 * longer description cannot quietly raise the cost of every session.
 *
 * Characters, not tokens: the count is exact and needs no tokenizer. Four
 * characters are roughly one token.
 *
 * The budgets sit about 5% above the measured baseline. Lower a budget when
 * text shrinks; raise one only on purpose and say why in the commit message.
 * Department plugins (`yus-<department>`) are not counted: users opt into them.
 *
 * Idea from the model-surface size budget in deepseek-ai/dsh-superagent-prototype.
 *
 * Usage:
 *   node scripts/ci/check-core-context-budget.js          # check (CI)
 *   node scripts/ci/check-core-context-budget.js --report # also list the largest items
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '../..');

/** Characters per category. Baseline on 2026-11-16: 6154 / 14731 / 15986. */
const BUDGETS = Object.freeze({ skills: 6500, commands: 15600, agents: 16800 });

/** Frontmatter fields the host shows in its listings, per category. */
const FIELDS = Object.freeze({
  skills: ['name', 'description', 'when_to_use'],
  commands: ['description', 'argument-hint'],
  agents: ['name', 'description'],
});

function readFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = yaml.load(match[1]);
  return data && typeof data === 'object' ? data : {};
}

function listedText(filePath, fields) {
  const data = readFrontmatter(filePath);
  return fields
    .map(field => data[field])
    .filter(value => value !== undefined && value !== null && value !== '')
    .map(String)
    .join(' ');
}

function markdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => name.endsWith('.md'))
    .sort()
    .map(name => path.join(dir, name));
}

/**
 * Files the root plugin loads into every session, by category.
 * @param {string} root - Repository root
 */
function coreSurfaceFiles(root) {
  const plugin = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin/plugin.json'), 'utf8'));
  const skills = (plugin.skills || []).map(dir => path.join(root, dir, 'SKILL.md'));
  // Without an explicit "agents" or "commands" list the host loads the default directories.
  const commandDirs = Array.isArray(plugin.commands) ? plugin.commands : ['./commands/'];
  const agentDirs = Array.isArray(plugin.agents) ? plugin.agents : ['./agents/'];
  const expand = entries => entries.flatMap(entry => {
    const resolved = path.join(root, entry);
    return entry.endsWith('.md') ? [resolved] : markdownFiles(resolved);
  });
  return { skills, commands: expand(commandDirs), agents: expand(agentDirs) };
}

/**
 * Measure the root plugin and compare each category with its budget.
 * @param {{ root?: string, budgets?: Record<string, number> }} [options]
 */
function measureCoreContext(options = {}) {
  const root = options.root || ROOT;
  const budgets = options.budgets || BUDGETS;
  const files = coreSurfaceFiles(root);
  const categories = Object.keys(FIELDS).map(category => {
    const items = files[category].map(filePath => ({
      file: path.relative(root, filePath),
      chars: listedText(filePath, FIELDS[category]).length,
    }));
    const chars = items.reduce((total, item) => total + item.chars, 0);
    const budget = budgets[category];
    return { category, count: items.length, chars, budget, over: chars > budget, items };
  });
  const total = categories.reduce((sum, category) => sum + category.chars, 0);
  return { categories, total, ok: categories.every(category => !category.over) };
}

function formatReport(result, { details = false } = {}) {
  const lines = ['Core plugin fixed context (characters, ~4 per token):'];
  for (const { category, count, chars, budget, over, items } of result.categories) {
    lines.push(`  ${over ? 'OVER' : 'ok  '} ${category.padEnd(8)} ${String(count).padStart(3)} items  ${chars} / ${budget}`);
    if (details || over) {
      for (const item of [...items].sort((a, b) => b.chars - a.chars).slice(0, 5)) {
        lines.push(`         ${String(item.chars).padStart(5)}  ${item.file}`);
      }
    }
  }
  lines.push(`  total ${result.total} characters, about ${Math.round(result.total / 4)} tokens`);
  if (!result.ok) {
    lines.push('', 'Shorten the descriptions above, move the item to a department plugin, or raise',
      'the budget in scripts/ci/check-core-context-budget.js and say why in the commit message.');
  }
  return lines.join('\n');
}

if (require.main === module) {
  const result = measureCoreContext();
  const report = formatReport(result, { details: process.argv.includes('--report') });
  if (result.ok) {
    console.log(report);
  } else {
    console.error(report);
    process.exitCode = 1;
  }
}

module.exports = { BUDGETS, FIELDS, coreSurfaceFiles, measureCoreContext, formatReport };
