/**
 * Tests for scripts/lib/hook-flags.js
 *
 * Run with: node tests/hooks/hook-flags.test.js
 */

const assert = require('node:assert');
const { describe, test } = require('node:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// Import the module
const {
  VALID_PROFILES,
  normalizeId,
  parseBoolean,
  readManagedHookConfig,
  areHooksEnabled,
  getHookProfile,
  getDisabledHookIds,
  parseProfiles,
  isHookEnabled,
} = require('../../scripts/lib/hook-flags');

// Helper to save and restore env vars
function withEnv(vars, fn) {
  const saved = {};
  for (const key of Object.keys(vars)) {
    saved[key] = process.env[key];
    if (vars[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = vars[key];
    }
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  }
}

/** Turn a legacy `console.log` section header into a describe() title. */
const sectionTitle = title => String(title).trim().replace(/:$/, '');

// VALID_PROFILES tests
describe(sectionTitle('VALID_PROFILES:'), () => {
  test('is a Set', () => {
    assert.ok(VALID_PROFILES instanceof Set);
  });

  test('contains minimal, standard, strict', () => {
    assert.ok(VALID_PROFILES.has('minimal'));
    assert.ok(VALID_PROFILES.has('standard'));
    assert.ok(VALID_PROFILES.has('strict'));
  });

  test('contains exactly 3 profiles', () => {
    assert.strictEqual(VALID_PROFILES.size, 3);
  });
});

describe(sectionTitle('\nHook preference sources:'), () => {
  test('hooks default enabled when no preference source exists', () => {
    withEnv({
      YUS_HOOKS_ENABLED: undefined,
      CLAUDE_PLUGIN_OPTION_HOOKS_ENABLED: undefined,
      YUS_HOOK_CONFIG: undefined,
      CLAUDE_PLUGIN_ROOT: undefined,
      YUS_PLUGIN_ROOT: undefined,
    }, () => {
      assert.strictEqual(areHooksEnabled(), true);
    });
  });

  test('Claude plugin options control enabled state and profile', () => {
    withEnv({
      YUS_HOOKS_ENABLED: undefined,
      YUS_HOOK_PROFILE: undefined,
      CLAUDE_PLUGIN_OPTION_HOOKS_ENABLED: 'false',
      CLAUDE_PLUGIN_OPTION_HOOK_PROFILE: 'minimal',
      YUS_HOOK_CONFIG: undefined,
    }, () => {
      assert.strictEqual(areHooksEnabled(), false);
      assert.strictEqual(getHookProfile(), 'minimal');
      assert.strictEqual(
        isHookEnabled('pre:test', { profiles: 'minimal,standard,strict' }),
        false
      );
    });
  });

  test('explicit yus environment overrides Claude plugin options', () => {
    withEnv({
      YUS_HOOKS_ENABLED: 'true',
      YUS_HOOK_PROFILE: 'strict',
      CLAUDE_PLUGIN_OPTION_HOOKS_ENABLED: 'false',
      CLAUDE_PLUGIN_OPTION_HOOK_PROFILE: 'minimal',
    }, () => {
      assert.strictEqual(areHooksEnabled(), true);
      assert.strictEqual(getHookProfile(), 'strict');
    });
    assert.strictEqual(
      getHookProfile({
        YUS_HOOK_PROFILE: '',
        CLAUDE_PLUGIN_OPTION_HOOK_PROFILE: 'minimal',
      }),
      'standard',
      'an explicit empty yus profile must not fall through to plugin config'
    );
  });

  test('managed hook config is used after explicit and plugin preferences', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-hook-flags-'));
    const configPath = path.join(root, 'yus', 'setup.json');
    try {
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify({
        hooks: { enabled: false, profile: 'minimal' },
      }));
      withEnv({
        YUS_HOOKS_ENABLED: undefined,
        YUS_HOOK_PROFILE: undefined,
        CLAUDE_PLUGIN_OPTION_HOOKS_ENABLED: undefined,
        CLAUDE_PLUGIN_OPTION_HOOK_PROFILE: undefined,
        YUS_HOOK_CONFIG: configPath,
      }, () => {
        assert.deepStrictEqual(readManagedHookConfig(), {
          enabled: false,
          profile: 'minimal',
        });
        assert.strictEqual(areHooksEnabled(), false);
        assert.strictEqual(getHookProfile(), 'minimal');
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('managed hook config accepts a leading UTF-8 BOM', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-hook-flags-bom-'));
    const configPath = path.join(root, 'setup.json');
    const env = { YUS_HOOK_CONFIG: configPath };
    try {
      fs.writeFileSync(configPath, '\uFEFF' + JSON.stringify({
        hooks: { enabled: false, profile: 'minimal', note: 'keep\uFEFFinside' },
      }));
      assert.strictEqual(areHooksEnabled(env), false);
      assert.strictEqual(getHookProfile(env), 'minimal');
      assert.strictEqual(readManagedHookConfig(env).note, 'keep\uFEFFinside');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('a hook evaluation reads managed config only once', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-hook-flags-read-once-'));
    const configPath = path.join(root, 'setup.json');
    const originalReadFileSync = fs.readFileSync;
    let configReadCount = 0;
    try {
      fs.writeFileSync(configPath, JSON.stringify({
        hooks: { enabled: true, profile: 'minimal' },
      }));
      fs.readFileSync = (...args) => {
        if (args[0] === configPath) configReadCount += 1;
        return originalReadFileSync(...args);
      };
      assert.strictEqual(isHookEnabled('pre:test', {
        env: { YUS_HOOK_CONFIG: configPath },
        profiles: ['minimal'],
      }), true);
      assert.strictEqual(configReadCount, 1);
    } finally {
      fs.readFileSync = originalReadFileSync;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('malformed managed config emits one sanitized diagnostic', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-hook-flags-invalid-'));
    const configPath = path.join(root, 'setup.json');
    const originalWrite = process.stderr.write;
    const diagnostics = [];
    try {
      fs.writeFileSync(configPath, '{"hooks":\u001b[31m');
      process.stderr.write = value => {
        diagnostics.push(String(value));
        return true;
      };
      assert.deepStrictEqual(readManagedHookConfig({ YUS_HOOK_CONFIG: configPath }), {});
      assert.strictEqual(diagnostics.length, 1);
      assert.match(diagnostics[0], /Warning: unable to read managed yus hook config/);
      assert.strictEqual(diagnostics[0].includes('\u001b'), false);
      assert.match(diagnostics[0], /setup\.json/);
    } finally {
      process.stderr.write = originalWrite;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('boolean parsing recognizes supported values and uses its fallback', () => {
    for (const value of ['1', 'true', 'yes', 'on']) {
      assert.strictEqual(parseBoolean(value, false), true);
    }
    for (const value of ['0', 'false', 'no', 'off']) {
      assert.strictEqual(parseBoolean(value, true), false);
    }
    assert.strictEqual(parseBoolean('invalid', false), false);
  });

  test('run-with-flags suppresses wrapper hooks when plugin hooks are off', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-hook-wrapper-'));
    const markerPath = path.join(root, 'ran.txt');
    const hookPath = path.join(root, 'marker.js');
    const runner = path.join(__dirname, '..', '..', 'scripts', 'hooks', 'run-with-flags.js');
    const raw = JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Write' });
    try {
      fs.writeFileSync(
        hookPath,
        `'use strict';\nconst fs=require('fs');\nmodule.exports.run=function(raw){fs.writeFileSync(${JSON.stringify(markerPath)},'ran');return raw;};\n`
      );
      const env = {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: root,
        CLAUDE_PLUGIN_OPTION_HOOKS_ENABLED: 'false',
      };
      delete env.YUS_HOOKS_ENABLED;
      const result = spawnSync(process.execPath, [
        runner,
        'pre:test:marker',
        'marker.js',
        'minimal,standard,strict',
      ], {
        cwd: root,
        env,
        input: raw,
        encoding: 'utf8',
      });
      assert.strictEqual(result.status, 0, result.stderr);
      assert.strictEqual(result.stdout, '', 'disabled wrapper hooks must not echo stdin');
      assert.ok(!fs.existsSync(markerPath), 'disabled wrapper hook must not execute');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

// normalizeId tests
describe(sectionTitle('\nnormalizeId:'), () => {
  test('returns empty string for null', () => {
    assert.strictEqual(normalizeId(null), '');
  });

  test('returns empty string for undefined', () => {
    assert.strictEqual(normalizeId(undefined), '');
  });

  test('returns empty string for empty string', () => {
    assert.strictEqual(normalizeId(''), '');
  });

  test('trims whitespace', () => {
    assert.strictEqual(normalizeId('  hello  '), 'hello');
  });

  test('converts to lowercase', () => {
    assert.strictEqual(normalizeId('MyHook'), 'myhook');
  });

  test('handles mixed case with whitespace', () => {
    assert.strictEqual(normalizeId('  My-Hook-ID  '), 'my-hook-id');
  });

  test('converts numbers to string', () => {
    assert.strictEqual(normalizeId(123), '123');
  });

  test('returns empty string for whitespace-only input', () => {
    assert.strictEqual(normalizeId('   '), '');
  });
});

// getHookProfile tests
describe(sectionTitle('\ngetHookProfile:'), () => {
  test('defaults to standard when env var not set', () => {
    withEnv({
      YUS_HOOK_PROFILE: undefined,
      CLAUDE_PLUGIN_OPTION_HOOK_PROFILE: undefined,
      YUS_HOOK_CONFIG: undefined,
      CLAUDE_PLUGIN_ROOT: undefined,
      YUS_PLUGIN_ROOT: undefined,
    }, () => {
      assert.strictEqual(getHookProfile(), 'standard');
    });
  });

  test('returns minimal when set to minimal', () => {
    withEnv({ YUS_HOOK_PROFILE: 'minimal' }, () => {
      assert.strictEqual(getHookProfile(), 'minimal');
    });
  });

  test('returns standard when set to standard', () => {
    withEnv({ YUS_HOOK_PROFILE: 'standard' }, () => {
      assert.strictEqual(getHookProfile(), 'standard');
    });
  });

  test('returns strict when set to strict', () => {
    withEnv({ YUS_HOOK_PROFILE: 'strict' }, () => {
      assert.strictEqual(getHookProfile(), 'strict');
    });
  });

  test('is case-insensitive', () => {
    withEnv({ YUS_HOOK_PROFILE: 'STRICT' }, () => {
      assert.strictEqual(getHookProfile(), 'strict');
    });
  });

  test('trims whitespace from env var', () => {
    withEnv({ YUS_HOOK_PROFILE: '  minimal  ' }, () => {
      assert.strictEqual(getHookProfile(), 'minimal');
    });
  });

  test('defaults to standard for invalid value', () => {
    withEnv({ YUS_HOOK_PROFILE: 'invalid' }, () => {
      assert.strictEqual(getHookProfile(), 'standard');
    });
  });

  test('defaults to standard for empty string', () => {
    withEnv({ YUS_HOOK_PROFILE: '' }, () => {
      assert.strictEqual(getHookProfile(), 'standard');
    });
  });
});

// getDisabledHookIds tests
describe(sectionTitle('\ngetDisabledHookIds:'), () => {
  test('returns empty Set when env var not set', () => {
    withEnv({ YUS_DISABLED_HOOKS: undefined }, () => {
      const result = getDisabledHookIds();
      assert.ok(result instanceof Set);
      assert.strictEqual(result.size, 0);
    });
  });

  test('returns empty Set for empty string', () => {
    withEnv({ YUS_DISABLED_HOOKS: '' }, () => {
      assert.strictEqual(getDisabledHookIds().size, 0);
    });
  });

  test('returns empty Set for whitespace-only string', () => {
    withEnv({ YUS_DISABLED_HOOKS: '   ' }, () => {
      assert.strictEqual(getDisabledHookIds().size, 0);
    });
  });

  test('parses single hook id', () => {
    withEnv({ YUS_DISABLED_HOOKS: 'my-hook' }, () => {
      const result = getDisabledHookIds();
      assert.strictEqual(result.size, 1);
      assert.ok(result.has('my-hook'));
    });
  });

  test('parses multiple comma-separated hook ids', () => {
    withEnv({ YUS_DISABLED_HOOKS: 'hook-a,hook-b,hook-c' }, () => {
      const result = getDisabledHookIds();
      assert.strictEqual(result.size, 3);
      assert.ok(result.has('hook-a'));
      assert.ok(result.has('hook-b'));
      assert.ok(result.has('hook-c'));
    });
  });

  test('trims whitespace around hook ids', () => {
    withEnv({ YUS_DISABLED_HOOKS: ' hook-a , hook-b ' }, () => {
      const result = getDisabledHookIds();
      assert.strictEqual(result.size, 2);
      assert.ok(result.has('hook-a'));
      assert.ok(result.has('hook-b'));
    });
  });

  test('normalizes hook ids to lowercase', () => {
    withEnv({ YUS_DISABLED_HOOKS: 'MyHook,ANOTHER' }, () => {
      const result = getDisabledHookIds();
      assert.ok(result.has('myhook'));
      assert.ok(result.has('another'));
    });
  });

  test('filters out empty entries from trailing commas', () => {
    withEnv({ YUS_DISABLED_HOOKS: 'hook-a,,hook-b,' }, () => {
      const result = getDisabledHookIds();
      assert.strictEqual(result.size, 2);
      assert.ok(result.has('hook-a'));
      assert.ok(result.has('hook-b'));
    });
  });
});

// parseProfiles tests
describe(sectionTitle('\nparseProfiles:'), () => {
  test('returns fallback for null input', () => {
    const result = parseProfiles(null);
    assert.deepStrictEqual(result, ['standard', 'strict']);
  });

  test('returns fallback for undefined input', () => {
    const result = parseProfiles(undefined);
    assert.deepStrictEqual(result, ['standard', 'strict']);
  });

  test('uses custom fallback when provided', () => {
    const result = parseProfiles(null, ['minimal']);
    assert.deepStrictEqual(result, ['minimal']);
  });

  test('parses comma-separated string', () => {
    const result = parseProfiles('minimal,strict');
    assert.deepStrictEqual(result, ['minimal', 'strict']);
  });

  test('parses single string value', () => {
    const result = parseProfiles('strict');
    assert.deepStrictEqual(result, ['strict']);
  });

  test('parses array of profiles', () => {
    const result = parseProfiles(['minimal', 'standard']);
    assert.deepStrictEqual(result, ['minimal', 'standard']);
  });

  test('filters invalid profiles from string', () => {
    const result = parseProfiles('minimal,invalid,strict');
    assert.deepStrictEqual(result, ['minimal', 'strict']);
  });

  test('filters invalid profiles from array', () => {
    const result = parseProfiles(['minimal', 'bogus', 'strict']);
    assert.deepStrictEqual(result, ['minimal', 'strict']);
  });

  test('returns fallback when all string values are invalid', () => {
    const result = parseProfiles('invalid,bogus');
    assert.deepStrictEqual(result, ['standard', 'strict']);
  });

  test('returns fallback when all array values are invalid', () => {
    const result = parseProfiles(['invalid', 'bogus']);
    assert.deepStrictEqual(result, ['standard', 'strict']);
  });

  test('is case-insensitive for string input', () => {
    const result = parseProfiles('MINIMAL,STRICT');
    assert.deepStrictEqual(result, ['minimal', 'strict']);
  });

  test('is case-insensitive for array input', () => {
    const result = parseProfiles(['MINIMAL', 'STRICT']);
    assert.deepStrictEqual(result, ['minimal', 'strict']);
  });

  test('trims whitespace in string input', () => {
    const result = parseProfiles(' minimal , strict ');
    assert.deepStrictEqual(result, ['minimal', 'strict']);
  });

  test('handles null values in array', () => {
    const result = parseProfiles([null, 'strict']);
    assert.deepStrictEqual(result, ['strict']);
  });
});

// isHookEnabled tests
describe(sectionTitle('\nisHookEnabled:'), () => {
  test('returns true by default for a hook (standard profile)', () => {
    withEnv({ YUS_HOOK_PROFILE: undefined, YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook'), true);
    });
  });

  test('returns true for empty hookId', () => {
    withEnv({ YUS_HOOK_PROFILE: undefined, YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled(''), true);
    });
  });

  test('returns true for null hookId', () => {
    withEnv({ YUS_HOOK_PROFILE: undefined, YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled(null), true);
    });
  });

  test('returns false when hook is in disabled list', () => {
    withEnv({ YUS_HOOK_PROFILE: undefined, YUS_DISABLED_HOOKS: 'my-hook' }, () => {
      assert.strictEqual(isHookEnabled('my-hook'), false);
    });
  });

  test('disabled check is case-insensitive', () => {
    withEnv({ YUS_HOOK_PROFILE: undefined, YUS_DISABLED_HOOKS: 'MY-HOOK' }, () => {
      assert.strictEqual(isHookEnabled('my-hook'), false);
    });
  });

  test('returns true when hook is not in disabled list', () => {
    withEnv({ YUS_HOOK_PROFILE: undefined, YUS_DISABLED_HOOKS: 'other-hook' }, () => {
      assert.strictEqual(isHookEnabled('my-hook'), true);
    });
  });

  test('returns false when current profile is not in allowed profiles', () => {
    withEnv({ YUS_HOOK_PROFILE: 'minimal', YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook', { profiles: 'strict' }), false);
    });
  });

  test('returns true when current profile is in allowed profiles', () => {
    withEnv({ YUS_HOOK_PROFILE: 'strict', YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook', { profiles: 'standard,strict' }), true);
    });
  });

  test('returns true when current profile matches single allowed profile', () => {
    withEnv({ YUS_HOOK_PROFILE: 'minimal', YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook', { profiles: 'minimal' }), true);
    });
  });

  test('disabled hooks take precedence over profile match', () => {
    withEnv({ YUS_HOOK_PROFILE: 'strict', YUS_DISABLED_HOOKS: 'my-hook' }, () => {
      assert.strictEqual(isHookEnabled('my-hook', { profiles: 'strict' }), false);
    });
  });

  test('uses default profiles (standard, strict) when none specified', () => {
    withEnv({ YUS_HOOK_PROFILE: 'minimal', YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook'), false);
    });
  });

  test('allows standard profile by default', () => {
    withEnv({ YUS_HOOK_PROFILE: 'standard', YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook'), true);
    });
  });

  test('allows strict profile by default', () => {
    withEnv({ YUS_HOOK_PROFILE: 'strict', YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook'), true);
    });
  });

  test('accepts array profiles option', () => {
    withEnv({ YUS_HOOK_PROFILE: 'minimal', YUS_DISABLED_HOOKS: undefined }, () => {
      assert.strictEqual(isHookEnabled('my-hook', { profiles: ['minimal', 'standard'] }), true);
    });
  });
});
