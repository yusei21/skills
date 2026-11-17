/**
 * Tests for scripts/lib/agent-data-home.js
 *
 * Run with: node tests/lib/agent-data-home.test.js
 *
 * Cwd / project context: many cases use `withIsolatedCwd()` (empty temp dir, no
 * `.cursor/`) so results do not depend on running inside a dogfooded yus repo.
 * When this repo has `.cursor/yus-agent-data.json` installed, `resolveAgentDataHome()`
 * from the real project root intentionally resolves to `~/.cursor/yus` — see the
 * dedicated test below; do not expect `~/.claude` while cwd is the yus tree.
 */

const assert = require('node:assert');
const { test } = require('node:test');
const fs = require('fs');
const os = require('os');
const path = require('path');

function withEnv(overrides, fn) {
  const previous = {};
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key];
    if (overrides[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = overrides[key];
    }
  }

  try {
    fn();
  } finally {
    for (const key of Object.keys(previous)) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
    delete require.cache[require.resolve('../../scripts/lib/agent-data-home')];
  }
}

/**
 * Run fn with cwd in an empty directory (no .cursor/) so resolveProjectDir() does
 * not pick up the yus repo's installed agent-data config.
 */
function withIsolatedCwd(fn) {
  const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-'));
  const originalCwd = process.cwd();
  try {
    process.chdir(isolatedDir);
    return fn(isolatedDir);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(isolatedDir, { recursive: true, force: true });
  }
}

function captureConsoleErrors(fn) {
  const originalError = console.error;
  const messages = [];
  console.error = (...args) => {
    messages.push(args.join(' '));
  };

  try {
    return { result: fn(), messages };
  } finally {
    console.error = originalError;
  }
}

  test('defaults to ~/.claude outside Cursor (isolated cwd)', () => {
    withIsolatedCwd(() => {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CLAUDE_CONFIG_DIR: undefined,
        CURSOR_VERSION: undefined,
        CURSOR_PROJECT_DIR: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const home = os.homedir();
        assert.strictEqual(
          agentDataHome.resolveAgentDataHome(),
          path.join(home, '.claude')
        );
      });
    });
  });

  test('resolveAgentDataHome uses projectDir + .cursor/yus-agent-data.json', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-project-'));
    const cursorDir = path.join(projectDir, '.cursor');
    fs.mkdirSync(cursorDir, { recursive: true });
    fs.writeFileSync(
      path.join(cursorDir, 'yus-agent-data.json'),
      JSON.stringify({ agentDataHome: '~/.cursor/yus' }),
      'utf8'
    );

    try {
      withIsolatedCwd(() => {
        withEnv({
          YUS_AGENT_DATA_HOME: undefined,
          CURSOR_VERSION: undefined,
          CURSOR_PROJECT_DIR: undefined,
        }, () => {
          const agentDataHome = require('../../scripts/lib/agent-data-home');
          assert.strictEqual(
            agentDataHome.resolveAgentDataHome({ projectDir }),
            // Project-config trust checks canonicalize the existing home ancestor.
            path.join(fs.realpathSync(os.homedir()), '.cursor', 'yus')
          );
        });
      });
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  });

  test('defaults to ~/.cursor/yus in Cursor hook runtime (isolated cwd)', () => {
    withIsolatedCwd(() => {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CURSOR_VERSION: '1.0.0',
        CURSOR_PROJECT_DIR: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const home = os.homedir();
        assert.strictEqual(
          agentDataHome.resolveAgentDataHome(),
          path.join(home, '.cursor', 'yus')
        );
      });
    });
  });

  test('honors YUS_AGENT_DATA_HOME over Cursor default', () => {
    const override = path.join(os.tmpdir(), `yus-override-${Date.now()}`);
    withEnv({
      YUS_AGENT_DATA_HOME: override,
      CURSOR_VERSION: '1.0.0',
    }, () => {
      const agentDataHome = require('../../scripts/lib/agent-data-home');
      assert.strictEqual(agentDataHome.resolveAgentDataHome(), path.resolve(override));
    });
  });

  test('reads project yus-agent-data.json config file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-read-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-user-'));
    const configPath = path.join(tmpDir, '.cursor', 'yus-agent-data.json');
    const customHome = path.join(homeDir, '.cursor', 'yus', 'custom');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({ agentDataHome: customHome }),
      'utf8'
    );

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CURSOR_VERSION: undefined,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(
          agentDataHome.readProjectConfigAt(configPath),
          path.join(fs.realpathSync(homeDir), '.cursor', 'yus', 'custom')
        );
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('allows the documented ~/.claude project sharing root and its descendants', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-claude-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-claude-user-'));
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.mkdirSync(path.join(homeDir, '.claude'), { recursive: true });

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const cases = [
          {
            candidate: '~/.claude',
            expected: path.join(fs.realpathSync(homeDir), '.claude'),
          },
          {
            candidate: '~/.claude/shared',
            expected: path.join(fs.realpathSync(homeDir), '.claude', 'shared'),
          },
        ];

        for (const { candidate, expected } of cases) {
          fs.writeFileSync(
            configPath,
            JSON.stringify({ agentDataHome: candidate }),
            'utf8'
          );
          assert.strictEqual(
            agentDataHome.readProjectConfigAt(configPath),
            expected
          );
        }
      });
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('rejects a relative agentDataHome that redirects into the project', () => {
    const stamp = Date.now();
    const projectDir = path.join(os.tmpdir(), `yus-agent-data-home-relative-${stamp}`);
    const cursorDir = path.join(projectDir, '.cursor');
    const otherCwd = path.join(os.tmpdir(), `yus-agent-data-home-other-cwd-${stamp}`);
    const homeDir = path.join(os.tmpdir(), `yus-agent-data-home-relative-user-${stamp}`);
    fs.mkdirSync(cursorDir, { recursive: true });
    fs.mkdirSync(otherCwd, { recursive: true });
    fs.mkdirSync(homeDir, { recursive: true });
    const configPath = path.join(cursorDir, 'yus-agent-data.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ agentDataHome: '.yus-data' }),
      'utf8'
    );

    const originalCwd = process.cwd();
    try {
      process.chdir(otherCwd);
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CURSOR_VERSION: undefined,
        CURSOR_PROJECT_DIR: projectDir,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const { result, messages } = captureConsoleErrors(
          () => agentDataHome.readProjectConfigAt(configPath)
        );
        assert.strictEqual(result, null);
        assert.ok(messages.some(message => message.includes('Ignoring unsafe agent data project config')));
        assert.ok(messages.every(message => !message.includes('.yus-data')));
        assert.strictEqual(
          captureConsoleErrors(
            () => agentDataHome.resolveAgentDataHome({ projectDir, preferCursorDefault: true })
          ).result,
          path.join(homeDir, '.cursor', 'yus')
        );
      });
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(otherCwd, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('rejects relative project config paths even when the project is beneath the trusted root', () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-nested-user-'));
    const projectDir = path.join(homeDir, '.cursor', 'yus', 'checked-out-project');
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    const candidate = '.repo-data';
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: candidate }), 'utf8');

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const { result, messages } = captureConsoleErrors(
          () => agentDataHome.readProjectConfigAt(configPath)
        );
        assert.strictEqual(result, null);
        assert.ok(messages.some(message => message.includes('Ignoring unsafe agent data project config')));
        assert.ok(messages.every(message => !message.includes(candidate)));
      });
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('rejects traversal and absolute project config paths outside the allowed data roots', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-unsafe-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-unsafe-user-'));
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const unsafeCandidates = [
          '../../repo-data',
          path.join(projectDir, 'absolute-data'),
          '~/.cursor/yus/profiles/../traversed-data',
          '~/.claude/profiles/../traversed-data',
          '~/.claude-other',
          '~/.config/yus',
          '~',
          path.join(homeDir, 'arbitrary-agent-data'),
        ];
        for (const candidate of unsafeCandidates) {
          fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: candidate }), 'utf8');
          const { result, messages } = captureConsoleErrors(
            () => agentDataHome.readProjectConfigAt(configPath)
          );
          assert.strictEqual(result, null);
          assert.ok(messages.some(message => message.includes('Ignoring unsafe agent data project config')));
          assert.ok(messages.every(message => !message.includes(candidate)));
        }
      });
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('rejects a Claude project config destination that escapes through a symlink', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-claude-link-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-claude-link-user-'));
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-claude-link-outside-'));
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    const claudeRoot = path.join(homeDir, '.claude');
    const linkPath = path.join(claudeRoot, 'redirect');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.mkdirSync(claudeRoot, { recursive: true });

    try {
      try {
        fs.symlinkSync(outsideDir, linkPath, 'dir');
      } catch {
        console.log('    (symlink unsupported on this platform; skipping)');
        return;
      }
      const candidate = path.join(linkPath, 'session-data');
      fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: candidate }), 'utf8');

      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const { result, messages } = captureConsoleErrors(
          () => agentDataHome.readProjectConfigAt(configPath)
        );
        assert.strictEqual(result, null);
        assert.ok(messages.some(message => message.includes('Ignoring unsafe agent data project config')));
        assert.ok(messages.every(message => !message.includes(candidate)));
      });
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  test('allows a non-existent project config destination beneath the Cursor data root', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-safe-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-safe-user-'));
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    const safeHome = path.join(homeDir, '.cursor', 'yus', 'profiles', 'work');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: safeHome }), 'utf8');

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(
          agentDataHome.readProjectConfigAt(configPath),
          path.join(fs.realpathSync(homeDir), '.cursor', 'yus', 'profiles', 'work')
        );
      });
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('rejects a project config destination that escapes through a symlink', () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-link-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-link-user-'));
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-link-outside-'));
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    const cursorRoot = path.join(homeDir, '.cursor', 'yus');
    const linkPath = path.join(cursorRoot, 'redirect');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.mkdirSync(cursorRoot, { recursive: true });

    try {
      try {
        fs.symlinkSync(outsideDir, linkPath, 'dir');
      } catch {
        console.log('    (symlink unsupported on this platform; skipping)');
        return;
      }
      const candidate = path.join(linkPath, 'session-data');
      fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: candidate }), 'utf8');

      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        const { result, messages } = captureConsoleErrors(
          () => agentDataHome.readProjectConfigAt(configPath)
        );
        assert.strictEqual(result, null);
        assert.ok(messages.some(message => message.includes('Ignoring unsafe agent data project config')));
        assert.ok(messages.every(message => !message.includes(candidate)));
      });
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  test('readProjectConfigAt logs parse failures', () => {
    const tmpDir = path.join(os.tmpdir(), `yus-agent-data-home-log-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    const configPath = path.join(tmpDir, 'yus-agent-data.json');
    fs.writeFileSync(configPath, '{ invalid json', 'utf8');

    const originalError = console.error;
    const messages = [];
    console.error = (...args) => {
      messages.push(args.join(' '));
    };

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CURSOR_VERSION: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(agentDataHome.readProjectConfigAt(configPath), null);
        assert.ok(
          messages.some(message => message.includes(configPath)),
          'Expected config path in error log'
        );
      });
    } finally {
      console.error = originalError;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('uses CLAUDE_CONFIG_DIR outside Cursor when YUS_AGENT_DATA_HOME is unset', () => {
    withIsolatedCwd(() => {
      const configDir = path.join(os.tmpdir(), 'yus-claude-config-profile');
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CLAUDE_CONFIG_DIR: configDir,
        CURSOR_VERSION: undefined,
        CURSOR_PROJECT_DIR: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(agentDataHome.resolveAgentDataHome(), configDir);
        assert.strictEqual(agentDataHome.getDefaultClaudeAgentDataHome(), configDir);
        const utils = require('../../scripts/lib/utils');
        assert.strictEqual(utils.getClaudeDir(), configDir);
      });
    });
  });

  test('YUS_AGENT_DATA_HOME takes precedence over CLAUDE_CONFIG_DIR', () => {
    withIsolatedCwd(() => {
      const explicitHome = path.join(os.tmpdir(), 'yus-explicit-agent-data-home');
      withEnv({
        YUS_AGENT_DATA_HOME: explicitHome,
        CLAUDE_CONFIG_DIR: path.join(os.tmpdir(), 'yus-claude-config-profile'),
        CURSOR_VERSION: undefined,
        CURSOR_PROJECT_DIR: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(agentDataHome.resolveAgentDataHome(), explicitHome);
      });
    });
  });

  test('CLAUDE_CONFIG_DIR does not override the Cursor default', () => {
    withIsolatedCwd(() => {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CLAUDE_CONFIG_DIR: path.join(os.tmpdir(), 'yus-claude-config-profile'),
        CURSOR_VERSION: '1.0.0',
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(
          agentDataHome.resolveAgentDataHome(),
          path.join(os.homedir(), '.cursor', 'yus')
        );
      });
    });
  });

  test('project config may select ~/.claude/shared when CLAUDE_CONFIG_DIR points elsewhere', () => {
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-claude-root-'));
    const projectDir = path.join(homeDir, 'project');
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    const sharedHome = path.join(homeDir, '.claude', 'shared');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: sharedHome }), 'utf8');

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CLAUDE_CONFIG_DIR: path.join(homeDir, 'custom-claude-profile'),
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(agentDataHome.readProjectConfigAt(configPath), path.join(fs.realpathSync(homeDir), '.claude', 'shared'));
      });
    } finally {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  test('ensureAgentDataHomeEnv sets process.env when unset', () => {
    withEnv({
      YUS_AGENT_DATA_HOME: undefined,
      CURSOR_VERSION: '1.0.0',
    }, () => {
      const agentDataHome = require('../../scripts/lib/agent-data-home');
      const resolved = agentDataHome.ensureAgentDataHomeEnv();
      assert.ok(process.env.YUS_AGENT_DATA_HOME);
      assert.strictEqual(process.env.YUS_AGENT_DATA_HOME, resolved);
    });
  });

  test('getDefaultClaudeAgentDataHome follows CLAUDE_CONFIG_DIR', () => {
    // Claude Code points every profile-local path at CLAUDE_CONFIG_DIR. Ignoring
    // it writes this profile's session data, logs and metrics into the default
    // ~/.claude, where another profile reads them back.
    withIsolatedCwd(() => {
      withEnv({
        CLAUDE_CONFIG_DIR: path.join(os.tmpdir(), 'yus-profile-x'),
        YUS_AGENT_DATA_HOME: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(
          agentDataHome.getDefaultClaudeAgentDataHome(),
          path.join(os.tmpdir(), 'yus-profile-x')
        );
      });
    });
  });

  test('getDefaultClaudeAgentDataHome falls back to ~/.claude without the env', () => {
    withIsolatedCwd(() => {
      withEnv({ CLAUDE_CONFIG_DIR: undefined, YUS_AGENT_DATA_HOME: undefined }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(
          agentDataHome.getDefaultClaudeAgentDataHome(),
          path.join(os.homedir(), '.claude')
        );
      });
    });
  });

  test('a blank CLAUDE_CONFIG_DIR is ignored rather than resolving to cwd', () => {
    // An empty or whitespace value would otherwise resolve to the process cwd and
    // scatter profile data through whatever directory the session started in.
    withIsolatedCwd(() => {
      withEnv({ CLAUDE_CONFIG_DIR: '   ', YUS_AGENT_DATA_HOME: undefined }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');
        assert.strictEqual(
          agentDataHome.getDefaultClaudeAgentDataHome(),
          path.join(os.homedir(), '.claude')
        );
      });
    });
  });

  test('security: CLAUDE_CONFIG_DIR adds a trusted profile root while preserving explicit sharing', () => {
    // getDefaultClaudeAgentDataHome() is not only a default: it is one of the two
    // roots resolveAllowedProjectConfigHome() will accept. Following
    // CLAUDE_CONFIG_DIR moves that boundary with the profile, so the containment
    // it enforces has to hold at the new location and nowhere else.
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-cfgdir-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yus-agent-data-home-cfgdir-user-'));
    const profileDir = path.join(homeDir, '.claude-profile-x');
    const configPath = path.join(projectDir, '.cursor', 'yus-agent-data.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });

    try {
      withEnv({
        YUS_AGENT_DATA_HOME: undefined,
        CLAUDE_CONFIG_DIR: profileDir,
        HOME: homeDir,
        USERPROFILE: undefined,
      }, () => {
        const agentDataHome = require('../../scripts/lib/agent-data-home');

        // Inside the relocated root: accepted.
        fs.writeFileSync(
          configPath,
          JSON.stringify({ agentDataHome: path.join(profileDir, 'nested') }),
          'utf8'
        );
        // readProjectConfigAt canonicalizes, and macOS reaches os.tmpdir()
        // through a symlink, so compare against the resolved home.
        assert.strictEqual(
          agentDataHome.readProjectConfigAt(configPath),
          path.join(fs.realpathSync(homeDir), '.claude-profile-x', 'nested')
        );

        // Preserve the explicit ~/.claude sharing root shipped in #3479.
        // The profile root adds a trusted location; arbitrary home paths and
        // traversal out of that profile still stay rejected.
        fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: path.join(homeDir, '.claude') }), 'utf8');
        assert.strictEqual(agentDataHome.readProjectConfigAt(configPath), path.join(fs.realpathSync(homeDir), '.claude'));
        const outside = [
          path.join(profileDir, '..', 'escaped'),
          path.join(homeDir, 'arbitrary-agent-data'),
        ];
        for (const candidate of outside) {
          fs.writeFileSync(configPath, JSON.stringify({ agentDataHome: candidate }), 'utf8');
          const { result, messages } = captureConsoleErrors(
            () => agentDataHome.readProjectConfigAt(configPath)
          );
          assert.strictEqual(result, null, `expected rejection for ${candidate}`);
          assert.ok(messages.some(message => message.includes('Ignoring unsafe agent data project config')));
        }
      });
    } finally {
      fs.rmSync(projectDir, { recursive: true, force: true });
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });
