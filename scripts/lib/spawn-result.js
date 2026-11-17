// @ts-check
'use strict';

/**
 * Reading spawnSync results for hook runners.
 *
 * A hook may exit without reading all of its stdin: a guard that blocks on the
 * first bytes, or a script that ignores input. spawnSync then reports an error
 * from writing the input (EPIPE on Linux and macOS, EOF on Windows) even though
 * the child exited normally with a status. That status is the hook's answer
 * (exit 2 blocks the tool call), so treating the write error as a failed run
 * would turn a block into an allow.
 */

/** Errors spawnSync reports when the child closed stdin before reading all input. */
const STDIN_WRITE_ERRORS = new Set(['EPIPE', 'EOF']);

/**
 * @typedef {{ error?: (Error & { code?: string }) | undefined, status: number | null, signal: NodeJS.Signals | string | null }} SpawnOutcome
 */

/**
 * The error that means the child did not run to completion, or null.
 * A stdin write error (EPIPE, or EOF on Windows) from a child that exited with
 * a status is not such an error.
 * @param {SpawnOutcome} result
 * @returns {Error | null}
 */
function spawnRunError(result) {
  const error = result && result.error;
  if (!error) return null;
  if (STDIN_WRITE_ERRORS.has(error.code || '') && Number.isInteger(result.status) && !result.signal) return null;
  return error;
}

/**
 * Whether the child failed to run to completion: a real spawn error, a signal,
 * or no exit status.
 * @param {SpawnOutcome} result
 * @returns {boolean}
 */
function spawnFailed(result) {
  return Boolean(spawnRunError(result) || result.signal || result.status === null);
}

module.exports = { spawnRunError, spawnFailed };
