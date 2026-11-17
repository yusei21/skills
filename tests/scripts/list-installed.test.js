/**
 * Tests for scripts/list-installed.js
 */

const assert = require('node:assert');
const { test } = require('node:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'list-installed.js');
const REPO_ROOT = path.join(__dirname, '..', '..');
const CURRENT_PACKAGE_VERSION = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')
).version;
const CURRENT_MANIFEST_VERSION = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'manifests', 'install-modules.json'), 'utf8')
).version;
const {
  createInstallState,
  writeInstallState,
} = require('../../scripts/lib/install-state');

function createTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function writeState(filePath, options) {
  const state = createInstallState(options);
  writeInstallState(filePath, state);
}

function run(args = [], options = {}) {
  const env = {
    ...process.env,
    HOME: options.homeDir || process.env.HOME,
  };

  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      cwd: options.cwd,
      env,
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

  test('reports when no install-state files are present', () => {
    const homeDir = createTempDir('list-installed-home-');
    const projectRoot = createTempDir('list-installed-project-');

    try {
      const result = run([], { cwd: projectRoot, homeDir });
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('No yus install-state files found'));
    } finally {
      cleanup(homeDir);
      cleanup(projectRoot);
    }
  });

  test('emits JSON for discovered install-state records', () => {
    const homeDir = createTempDir('list-installed-home-');
    const projectRoot = createTempDir('list-installed-project-');

    try {
      const statePath = path.join(projectRoot, '.cursor', 'yus-install-state.json');
      writeState(statePath, {
        adapter: { id: 'cursor-project', target: 'cursor', kind: 'project' },
        targetRoot: path.join(projectRoot, '.cursor'),
        installStatePath: statePath,
        request: {
          profile: 'core',
          modules: [],
          legacyLanguages: [],
          legacyMode: false,
        },
        resolution: {
          selectedModules: ['rules-core', 'platform-configs'],
          skippedModules: [],
        },
        operations: [],
        source: {
          repoVersion: CURRENT_PACKAGE_VERSION,
          repoCommit: 'abc123',
          manifestVersion: CURRENT_MANIFEST_VERSION,
        },
      });

      const result = run(['--json'], { cwd: projectRoot, homeDir });
      assert.strictEqual(result.code, 0, result.stderr);

      const parsed = JSON.parse(result.stdout);
      assert.strictEqual(parsed.records.length, 1);
      assert.strictEqual(parsed.records[0].state.target.id, 'cursor-project');
      assert.strictEqual(parsed.records[0].state.request.profile, 'core');
    } finally {
      cleanup(homeDir);
      cleanup(projectRoot);
    }
  });
