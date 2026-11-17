/**
 * Coverage for scripts/ci/check-core-context-budget.js.
 */

'use strict';

const assert = require('node:assert');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { BUDGETS, measureCoreContext, formatReport } = require('../../scripts/ci/check-core-context-budget');

function fixture(t, { pluginExtra = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-core-budget-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  write('.claude-plugin/plugin.json', JSON.stringify({ name: 'yus', skills: ['./skills/core/alpha'], ...pluginExtra }));
  write('skills/core/alpha/SKILL.md', '---\nname: alpha\ndescription: Twelve chars\n---\n\nBody is not counted.\n');
  write('skills/other/beta/SKILL.md', '---\nname: beta\ndescription: Not listed by the root plugin\n---\n');
  write('commands/run.md', '---\ndescription: Run it\nargument-hint: "[x]"\n---\n');
  write('commands/notes.txt', 'ignored');
  write('agents/helper.md', '---\nname: helper\ndescription: "Helps"\ntools: ["Read"]\n---\n');
  return root;
}

test('the repository stays within its core context budget', () => {
  const result = measureCoreContext();
  assert.ok(result.ok, formatReport(result));
  assert.deepStrictEqual(result.categories.map(c => c.category), ['skills', 'commands', 'agents']);
  for (const category of result.categories) {
    assert.ok(category.count > 0, `${category.category} should not be empty`);
  }
});

test('counts only listed frontmatter fields of root plugin items', t => {
  const root = fixture(t);
  const result = measureCoreContext({ root });
  const by = Object.fromEntries(result.categories.map(c => [c.category, c]));
  assert.strictEqual(by.skills.count, 1, 'department skills are not counted');
  assert.strictEqual(by.skills.chars, 'alpha Twelve chars'.length);
  assert.strictEqual(by.commands.count, 1, 'non-markdown files are ignored');
  assert.strictEqual(by.commands.chars, 'Run it [x]'.length);
  assert.strictEqual(by.agents.chars, 'helper Helps'.length);
  assert.strictEqual(result.total, by.skills.chars + by.commands.chars + by.agents.chars);
  assert.ok(result.ok);
});

test('fails and names the largest items when a category is over budget', t => {
  const root = fixture(t);
  const result = measureCoreContext({ root, budgets: { ...BUDGETS, agents: 5 } });
  assert.strictEqual(result.ok, false);
  const report = formatReport(result);
  assert.match(report, /OVER agents/);
  assert.match(report, /agents[/\\]helper\.md/);
  assert.match(report, /raise\s+the budget/);
});

test('follows explicit command and agent lists in plugin.json', t => {
  const root = fixture(t, { pluginExtra: { commands: ['./commands/run.md'], agents: [] } });
  const by = Object.fromEntries(measureCoreContext({ root }).categories.map(c => [c.category, c]));
  assert.strictEqual(by.commands.count, 1);
  assert.strictEqual(by.agents.count, 0);
});
