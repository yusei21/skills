/**
 * Regression coverage for install/uninstall clarity in README.md.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const RULES_README = path.join(__dirname, '..', '..', 'rules', 'README.md');

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (error) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing install README clarity ===\n');

  let passed = 0;
  let failed = 0;

  const rulesReadme = fs.readFileSync(RULES_README, 'utf8');

  if (test('rules README mirrors yus namespaced install path', () => {
    assert.ok(
      rulesReadme.includes('mkdir -p ~/.claude/rules/yus'),
      'rules README should create the yus-owned user-level rules namespace'
    );
    assert.ok(
      rulesReadme.includes('cp -r rules/common ~/.claude/rules/yus/'),
      'rules README should copy common rules under ~/.claude/rules/yus/'
    );
    assert.ok(
      rulesReadme.includes('cp -r rules/typescript ~/.claude/rules/yus/'),
      'rules README should copy language rules under ~/.claude/rules/yus/'
    );
    assert.ok(
      rulesReadme.includes('mkdir -p .claude/rules/yus'),
      'rules README should document the project-local yus namespace'
    );
    assert.ok(
      !rulesReadme.includes('~/.claude/rules/typescript'),
      'rules README should not recommend flat user-level rule destinations'
    );
  })) passed++; else failed++;

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
