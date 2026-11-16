'use strict';

const assert = require('node:assert');
const { test } = require('node:test');

const { filterMcpConfig, parseDisabledMcpServers } = require('../../scripts/lib/mcp-config');

  test('parseDisabledMcpServers dedupes and trims values', () => {
    assert.deepStrictEqual(
      parseDisabledMcpServers(' github,exa ,github,,playwright '),
      ['github', 'exa', 'playwright']
    );
  });

  test('filterMcpConfig removes disabled servers and preserves others', () => {
    const result = filterMcpConfig({
      mcpServers: {
        github: { command: 'npx' },
        exa: { url: 'https://mcp.exa.ai/mcp' },
        memory: { command: 'npx' },
      },
      _comments: { usage: 'demo' },
    }, ['github', 'memory']);

    assert.deepStrictEqual(result.removed, ['github', 'memory']);
    assert.deepStrictEqual(Object.keys(result.config.mcpServers), ['exa']);
    assert.deepStrictEqual(result.config._comments, { usage: 'demo' });
  });

  test('filterMcpConfig leaves config unchanged when no disabled servers are provided', () => {
    const result = filterMcpConfig({
      mcpServers: {
        github: { command: 'npx' },
      },
    }, []);

    assert.deepStrictEqual(result.removed, []);
    assert.deepStrictEqual(Object.keys(result.config.mcpServers), ['github']);
  });
