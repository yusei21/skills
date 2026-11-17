'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { toCursorAgentFileName, toCursorAgentRelativePath } = require('../../scripts/lib/cursor-agent-names');

test('a bare file name gets the yus- prefix', () => {
  assert.equal(toCursorAgentFileName('planner.md'), 'yus-planner.md');
  assert.equal(toCursorAgentFileName('code-reviewer.md'), 'yus-code-reviewer.md');
});

test('an already prefixed name is left alone, so the transform is idempotent', () => {
  assert.equal(toCursorAgentFileName('yus-planner.md'), 'yus-planner.md');
  assert.equal(toCursorAgentFileName(toCursorAgentFileName('planner.md')), 'yus-planner.md');
});

test('empty and missing names pass through unchanged', () => {
  assert.equal(toCursorAgentFileName(''), '');
  assert.equal(toCursorAgentFileName(undefined), undefined);
  assert.equal(toCursorAgentFileName(null), null);
});

test('only a leading, lowercase yus- counts as the prefix', () => {
  assert.equal(toCursorAgentFileName('my-yus-agent.md'), 'yus-my-yus-agent.md');
  assert.equal(toCursorAgentFileName('YUS-planner.md'), 'yus-YUS-planner.md');
  assert.equal(toCursorAgentFileName('yus.md'), 'yus-yus.md');
  assert.equal(toCursorAgentFileName('yus_planner.md'), 'yus-yus_planner.md');
});

test('a relative path keeps its directories and renames only the last segment', () => {
  assert.equal(toCursorAgentRelativePath('review/planner.md'), path.join('review', 'yus-planner.md'));
  assert.equal(toCursorAgentRelativePath('a/b/c.md'), path.join('a', 'b', 'yus-c.md'));
  assert.equal(toCursorAgentRelativePath('yus-review/planner.md'), path.join('yus-review', 'yus-planner.md'));
});

test('a path without directories behaves like a bare file name', () => {
  assert.equal(toCursorAgentRelativePath('planner.md'), 'yus-planner.md');
  assert.equal(toCursorAgentRelativePath('yus-planner.md'), 'yus-planner.md');
});

test('backslash and repeated separators are normalized to the platform separator', () => {
  assert.equal(toCursorAgentRelativePath('review\\planner.md'), path.join('review', 'yus-planner.md'));
  assert.equal(toCursorAgentRelativePath('review//planner.md'), path.join('review', 'yus-planner.md'));
  assert.equal(toCursorAgentRelativePath('review\\\\sub/planner.md'), path.join('review', 'sub', 'yus-planner.md'));
});

test('a trailing separator is dropped and the last real segment is renamed', () => {
  assert.equal(toCursorAgentRelativePath('review/planner.md/'), path.join('review', 'yus-planner.md'));
});

test('empty, missing, and separator-only paths come back unchanged', () => {
  assert.equal(toCursorAgentRelativePath(''), '');
  assert.equal(toCursorAgentRelativePath(undefined), undefined);
  assert.equal(toCursorAgentRelativePath(null), null);
  assert.equal(toCursorAgentRelativePath('/'), '/');
  assert.equal(toCursorAgentRelativePath('\\\\'), '\\\\');
});

test('the result is always relative to the destination root', () => {
  // The executor joins the result under the target agents directory, so a
  // leading separator must not be able to re-root the destination.
  const result = toCursorAgentRelativePath('/etc/planner.md');
  assert.equal(result, path.join('etc', 'yus-planner.md'));
  assert.equal(path.isAbsolute(result), false);
});

test('dot segments are not interpreted; the transform renames, it does not resolve', () => {
  // The executor walks real directory entries, so these never reach the
  // transform in practice. Pin that it does not quietly collapse them either.
  assert.equal(toCursorAgentRelativePath('./planner.md'), path.join('.', 'yus-planner.md'));
  assert.equal(toCursorAgentRelativePath('../planner.md'), path.join('..', 'yus-planner.md'));
});

test('the relative path transform composes the file name transform', () => {
  for (const file of ['planner.md', 'yus-planner.md', 'README']) {
    assert.equal(toCursorAgentRelativePath(`nested/${file}`), path.join('nested', toCursorAgentFileName(file)));
  }
});
