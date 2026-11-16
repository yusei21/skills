/**
 * Tests for scripts/lib/install/request.js
 */

const assert = require('node:assert');
const { test } = require('node:test');

const {
  normalizeInstallRequest,
  parseInstallArgs,
} = require('../../scripts/lib/install/request');

  test('parses manifest-mode CLI arguments', () => {
    const parsed = parseInstallArgs([
      'node',
      'scripts/install-apply.js',
      '--target', 'cursor',
      '--profile', 'developer',
      '--modules', 'platform-configs, workflow-quality ,platform-configs',
      '--with', 'lang:typescript',
      '--without', 'capability:media',
      '--config', 'ecc-install.json',
      '--dry-run',
      '--json'
    ]);

    assert.strictEqual(parsed.target, 'cursor');
    assert.strictEqual(parsed.profileId, 'developer');
    assert.strictEqual(parsed.configPath, 'ecc-install.json');
    assert.deepStrictEqual(parsed.moduleIds, ['platform-configs', 'workflow-quality']);
    assert.deepStrictEqual(parsed.includeComponentIds, ['lang:typescript']);
    assert.deepStrictEqual(parsed.excludeComponentIds, ['capability:media']);
    assert.strictEqual(parsed.dryRun, true);
    assert.strictEqual(parsed.json, true);
    assert.deepStrictEqual(parsed.languages, []);
  });

  test('parses --locale argument', () => {
    const parsed = parseInstallArgs([
      'node',
      'scripts/install-apply.js',
      '--locale', 'ja'
    ]);

    assert.strictEqual(parsed.locale, 'ja');
    assert.deepStrictEqual(parsed.languages, []);
  });

  test('parses explicit hook consent flags', () => {
    const enabled = parseInstallArgs([
      'node',
      'scripts/install-apply.js',
      '--profile', 'core',
      '--enable-hooks',
    ]);
    const declined = parseInstallArgs([
      'node',
      'scripts/install-apply.js',
      '--profile', 'core',
      '--no-hooks',
    ]);

    assert.strictEqual(enabled.enableHooks, true);
    assert.strictEqual(enabled.noHooks, false);
    assert.strictEqual(declined.enableHooks, false);
    assert.strictEqual(declined.noHooks, true);
  });

  test('requires a --locale value', () => {
    assert.throws(
      () => parseInstallArgs([
        'node',
        'scripts/install-apply.js',
        '--locale',
        '--dry-run'
      ]),
      /Missing value for --locale/
    );
  });

  test('normalizes legacy language installs into a canonical request', () => {
    const request = normalizeInstallRequest({
      target: 'claude',
      profileId: null,
      moduleIds: [],
      languages: ['typescript', 'python']
    });

    assert.strictEqual(request.mode, 'legacy-compat');
    assert.strictEqual(request.target, 'claude');
    assert.deepStrictEqual(request.legacyLanguages, ['typescript', 'python']);
    assert.deepStrictEqual(request.moduleIds, []);
    assert.strictEqual(request.profileId, null);
  });

  test('rejects every --locale value because this build ships no translations', () => {
    for (const locale of ['ja', 'ja-JP', 'zh-cn', 'pt-BR']) {
      for (const languages of [[], ['typescript']]) {
        assert.throws(
          () => normalizeInstallRequest({ target: 'claude', languages, locale }),
          /Unsupported locale: .*ships no translated documentation/,
          `${locale} ${languages.join(',')}`
        );
      }
    }
  });

  test('treats locale components as ordinary manifest selections next to legacy languages', () => {
    for (const target of ['claude', 'claude-project']) {
      assert.throws(() => normalizeInstallRequest(parseInstallArgs([
        'node', 'install-apply.js', '--target', target,
        '--with', 'locale:zh-cn', 'typescript', '--no-hooks',
      ])), /cannot be combined/);
    }
    assert.throws(() => normalizeInstallRequest({
      languages: ['typescript'],
      config: { target: 'claude', includeComponentIds: ['locale:zh-cn'] },
    }), /cannot be combined/);
  });

  test('keeps non-locale manifest selections incompatible with legacy languages', () => {
    const invalidSelections = [
      { profileId: 'core' },
      { moduleIds: ['rules-core'] },
      { includeComponentIds: ['locale:zh-cn', 'skill:tdd-workflow'] },
      { includeComponentIds: ['locale:fr'] },
      { includeComponentIds: ['locale:zh-CN'] },
      { excludeComponentIds: ['skill:tdd-workflow'] },
      { config: { includeComponentIds: ['skill:tdd-workflow'] } },
      { target: 'cursor' },
      { target: 'antigravity' },
    ];
    for (const selection of invalidSelections) {
      assert.throws(() => normalizeInstallRequest({
        target: 'claude', languages: ['typescript'],
        includeComponentIds: ['locale:zh-cn'], ...selection,
      }), /cannot be combined/, JSON.stringify(selection));
    }
  });

  test('locale components without legacy languages retain manifest mode', () => {
    for (const profileId of [null, 'core']) {
      const request = normalizeInstallRequest({
        target: 'claude', profileId, includeComponentIds: ['locale:zh-cn'],
      });
      assert.strictEqual(request.mode, 'manifest');
      assert.strictEqual(request.profileId, profileId);
      assert.deepStrictEqual(request.includeComponentIds, ['locale:zh-cn']);
    }
  });

  test('rejects unsupported locale codes', () => {
    assert.throws(
      () => normalizeInstallRequest({
        target: 'claude',
        profileId: null,
        moduleIds: [],
        includeComponentIds: [],
        excludeComponentIds: [],
        languages: [],
        locale: 'fr',
      }),
      /Unsupported locale/
    );
  });

  test('rejects --locale for non-Claude targets', () => {
    assert.throws(
      () => normalizeInstallRequest({ target: 'cursor', languages: [], locale: 'ja' }),
      /Unsupported locale/
    );
  });

  test('normalizes manifest installs into a canonical request', () => {
    const request = normalizeInstallRequest({
      target: 'cursor',
      profileId: 'developer',
      moduleIds: [],
      includeComponentIds: ['lang:typescript'],
      excludeComponentIds: ['capability:media'],
      languages: [],
      enableHooks: true,
    });

    assert.strictEqual(request.mode, 'manifest');
    assert.strictEqual(request.target, 'cursor');
    assert.strictEqual(request.profileId, 'developer');
    assert.strictEqual(request.hookConsent, 'enabled');
    assert.deepStrictEqual(request.includeComponentIds, ['lang:typescript']);
    assert.deepStrictEqual(request.excludeComponentIds, ['capability:media']);
    assert.deepStrictEqual(request.legacyLanguages, []);
  });

  test('merges config-backed component selections with CLI overrides', () => {
    const request = normalizeInstallRequest({
      target: 'cursor',
      profileId: null,
      moduleIds: ['platform-configs'],
      includeComponentIds: ['framework:nextjs'],
      excludeComponentIds: ['capability:media'],
      languages: [],
      configPath: '/workspace/app/ecc-install.json',
      config: {
        path: '/workspace/app/ecc-install.json',
        target: 'claude',
        profileId: 'developer',
        moduleIds: ['workflow-quality'],
        includeComponentIds: ['lang:typescript'],
        excludeComponentIds: ['capability:orchestration'],
      },
    });

    assert.strictEqual(request.mode, 'manifest');
    assert.strictEqual(request.target, 'cursor');
    assert.strictEqual(request.profileId, 'developer');
    assert.deepStrictEqual(request.moduleIds, ['workflow-quality', 'platform-configs']);
    assert.deepStrictEqual(request.includeComponentIds, ['lang:typescript', 'framework:nextjs']);
    assert.deepStrictEqual(request.excludeComponentIds, ['capability:orchestration', 'capability:media']);
    assert.strictEqual(request.configPath, '/workspace/app/ecc-install.json');
  });

  test('validates explicit module IDs against the manifest catalog', () => {
    assert.throws(
      () => normalizeInstallRequest({
        target: 'cursor',
        profileId: null,
        moduleIds: ['ghost-module'],
        includeComponentIds: [],
        excludeComponentIds: [],
        languages: [],
      }),
      /Unknown install module: ghost-module/
    );
  });

  test('rejects mixing legacy languages with manifest flags', () => {
    assert.throws(
      () => normalizeInstallRequest({
        target: 'claude',
        profileId: 'core',
        moduleIds: [],
        includeComponentIds: [],
        excludeComponentIds: [],
        languages: ['typescript']
      }),
      /cannot be combined/
    );
  });

  test('rejects --no-hooks with an explicit hooks-runtime selection', () => {
    assert.throws(
      () => normalizeInstallRequest({
        target: 'claude',
        profileId: null,
        moduleIds: ['hooks-runtime'],
        includeComponentIds: [],
        excludeComponentIds: [],
        languages: [],
        noHooks: true,
      }),
      /--no-hooks cannot be combined/
    );
  });

  test('rejects empty install requests when not asking for help', () => {
    assert.throws(
      () => normalizeInstallRequest({
        target: 'claude',
        profileId: null,
        moduleIds: [],
        includeComponentIds: [],
        excludeComponentIds: [],
        languages: [],
        help: false
      }),
      /No install profile, module IDs, included components, or legacy languages/
    );
  });
