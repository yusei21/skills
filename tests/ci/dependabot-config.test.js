#!/usr/bin/env node
/**
 * Validate that Dependabot keeps useful Python security coverage without
 * raising already-compatible minimum versions every week.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', '..', '.github', 'dependabot.yml');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function run() {
  console.log('\n=== Testing Dependabot configuration ===\n');

  const config = yaml.load(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const pipUpdates = config.updates.filter(update => update['package-ecosystem'] === 'pip');
  let passed = 0;
  let failed = 0;

  if (test('keeps both Python manifests under Dependabot coverage', () => {
    assert.deepStrictEqual(
      pipUpdates.map(update => update.directory).sort(),
      ['/', '/skills/admin/skill-comply'],
    );
  })) passed++; else failed++;

  if (test('every configured directory exists and holds its manifest', () => {
    const manifests = { pip: ['pyproject.toml', 'requirements.txt'], npm: ['package.json'], cargo: ['Cargo.toml'] };
    for (const update of config.updates) {
      const dir = path.join(__dirname, '../..', update.directory);
      assert.ok(fs.existsSync(dir), `${update['package-ecosystem']} directory ${update.directory} does not exist`);
      const expected = manifests[update['package-ecosystem']];
      if (expected) {
        assert.ok(expected.some(name => fs.existsSync(path.join(dir, name))),
          `${update.directory} has none of ${expected.join(', ')}`);
      }
    }
  })) passed++; else failed++;

  if (test('does not raise already-compatible Python minimum versions', () => {
    for (const update of pipUpdates) {
      assert.strictEqual(update['versioning-strategy'], 'increase-if-necessary');
    }
  })) passed++; else failed++;

  if (test('retains grouped Python security updates', () => {
    for (const update of pipUpdates) {
      assert.ok(update.groups);
      assert.ok(
        Object.values(update.groups).some(group => group['applies-to'] === 'security-updates'),
        `missing security-update group for ${update.directory}`,
      );
    }
  })) passed++; else failed++;

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
