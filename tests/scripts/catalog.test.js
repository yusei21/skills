/**
 * Tests for scripts/catalog.js
 */

const assert = require('node:assert');
const { test } = require('node:test');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'catalog.js');

function run(args = []) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return { code: 0, stdout, stderr: '' };
  } catch (error) {
    return {
      code: error.status || 1,
      stdout: error.stdout || '',
      stderr: error.stderr || '',
    };
  }
}

  test('shows help with no arguments', () => {
    const result = run();
    assert.strictEqual(result.code, 0);
    assert.ok(result.stdout.includes('Discover yus install components and profiles'));
  });

  test('shows help with an explicit help flag', () => {
    const result = run(['--help']);
    assert.strictEqual(result.code, 0);
    assert.ok(result.stdout.includes('Usage:'));
    assert.ok(result.stdout.includes('node scripts/catalog.js show <component-id>'));
  });

  test('lists install profiles', () => {
    const result = run(['profiles']);
    assert.strictEqual(result.code, 0);
    assert.ok(result.stdout.includes('Install profiles'));
    assert.ok(result.stdout.includes('core'));
  });

  test('filters components by family and emits JSON', () => {
    const result = run(['components', '--family', 'language', '--json']);
    assert.strictEqual(result.code, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.ok(Array.isArray(parsed.components));
    assert.ok(parsed.components.length > 0);
    assert.ok(parsed.components.every(component => component.family === 'language'));
    assert.ok(parsed.components.some(component => component.id === 'lang:typescript'));
    assert.ok(parsed.components.every(component => component.id !== 'framework:nextjs'));
  });

  test('shows a resolved component payload', () => {
    const result = run(['show', 'framework:nextjs', '--json']);
    assert.strictEqual(result.code, 0, result.stderr);
    const parsed = JSON.parse(result.stdout);
    assert.strictEqual(parsed.id, 'framework:nextjs');
    assert.strictEqual(parsed.family, 'framework');
    assert.deepStrictEqual(parsed.moduleIds, ['framework-language']);
    assert.ok(Array.isArray(parsed.modules));
    assert.strictEqual(parsed.modules[0].id, 'framework-language');
  });

  test('fails on unknown subcommands', () => {
    const result = run(['bogus']);
    assert.strictEqual(result.code, 1);
    assert.ok(result.stderr.includes('Unknown catalog command'));
  });

  test('fails on unknown component ids', () => {
    const result = run(['show', 'framework:not-real']);
    assert.strictEqual(result.code, 1);
    assert.ok(result.stderr.includes('Unknown install component'));
  });
