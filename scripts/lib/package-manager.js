// @ts-check
/**
 * Package Manager Detection and Selection
 * Automatically detects the preferred package manager or lets user choose
 *
 * Supports: npm, pnpm, yarn, bun
 *
 * Types live in the JSDoc below and are enforced by `npm run typecheck`
 * (TypeScript, strict). This file is the single source of truth for them.
 */

const fs = require('node:fs');
const path = require('node:path');
const { commandExists, getClaudeDir, readFile, writeFile } = require('./utils');

/** @typedef {'npm' | 'pnpm' | 'yarn' | 'bun'} PackageManagerName */

/**
 * @typedef {object} PackageManagerConfig
 * @property {PackageManagerName} name
 * @property {string} lockFile Lock file name (e.g. "package-lock.json")
 * @property {readonly string[]} [lockFileAliases] Older lock file names that still identify this manager
 * @property {string} installCmd Install command (e.g. "npm install")
 * @property {string} runCmd Run-script prefix (e.g. "npm run", "pnpm")
 * @property {string} execCmd Execute-binary prefix (e.g. "npx", "pnpm dlx")
 * @property {string} testCmd
 * @property {string} buildCmd
 * @property {string} devCmd
 */

/** @typedef {'environment' | 'project-config' | 'package.json' | 'lock-file' | 'global-config' | 'default'} DetectionSource */

/**
 * @typedef {object} PackageManagerResult
 * @property {PackageManagerName} name
 * @property {Readonly<PackageManagerConfig>} config
 * @property {DetectionSource} source
 */

/**
 * @typedef {object} PackageManagerOptions
 * @property {string} [projectDir] Directory to detect from (default: process.cwd())
 */

/**
 * @typedef {object} SavedPreference
 * @property {PackageManagerName} packageManager
 * @property {string} setAt ISO-8601 timestamp
 */

/** @type {Readonly<Record<PackageManagerName, Readonly<PackageManagerConfig>>>} */
const PACKAGE_MANAGERS = Object.freeze({
  npm: Object.freeze({
    name: 'npm',
    lockFile: 'package-lock.json',
    installCmd: 'npm install',
    runCmd: 'npm run',
    execCmd: 'npx',
    testCmd: 'npm test',
    buildCmd: 'npm run build',
    devCmd: 'npm run dev'
  }),
  pnpm: Object.freeze({
    name: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    installCmd: 'pnpm install',
    runCmd: 'pnpm',
    execCmd: 'pnpm dlx',
    testCmd: 'pnpm test',
    buildCmd: 'pnpm build',
    devCmd: 'pnpm dev'
  }),
  yarn: Object.freeze({
    name: 'yarn',
    lockFile: 'yarn.lock',
    installCmd: 'yarn',
    runCmd: 'yarn',
    execCmd: 'yarn dlx',
    testCmd: 'yarn test',
    buildCmd: 'yarn build',
    devCmd: 'yarn dev'
  }),
  bun: Object.freeze({
    name: 'bun',
    lockFile: 'bun.lock',
    // Bun switched its default lockfile from the binary bun.lockb to the
    // text-based bun.lock. Keep recognizing the legacy file too.
    lockFileAliases: Object.freeze(['bun.lockb']),
    installCmd: 'bun install',
    runCmd: 'bun run',
    execCmd: 'bunx',
    testCmd: 'bun test',
    buildCmd: 'bun run build',
    devCmd: 'bun run dev'
  })
});

/**
 * Priority order for detection
 * @type {readonly PackageManagerName[]}
 */
const DETECTION_PRIORITY = Object.freeze(['pnpm', 'bun', 'yarn', 'npm']);

/**
 * Own-property check, so inherited keys such as "toString" or "constructor"
 * coming from env vars or JSON are never mistaken for a package manager.
 * @param {unknown} value
 * @returns {value is PackageManagerName}
 */
function isPackageManagerName(value) {
  return typeof value === 'string' && Object.hasOwn(PACKAGE_MANAGERS, value);
}

/**
 * @param {PackageManagerName} name
 * @param {DetectionSource} source
 * @returns {PackageManagerResult}
 */
function result(name, source) {
  return { name, config: PACKAGE_MANAGERS[name], source };
}

/**
 * Parse JSON, returning null instead of throwing on malformed input.
 * @param {string | null} content
 * @returns {unknown}
 */
function parseJsonOrNull(content) {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Read the `packageManager` key of a parsed config object, if it names a known manager.
 * @param {unknown} parsed
 * @returns {PackageManagerName | null}
 */
function configuredManager(parsed) {
  if (parsed && typeof parsed === 'object' && 'packageManager' in parsed && isPackageManagerName(parsed.packageManager)) {
    return parsed.packageManager;
  }
  return null;
}

/** Global config file path */
function getConfigPath() {
  return path.join(getClaudeDir(), 'package-manager.json');
}

/**
 * Load saved package manager configuration
 * @returns {Record<string, unknown> | null}
 */
function loadConfig() {
  const parsed = parseJsonOrNull(readFile(getConfigPath()));
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? /** @type {Record<string, unknown>} */ (parsed) : null;
}

/**
 * Save package manager configuration
 * @param {Record<string, unknown>} config
 */
function saveConfig(config) {
  writeFile(getConfigPath(), JSON.stringify(config, null, 2));
}

/**
 * Detect package manager from lock file in project directory
 * @param {string} [projectDir]
 * @returns {PackageManagerName | null}
 */
function detectFromLockFile(projectDir = process.cwd()) {
  for (const pmName of DETECTION_PRIORITY) {
    const pm = PACKAGE_MANAGERS[pmName];
    const lockFileNames = [pm.lockFile, ...(pm.lockFileAliases ?? [])];

    if (lockFileNames.some(lockFileName => fs.existsSync(path.join(projectDir, lockFileName)))) {
      return pmName;
    }
  }
  return null;
}

/**
 * Detect package manager from package.json packageManager field
 * @param {string} [projectDir]
 * @returns {PackageManagerName | null}
 */
function detectFromPackageJson(projectDir = process.cwd()) {
  const pkg = parseJsonOrNull(readFile(path.join(projectDir, 'package.json')));
  if (!pkg || typeof pkg !== 'object' || !('packageManager' in pkg) || typeof pkg.packageManager !== 'string') {
    return null;
  }
  // Format: "pnpm@8.6.0" or just "pnpm"
  const [pmName] = pkg.packageManager.split('@');
  return isPackageManagerName(pmName) ? pmName : null;
}

/**
 * Get available package managers (installed on system)
 *
 * WARNING: This spawns child processes (where.exe on Windows, which on Unix)
 * for each package manager. Do NOT call this during session startup hooks —
 * it can exceed Bun's spawn limit on Windows and freeze the plugin.
 * Use detectFromLockFile() or detectFromPackageJson() for hot paths.
 *
 * @returns {PackageManagerName[]}
 */
function getAvailablePackageManagers() {
  return /** @type {PackageManagerName[]} */ (Object.keys(PACKAGE_MANAGERS)).filter(pmName => commandExists(pmName));
}

/**
 * Get the package manager to use for current project
 *
 * Detection priority:
 * 1. Environment variable CLAUDE_PACKAGE_MANAGER
 * 2. Project-specific config (in .claude/package-manager.json)
 * 3. package.json packageManager field
 * 4. Lock file detection
 * 5. Global user preference (in ~/.claude/package-manager.json)
 * 6. Default to npm (no child processes spawned)
 *
 * @param {PackageManagerOptions} [options]
 * @returns {PackageManagerResult}
 */
function getPackageManager(options = {}) {
  const { projectDir = process.cwd() } = options;

  // 1. Check environment variable
  const envPm = process.env.CLAUDE_PACKAGE_MANAGER;
  if (isPackageManagerName(envPm)) {
    return result(envPm, 'environment');
  }

  // 2. Check project-specific config
  const fromProjectConfig = configuredManager(parseJsonOrNull(readFile(path.join(projectDir, '.claude', 'package-manager.json'))));
  if (fromProjectConfig) {
    return result(fromProjectConfig, 'project-config');
  }

  // 3. Check package.json packageManager field
  const fromPackageJson = detectFromPackageJson(projectDir);
  if (fromPackageJson) {
    return result(fromPackageJson, 'package.json');
  }

  // 4. Check lock file
  const fromLockFile = detectFromLockFile(projectDir);
  if (fromLockFile) {
    return result(fromLockFile, 'lock-file');
  }

  // 5. Check global user preference
  const fromGlobalConfig = configuredManager(loadConfig());
  if (fromGlobalConfig) {
    return result(fromGlobalConfig, 'global-config');
  }

  // 6. Default to npm (always available with Node.js)
  // NOTE: Previously this called getAvailablePackageManagers() which spawns
  // child processes (where.exe/which) for each PM. This caused plugin freezes
  // on Windows (see #162) because session-start hooks run during Bun init,
  // and the spawned processes exceed Bun's spawn limit.
  // Steps 1-5 already cover all config-based and file-based detection.
  // If none matched, npm is the safe default.
  return result('npm', 'default');
}

/**
 * @param {unknown} pmName
 * @returns {asserts pmName is PackageManagerName}
 */
function assertPackageManagerName(pmName) {
  if (!isPackageManagerName(pmName)) {
    throw new Error(`Unknown package manager: ${pmName}`);
  }
}

/**
 * @param {unknown} err
 * @returns {string}
 */
function messageOf(err) {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Set user's preferred package manager (global)
 * @param {string} pmName
 * @returns {Record<string, unknown> & SavedPreference}
 * @throws {Error} If pmName is unknown or the preference cannot be saved
 */
function setPreferredPackageManager(pmName) {
  assertPackageManagerName(pmName);

  const config = { ...loadConfig(), packageManager: pmName, setAt: new Date().toISOString() };

  try {
    saveConfig(config);
  } catch (err) {
    throw new Error(`Failed to save package manager preference: ${messageOf(err)}`, { cause: err });
  }

  return config;
}

/**
 * Set project's preferred package manager
 * @param {string} pmName
 * @param {string} [projectDir]
 * @returns {SavedPreference}
 * @throws {Error} If pmName is unknown or the config cannot be written
 */
function setProjectPackageManager(pmName, projectDir = process.cwd()) {
  assertPackageManagerName(pmName);

  const configPath = path.join(projectDir, '.claude', 'package-manager.json');
  /** @type {SavedPreference} */
  const config = {
    packageManager: pmName,
    setAt: new Date().toISOString()
  };

  try {
    writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    throw new Error(`Failed to save package manager config to ${configPath}: ${messageOf(err)}`, { cause: err });
  }
  return config;
}

// Allowed characters in script/binary names: alphanumeric, dash, underscore, dot, slash, @
// This prevents shell metacharacter injection while allowing scoped packages (e.g., @scope/pkg)
const SAFE_NAME_REGEX = /^[@a-zA-Z0-9_./-]+$/;

/**
 * Get the command to run a script
 * @param {string} script Script name (e.g., "dev", "build", "test")
 * @param {PackageManagerOptions} [options]
 * @returns {string}
 * @throws {Error} If script name contains unsafe characters
 */
function getRunCommand(script, options = {}) {
  if (!script || typeof script !== 'string') {
    throw new Error('Script name must be a non-empty string');
  }
  if (!SAFE_NAME_REGEX.test(script)) {
    throw new Error(`Script name contains unsafe characters: ${script}`);
  }

  const { config } = getPackageManager(options);

  switch (script) {
    case 'install':
      return config.installCmd;
    case 'test':
      return config.testCmd;
    case 'build':
      return config.buildCmd;
    case 'dev':
      return config.devCmd;
    default:
      return `${config.runCmd} ${script}`;
  }
}

// Allowed characters in arguments: alphanumeric, spaces/tabs, dashes, dots, slashes,
// equals, colons, commas, quotes, @. Rejects shell metacharacters like ; | & ` $ ( ) { } < > !
// Line breaks are rejected too: a shell treats "\n" exactly like ";", so
// "file.js\necho injected" would run a second command.
const SAFE_ARGS_REGEX = /^[@a-zA-Z0-9 \t_./:=,'"*+-]+$/;

/**
 * Get the command to execute a package binary
 * @param {string} binary Binary name (e.g., "prettier", "eslint")
 * @param {string} [args] Arguments to pass
 * @param {PackageManagerOptions} [options]
 * @returns {string}
 * @throws {Error} If binary name or args contain unsafe characters
 */
function getExecCommand(binary, args = '', options = {}) {
  if (!binary || typeof binary !== 'string') {
    throw new Error('Binary name must be a non-empty string');
  }
  if (!SAFE_NAME_REGEX.test(binary)) {
    throw new Error(`Binary name contains unsafe characters: ${binary}`);
  }
  if (args && typeof args === 'string' && !SAFE_ARGS_REGEX.test(args)) {
    throw new Error(`Arguments contain unsafe characters: ${args}`);
  }

  const { config } = getPackageManager(options);
  return `${config.execCmd} ${binary}${args ? ' ' + args : ''}`;
}

/**
 * Interactive prompt for package manager selection
 * Returns a message for Claude to show to user
 *
 * NOTE: Does NOT spawn child processes to check availability.
 * Lists all supported PMs and shows how to configure preference.
 *
 * @returns {string}
 */
function getSelectionPrompt() {
  return [
    '[PackageManager] No package manager preference detected.',
    `Supported package managers: ${Object.keys(PACKAGE_MANAGERS).join(', ')}`,
    '',
    'To set your preferred package manager:',
    '  - Global: Set CLAUDE_PACKAGE_MANAGER environment variable',
    '  - Or add to ~/.claude/package-manager.json: {"packageManager": "pnpm"}',
    '  - Or add to package.json: {"packageManager": "pnpm@8"}',
    '  - Or add a lock file to your project (e.g., pnpm-lock.yaml)',
    ''
  ].join('\n');
}

/**
 * Escape regex metacharacters in a string before interpolating into a pattern
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @type {Readonly<Record<string, readonly string[]>>} */
const COMMAND_PATTERNS = Object.freeze({
  dev: ['npm run dev', 'pnpm( run)? dev', 'yarn dev', 'bun run dev'],
  install: ['npm install', 'pnpm install', 'yarn( install)?', 'bun install'],
  test: ['npm test', 'pnpm test', 'yarn test', 'bun test'],
  build: ['npm run build', 'pnpm( run)? build', 'yarn build', 'bun run build']
});

/**
 * Generate a regex pattern that matches commands for all package managers
 * @param {string} action Action pattern (e.g., "run dev", "install", "test")
 * @returns {string} Parenthesized alternation, e.g. "(npm run dev|pnpm( run)? dev|...)"
 */
function getCommandPattern(action) {
  // Trim spaces from action to handle leading/trailing whitespace gracefully
  const trimmedAction = action.trim();
  const known = Object.hasOwn(COMMAND_PATTERNS, trimmedAction) ? COMMAND_PATTERNS[trimmedAction] : undefined;

  // Generic run command — escape regex metacharacters in action
  const escaped = escapeRegex(trimmedAction);
  const patterns = known ?? [`npm run ${escaped}`, `pnpm( run)? ${escaped}`, `yarn ${escaped}`, `bun run ${escaped}`];

  return `(${patterns.join('|')})`;
}

module.exports = {
  PACKAGE_MANAGERS,
  DETECTION_PRIORITY,
  getPackageManager,
  setPreferredPackageManager,
  setProjectPackageManager,
  getAvailablePackageManagers,
  detectFromLockFile,
  detectFromPackageJson,
  getRunCommand,
  getExecCommand,
  getSelectionPrompt,
  getCommandPattern
};
