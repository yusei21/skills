/**
 * Tests for scripts/dev/migrate-test-to-node-test.js
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { describe, test } = require('node:test');

const { migrate, MigrationError } = require('../../scripts/dev/migrate-test-to-node-test');

const LEGACY = `/**
 * Tests for something
 */

const assert = require('assert');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(\`  \\u2713 \${name}\`);
    return true;
  } catch (err) {
    console.log(\`  \\u2717 \${name}\`);
    console.log(\`    Error: \${err.message}\`);
    return false;
  }
}

// Test suite
function runTests() {
  console.log('\\n=== Testing something ===\\n');

  let passed = 0;
  let failed = 0;

  console.log('Addition:');

  if (test('adds', () => {
    assert.strictEqual(1 + 1, 2);
  })) passed++;
  else failed++;

  // Subtraction tests
  console.log('\\nSubtraction:');

  if (test('subtracts', () => {
    assert.strictEqual(3 - 1, 2);
  })) passed++; else failed++;

  if (test('one line', () => assert.ok(true))) passed++;
  else failed++;

  // Summary
  console.log('\\n=== Test Results ===');
  console.log(\`Passed: \${passed}\`);
  console.log(\`Failed: \${failed}\`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
`;

function runMigrated(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-codemod-'));
  try {
    const file = path.join(dir, 'sample.test.js');
    fs.writeFileSync(file, source);
    return spawnSync(process.execPath, [file], { encoding: 'utf8' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('migrate', () => {
  test('rewrites the legacy shape into describe/test blocks', () => {
    const out = migrate(LEGACY);
    assert.match(out, /const { describe, test } = require\('node:test'\);/);
    assert.match(out, /require\('node:assert'\)/);
    assert.match(out, /^describe\(sectionTitle\('Addition:'\), \(\) => \{$/m);
    assert.match(out, /^\/\/ Subtraction tests\ndescribe\(sectionTitle\('\\nSubtraction:'\), \(\) => \{$/m);
    assert.match(out, /^ {2}test\('one line', \(\) => assert\.ok\(true\)\);$/m);
    for (const gone of ['function test(name, fn)', 'runTests', 'passed++', 'failed++', 'process.exit', '// Summary', 'Test Results']) {
      assert.ok(!out.includes(gone), `${gone} should be removed`);
    }
  });

  test('the migrated file runs under node:test with the same tests', () => {
    const result = runMigrated(migrate(LEGACY));
    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^\u2139 pass 3$/m);
    assert.match(result.stdout, /^\u2139 fail 0$/m);
    assert.match(result.stdout, /Subtraction/);
  });

  test('a failing assertion still fails the migrated file', () => {
    const result = runMigrated(migrate(LEGACY.replace('3 - 1, 2', '3 - 1, 5')));
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stdout, /^\u2139 fail 1$/m);
  });

  test('a one-line Results summary is dropped too', () => {
    const source = LEGACY.replace(/ {2}\/\/ Summary[\s\S]*?(?=\n {2}process\.exit)/, '  console.log(`\\nResults: Passed: ${passed}, Failed: ${failed}`);');
    const out = migrate(source);
    assert.ok(!out.includes('Results:'));
    assert.strictEqual(runMigrated(out).status, 0);
  });

  test('a file without section headers imports only test()', () => {
    const source = LEGACY.replace("  console.log('Addition:');\n", '').replace("  console.log('\\nSubtraction:');\n", '');
    const out = migrate(source);
    assert.match(out, /^const { test } = require\('node:test'\);$/m);
    assert.ok(!out.includes('describe'), 'no describe import or call');
    assert.ok(!out.includes('sectionTitle'), 'no unused section helper');
    const result = runMigrated(out);
    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^\u2139 pass 3$/m);
  });

  const refusals = [
    ['an async helper', LEGACY.replace('    fn();', '    await fn();'), /no synchronous/],
    ['statements between tests', LEGACY.replace("  console.log('Addition:');", "  const shared = 1;\n  console.log('Addition:');"), /unsupported statement/],
    ['a file without runTests()', LEGACY.replace(/\nrunTests\(\);\n$/, '\n'), /runTests\(\);/],
    ['a file already on node:test', `const { test } = require('node:test');\n${LEGACY}`, /already uses node:test/]
  ];
  for (const [name, source, reason] of refusals) {
    test(`refuses ${name}`, () => {
      assert.throws(() => migrate(source), error => error instanceof MigrationError && reason.test(error.message));
    });
  }
});
