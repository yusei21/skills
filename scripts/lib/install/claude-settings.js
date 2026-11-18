// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual } = require('util');
const { writeFileAtomic } = require('../atomic-write');
const {
  acquireSettingsLock,
  errorCode,
  runWithSettingsLock,
  sameFileIdentity,
} = require('./claude-settings-lock');

/** @typedef {Record<string, unknown>} JsonObject */
/**
 * A validated hook entry: `id` and `hooks` are checked, the rest is passed through.
 * @typedef {JsonObject & { id: string, hooks: JsonObject[] }} HookEntry
 */
/** @typedef {Record<string, HookEntry[]>} ManagedHooks */
/** @typedef {JsonObject & { hooks?: Record<string, unknown[]> }} ClaudeSettings */
/** @typedef {{ event: string, id: string }} HookReference */
/** @typedef {HookReference & { expected: HookEntry, actual: JsonObject }} HookDrift */
/**
 * @typedef {{ exists: false, raw: null, settings: ClaudeSettings, mode: number }
 *   | { exists: true, raw: string, settings: ClaudeSettings, mode: number, dev: bigint, ino: bigint }
 * } SettingsSnapshot
 */
/**
 * @typedef {object} MergeOptions
 * @property {unknown} [previousManagedHooks] Hooks recorded by the previous install.
 * @property {string} [mode] `merge` (default) or `repair`.
 * @property {boolean} [repair] Same as `mode: 'repair'`.
 */
/**
 * @typedef {object} UpdateSettingsOptions
 * @property {number} [maxAttempts] Retries when the file changes mid-update (default 3).
 * @property {() => void} [beforeCommit] Test seam, runs after the transform.
 * @property {boolean} [lockHeld] The caller already holds the settings lock.
 */
/** @typedef {Pick<typeof fs, 'readFileSync'>} SettingsReader */

/**
 * @param {string} message
 * @param {string} code
 * @returns {Error & { code: string }}
 */
function codedError(message, code) {
  return Object.assign(new Error(message), { code });
}

const CLAUDE_SETTINGS_FILENAME = 'settings.json';
const CLAUDE_HOOKS_CONFIG_PATH = 'hooks/hooks.json';
const PLUGIN_ROOT_PLACEHOLDER = '${CLAUDE_PLUGIN_ROOT}';
const PLUGIN_ROOT_ENV_PROLOGUE = 'var e=process.env.CLAUDE_PLUGIN_ROOT;';
const PLUGIN_ROOT_ENV_READ = /\bprocess\.env\.CLAUDE_PLUGIN_ROOT\b(?!\s*=)/;
const VALID_EVENTS = new Set([
  'SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PermissionRequest',
  'PostToolUse', 'PostToolUseFailure', 'Notification', 'SubagentStart',
  'Stop', 'SubagentStop', 'PreCompact', 'InstructionsLoaded',
  'TeammateIdle', 'TaskCompleted', 'ConfigChange', 'WorktreeCreate',
  'WorktreeRemove', 'SessionEnd',
]);
const EVENTS_WITHOUT_MATCHER = new Set([
  'UserPromptSubmit', 'Notification', 'Stop', 'SubagentStop',
]);
const VALID_HOOK_TYPES = new Set(['command', 'http', 'prompt', 'agent']);

/**
 * @param {unknown} value
 * @returns {value is JsonObject}
 */
function isJsonObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Deep-copies arrays and plain objects; other values are returned as they are.
 * @template T
 * @param {T} value
 * @returns {T}
 */
function cloneValue(value) {
  /** @type {unknown} */
  let copy = value;
  if (Array.isArray(value)) {
    copy = value.map(cloneValue);
  } else if (isJsonObject(value)) {
    copy = Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)])
    );
  }
  return /** @type {T} */ (copy);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * @param {string} targetRoot
 * @returns {string}
 */
function getClaudeSettingsPath(targetRoot) {
  return path.join(targetRoot, CLAUDE_SETTINGS_FILENAME);
}

/**
 * @param {string} destinationPath
 * @param {string} trustedRoot
 */
function assertClaudeSettingsPath(destinationPath, trustedRoot) {
  const resolvedDestination = path.resolve(destinationPath);
  const resolvedExpected = path.resolve(getClaudeSettingsPath(trustedRoot));
  const pathsMatch = process.platform === 'win32'
    ? resolvedDestination.toLowerCase() === resolvedExpected.toLowerCase()
    : resolvedDestination === resolvedExpected;
  if (!pathsMatch) {
    throw new Error(
      `Refusing to manage Claude hooks outside the canonical settings file: ${destinationPath}`
    );
  }
}

/**
 * @param {unknown} hook
 * @param {string} label
 */
function validateHookHandler(hook, label) {
  if (!isJsonObject(hook)) {
    throw new Error(`Invalid managed hook handler at ${label}: expected a JSON object`);
  }
  if (typeof hook.type !== 'string' || !VALID_HOOK_TYPES.has(hook.type)) {
    throw new Error(`Invalid managed hook handler at ${label}: unsupported type`);
  }
  if (hook.timeout !== undefined && (typeof hook.timeout !== 'number' || hook.timeout < 0)) {
    throw new Error(`Invalid managed hook handler at ${label}: invalid timeout`);
  }

  if (hook.type === 'command') {
    const validCommand = isNonEmptyString(hook.command)
      || (Array.isArray(hook.command)
        && hook.command.length > 0
        && hook.command.every(isNonEmptyString));
    if (!validCommand) {
      throw new Error(`Invalid managed hook handler at ${label}: invalid command`);
    }
    if (hook.async !== undefined && typeof hook.async !== 'boolean') {
      throw new Error(`Invalid managed hook handler at ${label}: invalid async flag`);
    }
    return;
  }

  if (hook.async !== undefined) {
    throw new Error(`Invalid managed hook handler at ${label}: async requires command type`);
  }
  if (hook.type === 'http') {
    if (!isNonEmptyString(hook.url)) {
      throw new Error(`Invalid managed hook handler at ${label}: invalid url`);
    }
    if (
      hook.headers !== undefined
      && (!isJsonObject(hook.headers)
        || !Object.values(hook.headers).every(value => typeof value === 'string'))
    ) {
      throw new Error(`Invalid managed hook handler at ${label}: invalid headers`);
    }
    if (
      hook.allowedEnvVars !== undefined
      && (!Array.isArray(hook.allowedEnvVars)
        || !hook.allowedEnvVars.every(isNonEmptyString))
    ) {
      throw new Error(`Invalid managed hook handler at ${label}: invalid allowedEnvVars`);
    }
    return;
  }
  if (!isNonEmptyString(hook.prompt)) {
    throw new Error(`Invalid managed hook handler at ${label}: invalid prompt`);
  }
  if (hook.model !== undefined && !isNonEmptyString(hook.model)) {
    throw new Error(`Invalid managed hook handler at ${label}: invalid model`);
  }
}

/**
 * @param {unknown} managedHooks
 * @param {string} [label]
 * @returns {ManagedHooks} a deep copy
 */
function validateManagedHooks(managedHooks, label = 'managed hooks') {
  if (!isJsonObject(managedHooks)) {
    throw new Error(`Invalid ${label}: expected a JSON object`);
  }
  if (Object.keys(managedHooks).length === 0) {
    throw new Error(`Invalid ${label}: expected at least one hook event`);
  }

  const seenIds = new Set();
  for (const [event, entries] of Object.entries(managedHooks)) {
    if (!VALID_EVENTS.has(event)) {
      throw new Error(`Invalid ${label}: unsupported hook event "${event}"`);
    }
    if (!Array.isArray(entries)) {
      throw new Error(`Invalid ${label}.${event}: expected an array`);
    }
    if (entries.length === 0) {
      throw new Error(`Invalid ${label}.${event}: expected at least one hook entry`);
    }

    entries.forEach((entry, index) => {
      if (!isJsonObject(entry)) {
        throw new Error(
          `Invalid managed hook entry at ${label}.${event}[${index}]: expected a JSON object`
        );
      }
      if (typeof entry.id !== 'string' || entry.id.trim() === '') {
        throw new Error(
          `Invalid managed hook entry at ${label}.${event}[${index}]: `
          + 'expected a non-empty unique id'
        );
      }
      if (seenIds.has(entry.id)) {
        throw new Error(`Invalid ${label}: expected globally unique id "${entry.id}"`);
      }
      seenIds.add(entry.id);
      if (
        !Object.prototype.hasOwnProperty.call(entry, 'matcher')
        && !EVENTS_WITHOUT_MATCHER.has(event)
      ) {
        throw new Error(
          `Invalid managed hook entry at ${label}.${event}[${index}]: missing matcher`
        );
      }
      if (
        Object.prototype.hasOwnProperty.call(entry, 'matcher')
        && typeof entry.matcher !== 'string'
        && !isJsonObject(entry.matcher)
      ) {
        throw new Error(
          `Invalid managed hook entry at ${label}.${event}[${index}]: invalid matcher`
        );
      }
      if (!Array.isArray(entry.hooks) || entry.hooks.length === 0) {
        throw new Error(
          `Invalid managed hook entry at ${label}.${event}[${index}]: expected hooks`
        );
      }
      entry.hooks.forEach((/** @type {unknown} */ hook, /** @type {number} */ hookIndex) => {
        validateHookHandler(hook, `${label}.${event}[${index}].hooks[${hookIndex}]`);
      });
    });
  }

  return /** @type {ManagedHooks} */ (cloneValue(managedHooks));
}

/**
 * Lighter check for hooks recorded by an earlier install: ids and arrays only,
 * so a record written by an older version still uninstalls.
 * @param {unknown} managedHooks
 * @param {string} [label]
 * @returns {ManagedHooks} a deep copy
 */
function validateRecordedManagedHooks(managedHooks, label = 'recorded managed hooks') {
  if (!isJsonObject(managedHooks) || Object.keys(managedHooks).length === 0) {
    throw new Error(`Invalid ${label}: expected a non-empty JSON object`);
  }
  for (const [event, entries] of Object.entries(managedHooks)) {
    if (!isNonEmptyString(event) || !Array.isArray(entries) || entries.length === 0) {
      throw new Error(`Invalid ${label}.${event}: expected a non-empty hook array`);
    }
    const seenIds = new Set();
    entries.forEach((entry, index) => {
      if (!isJsonObject(entry) || !isNonEmptyString(entry.id) || !Array.isArray(entry.hooks)) {
        throw new Error(`Invalid hook entry at ${label}.${event}[${index}]`);
      }
      if (seenIds.has(entry.id)) {
        throw new Error(
          `Invalid ${label}: expected unique id "${entry.id}" within event "${event}"`
        );
      }
      seenIds.add(entry.id);
    });
  }
  return /** @type {ManagedHooks} */ (cloneValue(managedHooks));
}

/**
 * @param {unknown} settings
 * @param {string} [label]
 * @returns {ClaudeSettings} a deep copy
 */
function validateSettings(settings, label = 'Claude settings') {
  if (!isJsonObject(settings)) {
    throw new Error(`Invalid ${label}: expected a JSON object`);
  }

  if (Object.prototype.hasOwnProperty.call(settings, 'hooks')) {
    if (!isJsonObject(settings.hooks)) {
      throw new Error(`Invalid ${label}: expected "hooks" to be a JSON object`);
    }
    for (const [event, entries] of Object.entries(settings.hooks)) {
      if (!Array.isArray(entries)) {
        throw new Error(`Invalid ${label}: expected hooks.${event} to be an array`);
      }
    }
  }

  return /** @type {ClaudeSettings} */ (cloneValue(settings));
}

/**
 * Replaces `${CLAUDE_PLUGIN_ROOT}` in every string inside `value`, returning a copy.
 * @template T
 * @param {T} value
 * @param {string} pluginRoot
 * @returns {T}
 */
function replacePluginRootPlaceholders(value, pluginRoot) {
  if (typeof pluginRoot !== 'string') {
    throw new Error('Invalid Claude plugin root: expected a string');
  }
  /** @type {unknown} */
  let replaced = value;
  if (typeof value === 'string') {
    replaced = value.split(PLUGIN_ROOT_PLACEHOLDER).join(pluginRoot);
  } else if (Array.isArray(value)) {
    replaced = value.map(item => replacePluginRootPlaceholders(item, pluginRoot));
  } else if (isJsonObject(value)) {
    replaced = Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        replacePluginRootPlaceholders(nestedValue, pluginRoot),
      ])
    );
  }
  return /** @type {T} */ (replaced);
}

/**
 * Inlines the plugin root into hook commands that read CLAUDE_PLUGIN_ROOT.
 * Runs before validation, so malformed events, entries and handlers are
 * passed through untouched for validateManagedHooks to report.
 * @param {JsonObject} managedHooks
 * @param {string} targetRoot
 * @returns {JsonObject}
 */
function resolveManagedHookCommands(managedHooks, targetRoot) {
  const encodedRoot = Buffer.from(targetRoot, 'utf8').toString('base64');
  const rootExpression = `Buffer.from('${encodedRoot}','base64').toString('utf8')`;
  /** @param {unknown} command */
  const resolveCommand = command => {
    // Leave invalid entries intact so managed-hook validation reports them.
    if (typeof command !== 'string') {
      return command;
    }
    const resolved = command
      .split(PLUGIN_ROOT_ENV_PROLOGUE)
      .join(`var e=${rootExpression};`);
    if (PLUGIN_ROOT_ENV_READ.test(resolved)) {
      throw new Error(
        'Unable to resolve CLAUDE_PLUGIN_ROOT in a managed hook command; '
        + 'the hooks.json command prologue no longer matches the expected form'
      );
    }
    return resolved;
  };
  /** @param {unknown} hook */
  const resolveHandler = hook => {
    if (!isJsonObject(hook)) {
      return hook;
    }
    if (Array.isArray(hook.command)) {
      return { ...hook, command: hook.command.map(resolveCommand) };
    }
    if (typeof hook.command === 'string') {
      return { ...hook, command: resolveCommand(hook.command) };
    }
    return { ...hook };
  };
  /** @param {unknown} entry */
  const resolveEntry = entry => (
    isJsonObject(entry) && Array.isArray(entry.hooks)
      ? { ...entry, hooks: entry.hooks.map(resolveHandler) }
      : entry
  );
  return Object.fromEntries(
    Object.entries(managedHooks).map(([event, entries]) => [
      event,
      Array.isArray(entries) ? entries.map(resolveEntry) : entries,
    ])
  );
}

/**
 * Turns the plugin's hooks.json into the hook entries written to settings.json.
 * @param {unknown} hooksConfig
 * @param {string} targetRoot
 * @returns {ManagedHooks}
 */
function materializeManagedHooks(hooksConfig, targetRoot) {
  if (!isJsonObject(hooksConfig) || !isJsonObject(hooksConfig.hooks)) {
    throw new Error('Invalid hooks config: expected a JSON object with a hooks object');
  }
  if (!isNonEmptyString(targetRoot)) {
    throw new Error('Invalid Claude target root: expected a non-empty string');
  }
  return validateManagedHooks(resolveManagedHookCommands(
    replacePluginRootPlaceholders(hooksConfig.hooks, targetRoot),
    targetRoot
  ));
}

/**
 * @param {string} rawSettings
 * @param {string} [label]
 * @returns {ClaudeSettings}
 */
function parseSettings(rawSettings, label = 'Claude settings') {
  let settings;
  try {
    settings = JSON.parse(rawSettings);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${label}: ${reason}`, { cause: error });
  }
  return validateSettings(settings, label);
}

/**
 * Reads settings.json; a missing file is an empty object.
 * @param {string} settingsPath
 * @param {SettingsReader | { fs: SettingsReader }} [fileSystem] `fs` or a wrapper exposing it
 * @returns {ClaudeSettings}
 */
function readSettings(settingsPath, fileSystem = fs) {
  const reader = 'fs' in fileSystem && fileSystem.fs ? fileSystem.fs : /** @type {SettingsReader} */ (fileSystem);
  let rawSettings;
  try {
    rawSettings = reader.readFileSync(settingsPath, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') {
      return {};
    }
    throw error;
  }
  return parseSettings(rawSettings, `Claude settings at ${settingsPath}`);
}

/**
 * Reads settings.json through one descriptor and checks that the path still
 * points at the same regular file, so a swap mid-read is detected.
 * @param {string} settingsPath
 * @returns {SettingsSnapshot}
 */
function readSettingsSnapshot(settingsPath) {
  const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0);
  let descriptor;
  try {
    descriptor = fs.openSync(settingsPath, flags);
  } catch (error) {
    if (errorCode(error) === 'ENOENT') {
      return { exists: false, raw: null, settings: {}, mode: 0o600 };
    }
    throw error;
  }

  try {
    const descriptorStat = fs.fstatSync(descriptor, { bigint: true });
    let pathStat;
    try {
      pathStat = fs.lstatSync(settingsPath, { bigint: true });
    } catch (error) {
      if (errorCode(error) === 'ENOENT') {
        /** @type {NodeJS.ErrnoException} */ (error).code = 'YUS_SETTINGS_CHANGED';
      }
      throw error;
    }
    if (
      !descriptorStat.isFile()
      || !pathStat.isFile()
      || pathStat.isSymbolicLink()
      || !sameFileIdentity(descriptorStat, pathStat)
    ) {
      throw codedError(
        `Refusing to read changed Claude settings at ${settingsPath}`,
        'YUS_SETTINGS_CHANGED'
      );
    }
    const raw = fs.readFileSync(descriptor, 'utf8');
    return {
      exists: true,
      raw,
      settings: parseSettings(raw, `Claude settings at ${settingsPath}`),
      mode: Number(descriptorStat.mode & 0o777n),
      dev: descriptorStat.dev,
      ino: descriptorStat.ino,
    };
  } finally {
    fs.closeSync(descriptor);
  }
}

/**
 * @param {string} settingsPath
 * @param {SettingsSnapshot} snapshot
 */
function assertSettingsSnapshotUnchanged(settingsPath, snapshot) {
  let current;
  try {
    current = readSettingsSnapshot(settingsPath);
  } catch (error) {
    if (error && typeof error === 'object') {
      const coded = /** @type {{ code?: unknown }} */ (error);
      coded.code = coded.code || 'YUS_SETTINGS_CHANGED';
    }
    throw error;
  }
  const unchanged = current.exists && snapshot.exists
    ? current.raw === snapshot.raw && current.dev === snapshot.dev && current.ino === snapshot.ino
    : current.exists === snapshot.exists;
  if (!unchanged) {
    throw codedError(
      `Claude settings changed during update: ${settingsPath}`,
      'YUS_SETTINGS_CHANGED'
    );
  }
}

/**
 * Reads, transforms and rewrites settings.json under the settings lock,
 * retrying when another writer changes the file in between.
 * @template {{ settings: unknown }} R
 * @param {string} settingsPath
 * @param {(settings: ClaudeSettings) => R} transform
 * @param {UpdateSettingsOptions} [options]
 * @returns {R}
 */
function updateSettingsAtomic(settingsPath, transform, options = {}) {
  const update = () => {
    const parentPath = path.dirname(path.resolve(settingsPath));
    const parentStats = fs.lstatSync(parentPath, { bigint: true });
    const validateParent = () => {
      const current = fs.lstatSync(parentPath, { bigint: true });
      if (
        !current.isDirectory() || current.isSymbolicLink()
        || current.dev !== parentStats.dev || current.ino !== parentStats.ino
      ) {
        throw codedError(
          `Claude settings parent directory changed: ${parentPath}`,
          'YUS_SETTINGS_PARENT_CHANGED'
        );
      }
    };
    const maxAttempts = options.maxAttempts || 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        validateParent();
        const snapshot = readSettingsSnapshot(settingsPath);
        const result = transform(snapshot.settings);
        if (typeof options.beforeCommit === 'function') options.beforeCommit();
        assertSettingsSnapshotUnchanged(settingsPath, snapshot);
        writeFileAtomic(
          settingsPath,
          `${JSON.stringify(result.settings, null, 2)}\n`,
          {
            encoding: 'utf8',
            mode: snapshot.mode,
            validateParent,
            beforeRename() {
              assertSettingsSnapshotUnchanged(settingsPath, snapshot);
            },
          }
        );
        return result;
      } catch (error) {
        if (errorCode(error) !== 'YUS_SETTINGS_CHANGED' || attempt === maxAttempts) {
          throw error;
        }
      }
    }
    throw new Error(`Unable to update Claude settings at ${settingsPath}`);
  };
  if (options.lockHeld) {
    return update();
  }
  return runWithSettingsLock(settingsPath, update);
}

/**
 * @param {string} event
 * @param {string} id
 * @returns {HookReference}
 */
function reference(event, id) {
  return { event, id };
}

/** @typedef {{ entry: JsonObject, index: number }} EntryMatch */

/**
 * @param {readonly unknown[]} entries
 * @param {string} id
 * @returns {EntryMatch[]}
 */
function entriesMatchingId(entries, id) {
  /** @type {EntryMatch[]} */
  const matches = [];
  entries.forEach((entry, index) => {
    if (isJsonObject(entry) && entry.id === id) matches.push({ entry, index });
  });
  return matches;
}

/**
 * @param {readonly unknown[]} entries
 * @param {string} event
 * @param {string} id
 * @returns {EntryMatch | null}
 */
function assertUnambiguousMatch(entries, event, id) {
  const matches = entriesMatchingId(entries, id);
  if (matches.length > 1) {
    throw new Error(
      `Claude settings contains multiple hooks for event "${event}" and id "${id}"`
    );
  }
  return matches[0] || null;
}

/**
 * @param {ManagedHooks | null} managedHooks
 * @param {string} event
 * @param {string} id
 * @returns {HookEntry | null}
 */
function managedEntryFor(managedHooks, event, id) {
  const entries = managedHooks && managedHooks[event];
  if (!Array.isArray(entries)) {
    return null;
  }
  return entries.find(entry => entry.id === id) || null;
}

/**
 * Adds or updates the managed hooks in settings, removing the ones a previous
 * install recorded and no longer ships. Refuses to touch entries the user edited
 * unless repairing.
 * @param {unknown} settings
 * @param {unknown} managedHooks
 * @param {MergeOptions} [options]
 */
function mergeManagedHooks(settings, managedHooks, options = {}) {
  const validatedSettings = validateSettings(settings);
  const desiredHooks = validateManagedHooks(managedHooks);
  const previousHooks = options.previousManagedHooks === undefined
    || options.previousManagedHooks === null
    ? null
    : validateRecordedManagedHooks(options.previousManagedHooks, 'previous managed hooks');
  const repair = options.mode === 'repair' || options.repair === true;
  if (options.mode !== undefined && options.mode !== 'merge' && options.mode !== 'repair') {
    throw new Error(`Unknown Claude settings merge mode: ${options.mode}`);
  }

  /** @type {Record<string, unknown[]>} */
  let nextHooks = validatedSettings.hooks
    ? cloneValue(validatedSettings.hooks)
    : {};
  /** @type {HookReference[]} */
  const added = [];
  /** @type {HookReference[]} */
  const updated = [];
  /** @type {HookReference[]} */
  const unchanged = [];
  /** @type {HookReference[]} */
  const removed = [];

  if (previousHooks) {
    for (const [event, previousEntries] of Object.entries(previousHooks)) {
      let eventEntries = cloneValue(nextHooks[event] || []);
      for (const previousEntry of previousEntries) {
        if (managedEntryFor(desiredHooks, event, previousEntry.id)) continue;
        const match = assertUnambiguousMatch(eventEntries, event, previousEntry.id);
        if (!match) continue;
        if (!isDeepStrictEqual(match.entry, previousEntry)) {
          throw new Error(
            `Refusing to remove Claude hook for event "${event}" and id `
            + `"${previousEntry.id}" because the previous managed entry has drifted`
          );
        }
        eventEntries = eventEntries.filter((_entry, index) => index !== match.index);
        removed.push(reference(event, previousEntry.id));
      }
      nextHooks = eventEntries.length > 0
        ? { ...nextHooks, [event]: eventEntries }
        : withoutProperty(nextHooks, event);
    }
  }

  for (const [event, desiredEntries] of Object.entries(desiredHooks)) {
    let eventEntries = cloneValue(nextHooks[event] || []);
    for (const desiredEntry of desiredEntries) {
      const match = assertUnambiguousMatch(eventEntries, event, desiredEntry.id);
      if (!match) {
        eventEntries = [...eventEntries, cloneValue(desiredEntry)];
        added.push(reference(event, desiredEntry.id));
        continue;
      }
      if (isDeepStrictEqual(match.entry, desiredEntry)) {
        unchanged.push(reference(event, desiredEntry.id));
        continue;
      }

      const previousEntry = managedEntryFor(previousHooks, event, desiredEntry.id);
      if (!repair && (!previousEntry || !isDeepStrictEqual(match.entry, previousEntry))) {
        const driftReason = previousEntry ? ' because the previous managed entry has drifted' : '';
        throw new Error(
          `Refusing to overwrite Claude hook for event "${event}" and id `
          + `"${desiredEntry.id}"${driftReason}`
        );
      }

      eventEntries = eventEntries.map((entry, index) => (
        index === match.index ? cloneValue(desiredEntry) : entry
      ));
      updated.push(reference(event, desiredEntry.id));
    }
    if (desiredEntries.length > 0) {
      nextHooks = { ...nextHooks, [event]: eventEntries };
    }
  }

  const nextSettings = Object.keys(nextHooks).length > 0
    ? { ...validatedSettings, hooks: nextHooks }
    : validatedSettings;
  return {
    settings: nextSettings,
    managedHooks: cloneValue(desiredHooks),
    added,
    updated,
    unchanged,
    removed,
  };
}

/**
 * @param {unknown} settings
 * @param {unknown} managedHooks
 * @param {MergeOptions} [options]
 */
function repairManagedHooks(settings, managedHooks, options = {}) {
  return mergeManagedHooks(settings, managedHooks, {
    ...options,
    mode: 'repair',
  });
}

/**
 * Reports which managed hooks are present, missing or edited in settings.
 * @param {unknown} settings
 * @param {unknown} managedHooks
 */
function inspectManagedHooks(settings, managedHooks) {
  const validatedSettings = validateSettings(settings);
  const expectedHooks = validateManagedHooks(managedHooks);
  const settingsHooks = validatedSettings.hooks || {};
  /** @type {Record<string, JsonObject[]>} */
  const managedSubset = {};
  /** @type {HookReference[]} */
  const matched = [];
  /** @type {HookReference[]} */
  const missing = [];
  /** @type {HookDrift[]} */
  const drifted = [];

  for (const [event, expectedEntries] of Object.entries(expectedHooks)) {
    const actualEntries = settingsHooks[event] || [];
    /** @type {JsonObject[]} */
    const foundEntries = [];
    for (const expectedEntry of expectedEntries) {
      const match = assertUnambiguousMatch(actualEntries, event, expectedEntry.id);
      if (!match) {
        missing.push(reference(event, expectedEntry.id));
        continue;
      }

      foundEntries.push(cloneValue(match.entry));
      if (isDeepStrictEqual(match.entry, expectedEntry)) {
        matched.push(reference(event, expectedEntry.id));
      } else {
        drifted.push({
          ...reference(event, expectedEntry.id),
          expected: cloneValue(expectedEntry),
          actual: cloneValue(match.entry),
        });
      }
    }
    if (foundEntries.length > 0) {
      managedSubset[event] = foundEntries;
    }
  }

  const ok = missing.length === 0 && drifted.length === 0;
  return {
    status: ok ? 'ok' : (missing.length > 0 ? 'missing' : 'drifted'),
    ok,
    managedHooks: managedSubset,
    matched,
    missing,
    drifted,
  };
}

/**
 * @template {Record<string, unknown>} T
 * @param {T} object
 * @param {string} omittedKey
 * @returns {T}
 */
function withoutProperty(object, omittedKey) {
  return /** @type {T} */ (Object.fromEntries(
    Object.entries(object).filter(([key]) => key !== omittedKey)
  ));
}

/**
 * Removes the hooks an install recorded, keeping any the user has edited since.
 * @param {unknown} settings
 * @param {unknown} recordedManagedHooks
 */
function uninstallManagedHooks(settings, recordedManagedHooks) {
  const validatedSettings = validateSettings(settings);
  const recordedHooks = validateRecordedManagedHooks(recordedManagedHooks);
  const currentHooks = validatedSettings.hooks || {};

  for (const [event, recordedEntries] of Object.entries(recordedHooks)) {
    const eventEntries = currentHooks[event] || [];
    for (const recordedEntry of recordedEntries) {
      assertUnambiguousMatch(eventEntries, event, recordedEntry.id);
    }
  }

  /** @type {HookReference[]} */
  const removed = [];
  /** @type {Array<HookDrift & { reason: 'modified' }>} */
  const retained = [];
  /** @type {HookReference[]} */
  const missing = [];
  let nextHooks = cloneValue(currentHooks);

  for (const [event, recordedEntries] of Object.entries(recordedHooks)) {
    let eventEntries = nextHooks[event] || [];
    for (const recordedEntry of recordedEntries) {
      const match = assertUnambiguousMatch(eventEntries, event, recordedEntry.id);
      if (!match) {
        missing.push(reference(event, recordedEntry.id));
        continue;
      }
      if (!isDeepStrictEqual(match.entry, recordedEntry)) {
        retained.push({
          ...reference(event, recordedEntry.id),
          expected: cloneValue(recordedEntry),
          actual: cloneValue(match.entry),
          reason: 'modified',
        });
        continue;
      }

      eventEntries = eventEntries.filter((_entry, index) => index !== match.index);
      removed.push(reference(event, recordedEntry.id));
    }
    nextHooks = eventEntries.length > 0
      ? { ...nextHooks, [event]: eventEntries }
      : withoutProperty(nextHooks, event);
  }

  nextHooks = Object.fromEntries(
    Object.entries(nextHooks).filter(([, entries]) => entries.length > 0)
  );
  const settingsWithoutHooks = withoutProperty(validatedSettings, 'hooks');
  const nextSettings = Object.keys(nextHooks).length > 0
    ? { ...settingsWithoutHooks, hooks: nextHooks }
    : settingsWithoutHooks;

  return {
    settings: nextSettings,
    removed,
    retained,
    missing,
  };
}

module.exports = {
  CLAUDE_HOOKS_CONFIG_PATH,
  CLAUDE_SETTINGS_FILENAME,
  acquireSettingsLock,
  assertClaudeSettingsPath,
  getClaudeSettingsPath,
  inspectManagedHooks,
  materializeManagedHooks,
  mergeManagedHooks,
  parseSettings,
  readSettings,
  repairManagedHooks,
  replacePluginRootPlaceholders,
  runWithSettingsLock,
  updateSettingsAtomic,
  uninstallManagedHooks,
  validateManagedHooks,
  validateRecordedManagedHooks,
  validateSettings,
};
