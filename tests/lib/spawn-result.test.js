'use strict';

const assert = require('node:assert');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');

const { spawnRunError, spawnFailed } = require('../../scripts/lib/spawn-result');

const epipe = () => Object.assign(new Error('spawnSync node EPIPE'), { code: 'EPIPE' });

test('a clean exit is neither an error nor a failure', () => {
  const result = { status: 2, signal: null };
  assert.strictEqual(spawnRunError(result), null);
  assert.strictEqual(spawnFailed(result), false);
});

test('EPIPE from a child that exited with a status is not a failure', () => {
  const result = { error: epipe(), status: 2, signal: null };
  assert.strictEqual(spawnRunError(result), null);
  assert.strictEqual(spawnFailed(result), false);
});

test('EOF, which Windows reports for the same case, is not a failure either', () => {
  const eof = Object.assign(new Error('spawnSync node.exe EOF'), { code: 'EOF' });
  const result = { error: eof, status: 2, signal: null };
  assert.strictEqual(spawnRunError(result), null);
  assert.strictEqual(spawnFailed(result), false);
  assert.strictEqual(spawnFailed({ error: eof, status: null, signal: null }), true);
});

test('EPIPE without a status, or with a signal, is still a failure', () => {
  assert.ok(spawnRunError({ error: epipe(), status: null, signal: null }));
  assert.strictEqual(spawnFailed({ error: epipe(), status: null, signal: null }), true);
  assert.strictEqual(spawnFailed({ error: epipe(), status: 0, signal: 'SIGKILL' }), true);
});

test('other spawn errors, signals and a missing status are failures', () => {
  const timeout = Object.assign(new Error('spawnSync node ETIMEDOUT'), { code: 'ETIMEDOUT' });
  assert.strictEqual(spawnRunError({ error: timeout, status: 0, signal: null }), timeout);
  assert.strictEqual(spawnFailed({ error: timeout, status: 0, signal: null }), true);
  assert.strictEqual(spawnFailed({ status: null, signal: 'SIGTERM' }), true);
  assert.strictEqual(spawnFailed({ status: null, signal: null }), true);
});

test('a real child that ignores a large stdin keeps its exit status', () => {
  const result = spawnSync(process.execPath, ['-e', 'process.exit(2)'], { input: 'x'.repeat(512 * 1024) });
  assert.strictEqual(result.status, 2);
  assert.strictEqual(spawnFailed(result), false);
});
