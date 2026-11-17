/**
 * Tests for scripts/install-plan.js
 */

const assert = require('node:assert');
const { test } = require('node:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'install-plan.js');

function run(args = [], options = {}) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd,
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
    assert.ok(result.stdout.includes('Inspect yus selective-install manifests'));
  });

  test('lists install profiles', () => {
    const result = run(['--list-profiles']);
    assert.strictEqual(result.code, 0);
    assert.ok(result.stdout.includes('Install profiles'));
    assert.ok(result.stdout.includes('core'));
  });

  test('lists install modules', () => {
    const result = run(['--list-modules']);
    assert.strictEqual(result.code, 0);
    assert.ok(result.stdout.includes('Install modules'));
    assert.ok(result.stdout.includes('rules-core'));
  });

  test('lists install components', () => {
    const result = run(['--list-components', '--family', 'language']);
    assert.strictEqual(result.code, 0);
    assert.ok(result.stdout.includes('Install components'));
    assert.ok(result.stdout.includes('lang:typescript'));
    assert.ok(!result.stdout.includes('capability:security'));
  });

  test('prints a filtered install plan for a profile and target', () => {
    const result = run([
      '--profile', 'developer',
      '--with', 'capability:security',
      '--without', 'capability:orchestration',
      '--target', 'cursor'
    ]);
    assert.strictEqual(result.code, 0);
    assert.ok(result.stdout.includes('Install plan'));
    assert.ok(result.stdout.includes('Included components: capability:security'));
    assert.ok(result.stdout.includes('Excluded components: capability:orchestration'));
    assert.ok(result.stdout.includes('Adapter: cursor-project'));
    assert.ok(result.stdout.includes('Target root:'));
    assert.ok(result.stdout.includes('Install-state:'));
    assert.ok(result.stdout.includes('Operation plan'));
    assert.ok(result.stdout.includes('Excluded by selection'));
    assert.ok(result.stdout.includes('security'));
  });

  test('emits JSON for explicit module resolution', () => {
    const result = run([
      '--modules', 'security',
      '--with', 'capability:research',
      '--target', 'cursor',
      '--json'
    ]);
    assert.strictEqual(result.code, 0);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.selectedModuleIds.includes('security'));
    assert.ok(parsed.selectedModuleIds.includes('research-apis'));
    assert.ok(parsed.selectedModuleIds.includes('workflow-quality'));
    assert.deepStrictEqual(parsed.includedComponentIds, ['capability:research']);
    assert.strictEqual(parsed.targetAdapterId, 'cursor-project');
    assert.ok(Array.isArray(parsed.operations));
    assert.ok(parsed.operations.length > 0);
  });

  test('emits JSON for --skills without pulling parent module', () => {
    const result = run([
      '--skills', 'continuous-learning-v2',
      '--target', 'claude',
      '--json',
    ]);
    assert.strictEqual(result.code, 0);
    const parsed = JSON.parse(result.stdout);
    assert.deepStrictEqual(parsed.includedComponentIds, ['skill:continuous-learning-v2']);
    assert.deepStrictEqual(parsed.selectedModuleIds, ['skill-continuous-learning-v2']);
    assert.ok(parsed.operations.some(operation => operation.sourceRelativePath === 'skills/admin/continuous-learning-v2'));
    assert.ok(!parsed.operations.some(operation => operation.sourceRelativePath === 'skills/core/tdd-workflow'));
  });

  test('loads planning intent from yus-install.json', () => {
    const configDir = path.join(__dirname, '..', 'fixtures', 'tmp-install-plan-config');
    const configPath = path.join(configDir, 'yus-install.json');

    try {
      require('fs').mkdirSync(configDir, { recursive: true });
      require('fs').writeFileSync(configPath, JSON.stringify({
        version: 1,
        target: 'cursor',
        profile: 'core',
        include: ['capability:security'],
        exclude: ['capability:orchestration'],
      }, null, 2));

      const result = run(['--config', configPath, '--json']);
      assert.strictEqual(result.code, 0);
      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(parsed.target, 'cursor');
      assert.deepStrictEqual(parsed.includedComponentIds, ['capability:security']);
      assert.deepStrictEqual(parsed.excludedComponentIds, ['capability:orchestration']);
      assert.ok(parsed.selectedModuleIds.includes('security'));
      assert.ok(!parsed.selectedModuleIds.includes('orchestration'));
    } finally {
      require('fs').rmSync(configDir, { recursive: true, force: true });
    }
  });

  test('config component selections produce the same operations as CLI flags', () => {
    const configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-plan-config-'));
    const configPath = path.join(configDir, 'selections.json');
    const include = ['agent:planner', 'skill:continuous-learning-v2'];
    const exclude = ['skill:security-review'];

    try {
      fs.writeFileSync(configPath, JSON.stringify({
        version: 1, target: 'claude', profile: 'developer', include, exclude,
      }));
      const cli = run([
        '--target', 'claude', '--profile', 'developer',
        ...include.flatMap(id => ['--with', id]),
        ...exclude.flatMap(id => ['--without', id]), '--json',
      ], { cwd: configDir });
      const configured = run(['--config', configPath, '--json'], { cwd: configDir });
      assert.strictEqual(cli.code, 0, cli.stderr);
      assert.strictEqual(configured.code, 0, configured.stderr);
      const expected = JSON.parse(cli.stdout);
      const actual = JSON.parse(configured.stdout);
      assert.deepStrictEqual(actual.includedComponentIds, include);
      assert.deepStrictEqual(actual.excludedComponentIds, exclude);
      assert.deepStrictEqual(actual.selectedModuleIds, expected.selectedModuleIds);
      assert.deepStrictEqual(actual.operations, expected.operations);
    } finally {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
  });

  test('auto-detects planning intent from project yus-install.json', () => {
    const configDir = path.join(__dirname, '..', 'fixtures', 'tmp-install-plan-autodetect');
    const configPath = path.join(configDir, 'yus-install.json');

    try {
      require('fs').mkdirSync(configDir, { recursive: true });
      require('fs').writeFileSync(configPath, JSON.stringify({
        version: 1,
        target: 'cursor',
        profile: 'core',
        include: ['capability:security'],
      }, null, 2));

      const result = run(['--json'], { cwd: configDir });
      assert.strictEqual(result.code, 0, result.stderr);
      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(parsed.target, 'cursor');
      assert.strictEqual(parsed.profileId, 'core');
      assert.deepStrictEqual(parsed.includedComponentIds, ['capability:security']);
      assert.ok(parsed.selectedModuleIds.includes('security'));
    } finally {
      require('fs').rmSync(configDir, { recursive: true, force: true });
    }
  });

  test('fails on unknown arguments', () => {
    const result = run(['--unknown-flag']);
    assert.strictEqual(result.code, 1);
    assert.ok(result.stderr.includes('Unknown argument'));
  });

  test('fails on invalid install target', () => {
    const result = run(['--profile', 'core', '--target', 'not-a-target']);
    assert.strictEqual(result.code, 1);
    assert.ok(result.stderr.includes('Unknown install target'));
  });
