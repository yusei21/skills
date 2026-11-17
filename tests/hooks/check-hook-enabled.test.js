/**
 * Tests for scripts/hooks/check-hook-enabled.js
 *
 * Tests the CLI wrapper around isHookEnabled.
 *
 * Run with: node tests/hooks/check-hook-enabled.test.js
 */

const assert = require('node:assert');
const { describe, test } = require('node:test');
const path = require('path');
const { spawnSync } = require('child_process');

const script = path.join(__dirname, '..', '..', 'scripts', 'hooks', 'check-hook-enabled.js');

function runScript(args = [], envOverrides = {}) {
  const env = { ...process.env, ...envOverrides };
  // Remove potentially interfering env vars unless explicitly set
  if (!envOverrides.YUS_HOOK_PROFILE) delete env.YUS_HOOK_PROFILE;
  if (!envOverrides.YUS_DISABLED_HOOKS) delete env.YUS_DISABLED_HOOKS;

  const result = spawnSync('node', [script, ...args], {
    encoding: 'utf8',
    timeout: 10000,
    env,
  });
  return {
    code: result.status || 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

/** Turn a legacy `console.log` section header into a describe() title. */
const sectionTitle = title => String(title).trim().replace(/:$/, '');

describe(sectionTitle('No arguments:'), () => {
  test('returns yes when no hookId provided', () => {
    const result = runScript([]);
    assert.strictEqual(result.stdout, 'yes');
  });
});

describe(sectionTitle('\nDefault profile (standard):'), () => {
  test('returns yes for hook with default profiles', () => {
    const result = runScript(['my-hook']);
    assert.strictEqual(result.stdout, 'yes');
  });

  test('returns yes for hook with standard,strict profiles', () => {
    const result = runScript(['my-hook', 'standard,strict']);
    assert.strictEqual(result.stdout, 'yes');
  });

  test('returns no for hook with only strict profile', () => {
    const result = runScript(['my-hook', 'strict']);
    assert.strictEqual(result.stdout, 'no');
  });

  test('returns no for hook with only minimal profile', () => {
    const result = runScript(['my-hook', 'minimal']);
    assert.strictEqual(result.stdout, 'no');
  });
});

describe(sectionTitle('\nDisabled hooks:'), () => {
  test('returns no when hook is disabled via env', () => {
    const result = runScript(['my-hook'], { YUS_DISABLED_HOOKS: 'my-hook' });
    assert.strictEqual(result.stdout, 'no');
  });

  test('returns yes when different hook is disabled', () => {
    const result = runScript(['my-hook'], { YUS_DISABLED_HOOKS: 'other-hook' });
    assert.strictEqual(result.stdout, 'yes');
  });
});

describe(sectionTitle('\nProfile overrides:'), () => {
  test('returns yes for strict profile with strict-only hook', () => {
    const result = runScript(['my-hook', 'strict'], { YUS_HOOK_PROFILE: 'strict' });
    assert.strictEqual(result.stdout, 'yes');
  });

  test('returns yes for minimal profile with minimal-only hook', () => {
    const result = runScript(['my-hook', 'minimal'], { YUS_HOOK_PROFILE: 'minimal' });
    assert.strictEqual(result.stdout, 'yes');
  });
});
