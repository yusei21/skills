// @ts-check
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const INVALID_LOCK_STALE_MS = 5 * 60 * 1000;

/**
 * The parts of a stat result that identify a file. Path stats and descriptor
 * stats may be plain or bigint, so both number types are accepted.
 * @typedef {{ readonly dev: number | bigint, readonly ino: number | bigint }} FileIdentity
 */

/** @typedef {() => void} ReleaseSettingsLock */

/** @type {WeakMap<ReleaseSettingsLock, Readonly<FileIdentity>>} */
const acquiredLockIdentities = new WeakMap();

/**
 * @param {unknown} error
 * @returns {string | undefined}
 */
function errorCode(error) {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

/**
 * @param {FileIdentity} left
 * @param {FileIdentity} right
 * @returns {boolean}
 */
function sameFileIdentity(left, right) {
  if (left.ino !== right.ino) {
    return false;
  }
  // Node's path-based stats can omit the Windows volume serial (`dev = 0`)
  // while fstat() on the same file handle reports it. Preserve strict device
  // checks everywhere else, including when both Windows stats report a device.
  if (process.platform === 'win32' && (!left.dev || !right.dev)) {
    return true;
  }
  return left.dev === right.dev;
}

/**
 * @param {string} lockPath
 * @param {string} [label]
 * @returns {ReleaseSettingsLock}
 */
function createSettingsLock(lockPath, label = 'Claude settings') {
  const tempPath = `${lockPath}.create-${process.pid}-${crypto.randomBytes(8).toString('hex')}`;
  /** @type {number | undefined} */
  let descriptor;
  /** @type {fs.BigIntStats} */
  let ownedStats;
  try {
    descriptor = fs.openSync(tempPath, 'wx', 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify({
      pid: process.pid,
      startedAt: new Date().toISOString(),
      token: crypto.randomBytes(16).toString('hex'),
    })}\n`);
    fs.fsyncSync(descriptor);
    ownedStats = fs.fstatSync(descriptor, { bigint: true });
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.linkSync(tempPath, lockPath);
  } catch (error) {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(tempPath, { force: true });
    throw error;
  }
  fs.rmSync(tempPath, { force: true });

  let released = false;
  const release = () => {
    if (released) return;
    const quarantinePath = `${lockPath}.release-${process.pid}-${crypto.randomBytes(8).toString('hex')}`;
    fs.renameSync(lockPath, quarantinePath);
    const quarantinedStats = fs.lstatSync(quarantinePath, { bigint: true });
    if (!sameFileIdentity(quarantinedStats, ownedStats)) {
      if (!fs.existsSync(lockPath)) fs.renameSync(quarantinePath, lockPath);
      throw new Error(`Refusing to release a changed ${label} lock: ${lockPath}`);
    }
    released = true;
    fs.rmSync(quarantinePath, { force: true });
  };
  // Retain the identity observed through the creation descriptor. A pathname
  // sampled after publication may already refer to a replacement lock.
  acquiredLockIdentities.set(release, Object.freeze({ dev: ownedStats.dev, ino: ownedStats.ino }));
  return release;
}

/**
 * @param {ReleaseSettingsLock} release
 * @returns {Readonly<FileIdentity>}
 */
function getSettingsLockIdentity(release) {
  const identity = acquiredLockIdentities.get(release);
  if (!identity) throw new Error('No acquired settings lock identity for this release function.');
  return identity;
}

/**
 * @param {string} lockPath
 * @returns {{ metadata: unknown, stats: fs.BigIntStats }}
 */
function inspectSettingsLock(lockPath) {
  const descriptor = fs.openSync(lockPath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const stats = fs.fstatSync(descriptor, { bigint: true });
    const pathStats = fs.lstatSync(lockPath, { bigint: true });
    if (
      !stats.isFile()
      || pathStats.isSymbolicLink()
      || !pathStats.isFile()
      || !sameFileIdentity(stats, pathStats)
    ) {
      return { metadata: null, stats };
    }
    /** @type {unknown} */
    let metadata = null;
    try {
      metadata = JSON.parse(fs.readFileSync(descriptor, 'utf8'));
    } catch (_error) {
      // Invalid locks may be recovered only after the bounded lease below.
    }
    return { metadata, stats };
  } finally {
    fs.closeSync(descriptor);
  }
}

/**
 * The owner pid recorded in a lock file, or null when the lock is unreadable.
 * @param {unknown} metadata
 * @returns {number | null}
 */
function lockOwnerPid(metadata) {
  if (!metadata || typeof metadata !== 'object' || !('pid' in metadata)) return null;
  const { pid } = metadata;
  return typeof pid === 'number' && Number.isSafeInteger(pid) && pid > 0 ? pid : null;
}

/**
 * @param {number} pid
 * @returns {boolean}
 */
function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) !== 'ESRCH';
  }
}

/**
 * @param {string} lockPath
 * @param {string} [label]
 * @returns {ReleaseSettingsLock | null}
 */
function recoverSettingsLock(lockPath, label = 'Claude settings') {
  const recoveryPath = `${lockPath}.recover`;
  try {
    fs.mkdirSync(recoveryPath, { mode: 0o700 });
  } catch (error) {
    if (errorCode(error) === 'EEXIST') return null;
    throw error;
  }

  const quarantinePath = `${lockPath}.stale-${process.pid}-${crypto.randomBytes(8).toString('hex')}`;
  try {
    let inspected;
    try {
      inspected = inspectSettingsLock(lockPath);
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return createSettingsLock(lockPath, label);
      throw error;
    }
    const ownerPid = lockOwnerPid(inspected.metadata);
    const stale = ownerPid !== null
      ? !processIsAlive(ownerPid)
      : Date.now() - Number(inspected.stats.mtimeMs) >= INVALID_LOCK_STALE_MS;
    if (!stale) return null;

    fs.renameSync(lockPath, quarantinePath);
    const quarantinedStats = fs.lstatSync(quarantinePath, { bigint: true });
    if (!sameFileIdentity(quarantinedStats, inspected.stats)) {
      if (!fs.existsSync(lockPath)) fs.renameSync(quarantinePath, lockPath);
      return null;
    }
    fs.rmSync(quarantinePath, { force: true });
    return createSettingsLock(lockPath, label);
  } finally {
    fs.rmSync(recoveryPath, { recursive: true, force: true });
    fs.rmSync(quarantinePath, { force: true });
  }
}

/**
 * Acquire exclusive settings access, optionally waiting for another writer.
 * A recovery guard (`.yus.lock.recover`) is never removed by a contender: if its
 * owner crashes during recovery, inspect and remove the orphaned guard manually
 * only after confirming no yus process is active.
 * @param {string} settingsPath - Settings file protected by the lock
 * @param {{ label?: string, timeoutMs?: number }} [options] - Diagnostic label and bounded wait duration
 * @returns {ReleaseSettingsLock} Release callback for the acquired lock
 */
function acquireSettingsLock(settingsPath, { label = 'Claude settings', timeoutMs = 0 } = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new TypeError('Lock timeoutMs must be a finite non-negative number.');
  }
  const lockPath = `${settingsPath}.yus.lock`;
  const deadline = performance.now() + timeoutMs;
  const sleeper = new Int32Array(new SharedArrayBuffer(4));
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  while (true) {
    try {
      return createSettingsLock(lockPath, label);
    } catch (error) {
      if (errorCode(error) !== 'EEXIST') throw error;
    }
    try {
      const recovered = recoverSettingsLock(lockPath, label);
      if (recovered) return recovered;
    } catch (error) {
      // A different writer can acquire or release between inspection and recovery.
      const code = errorCode(error);
      if (code !== 'EEXIST' && !(timeoutMs > 0 && code === 'ENOENT')) throw error;
    }
    const remaining = deadline - performance.now();
    if (remaining <= 0) {
      throw new Error(
        `Another yus process is updating ${label}: ${settingsPath}. `
        + `If no yus process is active, inspect and remove ${lockPath}.`
      );
    }
    Atomics.wait(sleeper, 0, 0, Math.min(10, remaining));
  }
}

/**
 * Run `callback` while holding the settings lock. A failure to release is
 * attached to the callback's error as `releaseError`, or thrown on its own.
 * @template T
 * @param {string} settingsPath
 * @param {() => T} callback
 * @returns {T}
 */
function runWithSettingsLock(settingsPath, callback) {
  const releaseLock = acquireSettingsLock(settingsPath);
  /** @type {unknown} */
  let primaryError = null;
  /** @type {T | undefined} */
  let result;
  try {
    result = callback();
  } catch (error) {
    primaryError = error;
  }

  /** @type {unknown} */
  let releaseError = null;
  try {
    releaseLock();
  } catch (error) {
    releaseError = error;
  }

  if (primaryError) {
    if (releaseError && typeof primaryError === 'object') {
      Object.assign(primaryError, { releaseError });
    }
    throw primaryError;
  }
  if (releaseError) throw releaseError;
  return /** @type {T} */ (result);
}

module.exports = {
  acquireSettingsLock,
  errorCode,
  getSettingsLockIdentity,
  runWithSettingsLock,
  sameFileIdentity,
};
