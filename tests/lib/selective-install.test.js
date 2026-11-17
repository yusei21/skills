/**
 * Tests for --with / --without selective install flags (issue #470)
 *
 * Covers:
 * - CLI argument parsing for --with and --without
 * - Request normalization with include/exclude component IDs
 * - Component-to-module expansion via the manifest catalog
 * - End-to-end install plans with --with and --without
 * - Validation and error handling for unknown component IDs
 * - Combined --profile + --with + --without flows
 * - Standalone --with without a profile
 * - agent: and skill: component families
 */

const assert = require('node:assert');
const { test } = require('node:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  parseInstallArgs,
  normalizeInstallRequest,
} = require('../../scripts/lib/install/request');

const {
  listInstallComponents,
  resolveInstallPlan,
} = require('../../scripts/lib/install-manifests');

function normalizePlanPath(value) {
  return String(value || '').replace(/\\/g, '/');
}

  // ─── CLI Argument Parsing ───

  test('parses single --with flag', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--profile', 'core',
      '--with', 'lang:typescript',
    ]);
    assert.deepStrictEqual(parsed.includeComponentIds, ['lang:typescript']);
    assert.deepStrictEqual(parsed.excludeComponentIds, []);
  });

  test('parses single --without flag', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--profile', 'developer',
      '--without', 'capability:orchestration',
    ]);
    assert.deepStrictEqual(parsed.excludeComponentIds, ['capability:orchestration']);
    assert.deepStrictEqual(parsed.includeComponentIds, []);
  });

  test('parses multiple --with flags', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--with', 'lang:typescript',
      '--with', 'framework:nextjs',
      '--with', 'capability:database',
    ]);
    assert.deepStrictEqual(parsed.includeComponentIds, [
      'lang:typescript',
      'framework:nextjs',
      'capability:database',
    ]);
  });

  test('parses --skills as skill component selections', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--skills', 'continuous-learning-v2,security-review',
    ]);
    assert.deepStrictEqual(parsed.includeComponentIds, [
      'skill:continuous-learning-v2',
      'skill:security-review',
    ]);
  });

  test('parses --skill when caller already includes the skill: prefix', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--skill', 'skill:continuous-learning-v2',
    ]);
    assert.deepStrictEqual(parsed.includeComponentIds, ['skill:continuous-learning-v2']);
  });

  test('parses multiple --without flags', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--profile', 'full',
      '--without', 'capability:media',
      '--without', 'capability:social',
    ]);
    assert.deepStrictEqual(parsed.excludeComponentIds, [
      'capability:media',
      'capability:social',
    ]);
  });

  test('parses combined --with and --without flags', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--profile', 'developer',
      '--with', 'lang:typescript',
      '--with', 'framework:nextjs',
      '--without', 'capability:orchestration',
    ]);
    assert.strictEqual(parsed.profileId, 'developer');
    assert.deepStrictEqual(parsed.includeComponentIds, ['lang:typescript', 'framework:nextjs']);
    assert.deepStrictEqual(parsed.excludeComponentIds, ['capability:orchestration']);
  });

  test('ignores empty --with values', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--with', '',
      '--with', 'lang:python',
    ]);
    assert.deepStrictEqual(parsed.includeComponentIds, ['lang:python']);
  });

  test('ignores empty --without values', () => {
    const parsed = parseInstallArgs([
      'node', 'install-apply.js',
      '--profile', 'core',
      '--without', '',
      '--without', 'capability:media',
    ]);
    assert.deepStrictEqual(parsed.excludeComponentIds, ['capability:media']);
  });

  // ─── Request Normalization ───

  test('normalizes --with-only request as manifest mode', () => {
    const request = normalizeInstallRequest({
      target: 'claude',
      profileId: null,
      moduleIds: [],
      includeComponentIds: ['lang:typescript'],
      excludeComponentIds: [],
      languages: [],
    });
    assert.strictEqual(request.mode, 'manifest');
    assert.deepStrictEqual(request.includeComponentIds, ['lang:typescript']);
    assert.deepStrictEqual(request.excludeComponentIds, []);
  });

  test('normalizes --profile + --with + --without as manifest mode', () => {
    const request = normalizeInstallRequest({
      target: 'cursor',
      profileId: 'developer',
      moduleIds: [],
      includeComponentIds: ['lang:typescript', 'framework:nextjs'],
      excludeComponentIds: ['capability:orchestration'],
      languages: [],
    });
    assert.strictEqual(request.mode, 'manifest');
    assert.strictEqual(request.profileId, 'developer');
    assert.deepStrictEqual(request.includeComponentIds, ['lang:typescript', 'framework:nextjs']);
    assert.deepStrictEqual(request.excludeComponentIds, ['capability:orchestration']);
  });

  test('rejects --with combined with legacy language arguments', () => {
    assert.throws(
      () => normalizeInstallRequest({
        target: 'claude',
        profileId: null,
        moduleIds: [],
        includeComponentIds: ['lang:typescript'],
        excludeComponentIds: [],
        languages: ['python'],
      }),
      /cannot be combined/
    );
  });

  test('rejects --without combined with legacy language arguments', () => {
    assert.throws(
      () => normalizeInstallRequest({
        target: 'claude',
        profileId: null,
        moduleIds: [],
        includeComponentIds: [],
        excludeComponentIds: ['capability:media'],
        languages: ['typescript'],
      }),
      /cannot be combined/
    );
  });

  test('deduplicates repeated --with component IDs', () => {
    const request = normalizeInstallRequest({
      target: 'claude',
      profileId: null,
      moduleIds: [],
      includeComponentIds: ['lang:typescript', 'lang:typescript', 'lang:python'],
      excludeComponentIds: [],
      languages: [],
    });
    assert.deepStrictEqual(request.includeComponentIds, ['lang:typescript', 'lang:python']);
  });

  test('deduplicates repeated --without component IDs', () => {
    const request = normalizeInstallRequest({
      target: 'claude',
      profileId: 'full',
      moduleIds: [],
      includeComponentIds: [],
      excludeComponentIds: ['capability:media', 'capability:media', 'capability:social'],
      languages: [],
    });
    assert.deepStrictEqual(request.excludeComponentIds, ['capability:media', 'capability:social']);
  });

  // ─── Component Catalog Validation ───

  test('component catalog includes lang: family entries', () => {
    const components = listInstallComponents({ family: 'language' });
    assert.ok(components.some(c => c.id === 'lang:typescript'), 'Should have lang:typescript');
    assert.ok(components.some(c => c.id === 'lang:python'), 'Should have lang:python');
    assert.ok(components.some(c => c.id === 'lang:go'), 'Should have lang:go');
    assert.ok(components.some(c => c.id === 'lang:java'), 'Should have lang:java');
    assert.ok(components.some(c => c.id === 'lang:ruby'), 'Should have lang:ruby');
  });

  test('component catalog includes framework: family entries', () => {
    const components = listInstallComponents({ family: 'framework' });
    assert.ok(components.some(c => c.id === 'framework:react'), 'Should have framework:react');
    assert.ok(components.some(c => c.id === 'framework:nextjs'), 'Should have framework:nextjs');
    assert.ok(components.some(c => c.id === 'framework:django'), 'Should have framework:django');
    assert.ok(components.some(c => c.id === 'framework:springboot'), 'Should have framework:springboot');
    assert.ok(components.some(c => c.id === 'framework:rails'), 'Should have framework:rails');
  });

  test('component catalog includes capability: family entries', () => {
    const components = listInstallComponents({ family: 'capability' });
    assert.ok(components.some(c => c.id === 'capability:database'), 'Should have capability:database');
    assert.ok(components.some(c => c.id === 'capability:security'), 'Should have capability:security');
    assert.ok(components.some(c => c.id === 'capability:orchestration'), 'Should have capability:orchestration');
  });

  test('component catalog includes agent: family entries', () => {
    const components = listInstallComponents({ family: 'agent' });
    assert.ok(components.length > 0, 'Should have at least one agent component');
    assert.ok(components.some(c => c.id === 'agent:security-reviewer'), 'Should have agent:security-reviewer');
  });

  test('component catalog includes skill: family entries', () => {
    const components = listInstallComponents({ family: 'skill' });
    assert.ok(components.length > 0, 'Should have at least one skill component');
    assert.ok(components.some(c => c.id === 'skill:continuous-learning'), 'Should have skill:continuous-learning');
    assert.ok(components.some(c => c.id === 'skill:continuous-learning-v2'), 'Should have skill:continuous-learning-v2');
  });

  // ─── Install Plan Resolution with --with ───

  test('--with alone resolves component modules and their dependencies', () => {
    const plan = resolveInstallPlan({
      includeComponentIds: ['lang:typescript'],
      target: 'claude',
    });
    assert.ok(plan.selectedModuleIds.includes('framework-language'),
      'Should include the module behind lang:typescript');
    assert.ok(plan.selectedModuleIds.includes('rules-core'),
      'Should include framework-language dependency rules-core');
    assert.ok(plan.selectedModuleIds.includes('platform-configs'),
      'Should include framework-language dependency platform-configs');
  });

  test('--with adds modules on top of a profile', () => {
    const plan = resolveInstallPlan({
      profileId: 'core',
      includeComponentIds: ['capability:security'],
      target: 'claude',
    });
    // core profile modules
    assert.ok(plan.selectedModuleIds.includes('rules-core'));
    assert.ok(plan.selectedModuleIds.includes('workflow-quality'));
    // added by --with
    assert.ok(plan.selectedModuleIds.includes('security'),
      'Should include security module from --with');
  });

  test('multiple --with flags union their modules', () => {
    const plan = resolveInstallPlan({
      includeComponentIds: ['lang:typescript', 'capability:database'],
      target: 'claude',
    });
    assert.ok(plan.selectedModuleIds.includes('framework-language'),
      'Should include framework-language from lang:typescript');
    assert.ok(plan.selectedModuleIds.includes('database'),
      'Should include database from capability:database');
  });

  // ─── Install Plan Resolution with --without ───

  test('--without excludes modules from a profile', () => {
    const plan = resolveInstallPlan({
      profileId: 'developer',
      excludeComponentIds: ['capability:orchestration'],
      target: 'claude',
    });
    assert.ok(!plan.selectedModuleIds.includes('orchestration'),
      'Should exclude orchestration module');
    assert.ok(plan.excludedModuleIds.includes('orchestration'),
      'Should report orchestration as excluded');
    // rest of developer profile should remain
    assert.ok(plan.selectedModuleIds.includes('rules-core'));
    assert.ok(plan.selectedModuleIds.includes('framework-language'));
    assert.ok(plan.selectedModuleIds.includes('database'));
  });

  test('multiple --without flags exclude multiple modules', () => {
    const plan = resolveInstallPlan({
      profileId: 'full',
      excludeComponentIds: ['capability:media', 'capability:social', 'capability:supply-chain'],
      target: 'claude',
    });
    assert.ok(!plan.selectedModuleIds.includes('media-generation'));
    assert.ok(!plan.selectedModuleIds.includes('social-distribution'));
    assert.ok(!plan.selectedModuleIds.includes('supply-chain-domain'));
    assert.ok(plan.excludedModuleIds.includes('media-generation'));
    assert.ok(plan.excludedModuleIds.includes('social-distribution'));
    assert.ok(plan.excludedModuleIds.includes('supply-chain-domain'));
  });

  // ─── Combined --with + --without ───

  test('--with and --without work together on a profile', () => {
    const plan = resolveInstallPlan({
      profileId: 'developer',
      includeComponentIds: ['capability:security'],
      excludeComponentIds: ['capability:orchestration'],
      target: 'claude',
    });
    assert.ok(plan.selectedModuleIds.includes('security'),
      'Should include security from --with');
    assert.ok(!plan.selectedModuleIds.includes('orchestration'),
      'Should exclude orchestration from --without');
    assert.ok(plan.selectedModuleIds.includes('rules-core'),
      'Should keep profile base modules');
  });

  test('--without on a dependency of --with raises an error', () => {
    assert.throws(
      () => resolveInstallPlan({
        includeComponentIds: ['capability:social'],
        excludeComponentIds: ['capability:content'],
      }),
      /depends on excluded module/
    );
  });

  // ─── Validation Errors ───

  test('throws for unknown component ID in --with', () => {
    assert.throws(
      () => resolveInstallPlan({
        includeComponentIds: ['lang:brainfuck-plus-plus'],
      }),
      /Unknown install component/
    );
  });

  test('throws for unknown component ID in --without', () => {
    assert.throws(
      () => resolveInstallPlan({
        profileId: 'core',
        excludeComponentIds: ['capability:teleportation'],
      }),
      /Unknown install component/
    );
  });

  test('throws when all modules are excluded', () => {
    assert.throws(
      () => resolveInstallPlan({
        profileId: 'core',
        excludeComponentIds: [
          'baseline:rules',
          'baseline:agents',
          'baseline:commands',
          'baseline:hooks',
          'baseline:platform',
          'baseline:workflow',
        ],
        target: 'claude',
      }),
      /excludes every requested install module/
    );
  });

  // ─── Target-Specific Behavior ───

  test('--with respects target compatibility filtering', () => {
    const plan = resolveInstallPlan({
      includeComponentIds: ['capability:orchestration'],
      target: 'cursor',
    });
    // orchestration module only supports claude, codex, opencode
    assert.ok(!plan.selectedModuleIds.includes('orchestration'),
      'Should skip orchestration for cursor target');
    assert.ok(plan.skippedModuleIds.includes('orchestration'),
      'Should report orchestration as skipped for cursor');
  });

  test('--without with agent: component excludes the agent module', () => {
    const plan = resolveInstallPlan({
      profileId: 'core',
      excludeComponentIds: ['agent:security-reviewer'],
      target: 'claude',
    });
    // agent:security-reviewer maps to agents-core module
    // Since core profile includes agents-core and it is excluded, it should be gone
    assert.ok(!plan.selectedModuleIds.includes('agents-core'),
      'Should exclude agents-core when agent:security-reviewer is excluded');
    assert.ok(plan.excludedModuleIds.includes('agents-core'),
      'Should report agents-core as excluded');
  });

  test('--with agent: component includes the agents-core module', () => {
    const plan = resolveInstallPlan({
      includeComponentIds: ['agent:security-reviewer'],
      target: 'claude',
    });
    assert.ok(plan.selectedModuleIds.includes('agents-core'),
      'Should include agents-core module from agent:security-reviewer');
  });

  test('--with skill: component includes the parent skill module', () => {
    const plan = resolveInstallPlan({
      includeComponentIds: ['skill:continuous-learning'],
      target: 'claude',
    });
    assert.ok(plan.selectedModuleIds.includes('workflow-quality'),
      'Should include workflow-quality module from skill:continuous-learning');
  });

  test('--with skill:continuous-learning-v2 installs only that skill module', () => {
    const plan = resolveInstallPlan({
      includeComponentIds: ['skill:continuous-learning-v2'],
      target: 'claude',
    });
    assert.deepStrictEqual(plan.selectedModuleIds, ['skill-continuous-learning-v2']);
    assert.ok(
      plan.operations.some(operation => operation.sourceRelativePath === 'skills/admin/continuous-learning-v2'),
      'Should install the continuous-learning-v2 skill directory'
    );
    assert.ok(
      !plan.operations.some(operation => operation.sourceRelativePath === 'skills/core/tdd-workflow'),
      'Should not install the whole workflow-quality skill module'
    );
  });

  // ─── Help Text ───

  test('help text documents --with and --without flags', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const result = execFileSync('node', [scriptPath, '--help'], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    assert.ok(result.includes('--with'), 'Help should mention --with');
    assert.ok(result.includes('--without'), 'Help should mention --without');
    assert.ok(result.includes('component'), 'Help should describe components');
    assert.ok(result.includes('zed          - Install project settings'), 'Help should describe Zed target');
  });

  // ─── End-to-End Dry-Run ───

  test('end-to-end: --profile developer --with capability:security --without capability:orchestration --dry-run', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-project-'));

    try {
      const result = execFileSync('node', [
        scriptPath,
        '--profile', 'developer',
        '--with', 'capability:security',
        '--without', 'capability:orchestration',
        '--dry-run',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      assert.ok(result.includes('Mode: manifest'), 'Should be manifest mode');
      assert.ok(result.includes('Profile: developer'), 'Should show developer profile');
      assert.ok(result.includes('capability:security'), 'Should show included component');
      assert.ok(result.includes('capability:orchestration'), 'Should show excluded component');
      assert.ok(result.includes('security'), 'Selected modules should include security');
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('end-to-end: --profile minimal --target zed --dry-run --json plans project adapter', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-zed-project-'));

    try {
      const result = execFileSync('node', [
        scriptPath,
        '--profile', 'minimal',
        '--target', 'zed',
        '--dry-run',
        '--json',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const parsed = JSON.parse(result);

      assert.strictEqual(parsed.dryRun, true);
      assert.strictEqual(parsed.plan.target, 'zed');
      assert.strictEqual(parsed.plan.adapter.id, 'zed-project');
      assert.strictEqual(parsed.plan.installRoot, path.join(fs.realpathSync(projectDir), '.zed'));
      assert.ok(
        parsed.plan.operations.some(operation => normalizePlanPath(operation.sourceRelativePath) === '.zed/settings.json'),
        'Should include Zed native settings operation'
      );
      assert.ok(
        !parsed.plan.operations.some(operation => operation.moduleId === 'hooks-runtime'),
        'Zed minimal dry-run should not install hook runtime files'
      );
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('end-to-end: --with lang:python --with agent:security-reviewer --dry-run', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-project-'));

    try {
      const result = execFileSync('node', [
        scriptPath,
        '--with', 'lang:python',
        '--with', 'agent:security-reviewer',
        '--dry-run',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      assert.ok(result.includes('Mode: manifest'), 'Should be manifest mode');
      assert.ok(result.includes('lang:python'), 'Should show lang:python as included');
      assert.ok(result.includes('agent:security-reviewer'), 'Should show agent:security-reviewer as included');
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('end-to-end: --with with unknown component fails cleanly', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');

    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync('node', [
        scriptPath,
        '--with', 'lang:nonexistent-language',
        '--dry-run',
      ], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      exitCode = error.status || 1;
      stderr = error.stderr || '';
    }

    assert.strictEqual(exitCode, 1, 'Should exit with error code 1');
    assert.ok(stderr.includes('Unknown install component'), 'Should report unknown component');
  });

  test('end-to-end: --without with unknown component fails cleanly', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');

    let exitCode = 0;
    let stderr = '';
    try {
      execFileSync('node', [
        scriptPath,
        '--profile', 'core',
        '--without', 'capability:nonexistent',
        '--dry-run',
      ], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      exitCode = error.status || 1;
      stderr = error.stderr || '';
    }

    assert.strictEqual(exitCode, 1, 'Should exit with error code 1');
    assert.ok(stderr.includes('Unknown install component'), 'Should report unknown component');
  });

  // ─── End-to-End Actual Install ───

  test('end-to-end: installs --profile core --with capability:security and writes state', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-install-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-install-project-'));

    try {
      const _result = execFileSync('node', [
        scriptPath,
        '--profile', 'core',
        '--with', 'capability:security',
        '--enable-hooks',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const claudeRoot = path.join(homeDir, '.claude');
      // Security skill should be installed (from --with)
      assert.ok(fs.existsSync(path.join(claudeRoot, 'skills', 'security-review', 'SKILL.md')),
        'Should install security-review skill from --with');
      // Core profile modules should be installed
      assert.ok(fs.existsSync(path.join(claudeRoot, 'rules', 'yus', 'common', 'coding-style.md')),
        'Should install core rules');

      // Install state should record include/exclude
      const statePath = path.join(claudeRoot, 'yus', 'install-state.json');
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      assert.strictEqual(state.request.profile, 'core');
      assert.strictEqual(state.request.hookConsent, 'enabled');
      assert.deepStrictEqual(state.request.includeComponents, ['capability:security']);
      assert.deepStrictEqual(state.request.excludeComponents, []);
      assert.ok(state.resolution.selectedModules.includes('security'));
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('end-to-end: installs --profile developer --without capability:orchestration and state reflects exclusion', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-install-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-install-project-'));

    try {
      execFileSync('node', [
        scriptPath,
        '--profile', 'developer',
        '--without', 'capability:orchestration',
        '--enable-hooks',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const claudeRoot = path.join(homeDir, '.claude');
      // Orchestration skills should NOT be installed (from --without)
      assert.ok(!fs.existsSync(path.join(claudeRoot, 'skills', 'dmux-workflows', 'SKILL.md')),
        'Should not install orchestration skills');
      // Developer profile base modules should be installed
      assert.ok(fs.existsSync(path.join(claudeRoot, 'rules', 'yus', 'common', 'coding-style.md')),
        'Should install core rules');
      assert.ok(fs.existsSync(path.join(claudeRoot, 'skills', 'tdd-workflow', 'SKILL.md')),
        'Should install workflow skills');

      const statePath = path.join(claudeRoot, 'yus', 'install-state.json');
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      assert.strictEqual(state.request.profile, 'developer');
      assert.strictEqual(state.request.hookConsent, 'enabled');
      assert.deepStrictEqual(state.request.excludeComponents, ['capability:orchestration']);
      assert.ok(!state.resolution.selectedModules.includes('orchestration'));
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('end-to-end: --with alone (no profile) installs just the component modules', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-install-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-install-project-'));

    try {
      execFileSync('node', [
        scriptPath,
        '--with', 'lang:typescript',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const claudeRoot = path.join(homeDir, '.claude');
      // framework-language skill (from lang:typescript) should be installed
      assert.ok(fs.existsSync(path.join(claudeRoot, 'skills', 'coding-standards', 'SKILL.md')),
        'Should install framework-language skills');
      // Its dependencies should be installed
      assert.ok(fs.existsSync(path.join(claudeRoot, 'rules', 'yus', 'common', 'coding-style.md')),
        'Should install dependency rules-core');

      const statePath = path.join(claudeRoot, 'yus', 'install-state.json');
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      assert.strictEqual(state.request.profile, null);
      assert.deepStrictEqual(state.request.includeComponents, ['lang:typescript']);
      assert.ok(state.resolution.selectedModules.includes('framework-language'));
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('end-to-end: --skills continuous-learning-v2 installs only that skill', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-skill-install-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-skill-install-project-'));

    try {
      execFileSync('node', [
        scriptPath,
        '--skills', 'continuous-learning-v2',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const claudeRoot = path.join(homeDir, '.claude');
      assert.ok(
        fs.existsSync(path.join(claudeRoot, 'skills', 'continuous-learning-v2', 'SKILL.md')),
        'Should install continuous-learning-v2'
      );
      assert.ok(
        !fs.existsSync(path.join(claudeRoot, 'skills', 'tdd-workflow', 'SKILL.md')),
        'Should not install unrelated workflow-quality skills'
      );

      const statePath = path.join(claudeRoot, 'yus', 'install-state.json');
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      assert.deepStrictEqual(state.request.includeComponents, ['skill:continuous-learning-v2']);
      assert.deepStrictEqual(state.resolution.selectedModules, ['skill-continuous-learning-v2']);
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  // ─── JSON output mode ───

  test('end-to-end: --dry-run --json includes component selections in output', () => {
    const { execFileSync } = require('child_process');
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'install-apply.js');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-'));
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'selective-e2e-project-'));

    try {
      const output = execFileSync('node', [
        scriptPath,
        '--profile', 'core',
        '--with', 'capability:database',
        '--without', 'baseline:hooks',
        '--dry-run',
        '--json',
      ], {
        cwd: projectDir,
        env: { ...process.env, HOME: homeDir },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const json = JSON.parse(output);
      assert.strictEqual(json.dryRun, true);
      assert.ok(json.plan, 'Should include plan object');
      assert.ok(
        json.plan.includedComponentIds.includes('capability:database'),
        'JSON output should include capability:database in included components'
      );
      assert.ok(
        json.plan.excludedComponentIds.includes('baseline:hooks'),
        'JSON output should include baseline:hooks in excluded components'
      );
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });
