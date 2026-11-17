/**
 * Tests for allowlisted yus2 control-pane actions.
 */

const assert = require('node:assert');
const { test } = require('node:test');
const path = require('path');

const {
  buildControlPaneActions,
  buildControlPaneAction,
  shellQuote,
} = require('../../scripts/lib/control-pane/actions');

  test('builds copyable and executable allowlisted yus2 actions', () => {
    const repoRoot = path.join(__dirname, '..', '..');
    const actions = buildControlPaneActions({
      repoRoot,
      query: 'Hermes Desktop Zellij',
      limit: 25,
    });

    assert.ok(actions.some(action => action.id === 'sync-knowledge'));
    assert.ok(actions.some(action => action.id === 'recall-knowledge'));
    assert.ok(actions.some(action => action.id === 'open-dashboard'));

    const sync = actions.find(action => action.id === 'sync-knowledge');
    assert.strictEqual(sync.executable, true);
    assert.strictEqual(sync.command, 'cargo');
    assert.deepStrictEqual(sync.args, [
      'run',
      '--quiet',
      '--',
      'graph',
      'connector-sync',
      '--all',
      '--json',
      '--limit',
      '25',
    ]);
    assert.strictEqual(sync.cwd, path.join(repoRoot, 'yus2'));
    assert.ok(sync.commandLine.includes('connector-sync'));
  });

  test('preserves recall query as a single argument instead of shell text', () => {
    const action = buildControlPaneAction('recall-knowledge', {
      repoRoot: '/repo/yus',
      query: 'Hermes "Desktop"; rm -rf ~',
      limit: 7,
    });

    assert.deepStrictEqual(action.args, [
      'run',
      '--quiet',
      '--',
      'graph',
      'recall',
      'Hermes "Desktop"; rm -rf ~',
      '--json',
      '--limit',
      '7',
    ]);
    assert.ok(action.commandLine.includes("'Hermes \"Desktop\"; rm -rf ~'"));
  });

  test('rejects unknown action identifiers', () => {
    assert.throws(
      () => buildControlPaneAction('rm -rf', { repoRoot: '/repo/yus' }),
      /Unknown control-pane action/
    );
  });

  test('shellQuote handles empty strings and single quotes', () => {
    assert.strictEqual(shellQuote(''), "''");
    assert.strictEqual(shellQuote("can't"), "'can'\\''t'");
    assert.strictEqual(shellQuote('simple'), 'simple');
  });
