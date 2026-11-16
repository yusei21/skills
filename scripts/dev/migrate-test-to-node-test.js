#!/usr/bin/env node
// @ts-check
/**
 * Codemod: convert a legacy ECC test file to the built-in `node:test` runner.
 *
 * Legacy suites define their own `test(name, fn)` helper and count results by
 * hand inside a `runTests()` function:
 *
 *   function runTests() {
 *     console.log('detectFromLockFile:');
 *     if (test('detects npm', () => { ... })) passed++;
 *     else failed++;
 *     ...
 *     process.exit(failed > 0 ? 1 : 0);
 *   }
 *   runTests();
 *
 * The codemod rewrites that into `describe`/`test` blocks from `node:test`,
 * turning each one-line `console.log('Section:')` header into a `describe`.
 * Test bodies are left byte-for-byte untouched.
 *
 * It only handles that exact shape. Anything else (an async helper, statements
 * between tests, a different counter) makes it refuse the file and say why, so
 * a run never produces a half-converted suite.
 *
 * Usage:
 *   node scripts/dev/migrate-test-to-node-test.js [--check] <file...>
 *
 *   --check   report which files would convert, write nothing
 */

const fs = require('node:fs');

const HELPER_RE = /\n(?:\/\/ Test helper\n)?function test\(name, fn\) \{\n {2}try \{\n {4}fn\(\);\n[\s\S]*?\n\}\n/;
const RUN_TESTS_OPEN = 'function runTests() {';
const RUN_TESTS_CALL_RE = /\nrunTests\(\);\s*$/;
// The closing line of a legacy test: `})) passed++;`, optionally followed by
// `else failed++;` on the same line. Group 1 is the call's closing brackets.
const TEST_END_RE = /^ {2}(.*)\) passed\+\+;(?: else failed\+\+;)?$/;

class MigrationError extends Error {}

/**
 * @param {string} source
 * @returns {string}
 */
// eslint-disable-next-line complexity -- one-pass line state machine; splitting it would scatter its state
function migrate(source) {
  if (/require\(['"]node:test['"]\)/.test(source)) {
    throw new MigrationError('already uses node:test');
  }
  const helper = source.match(HELPER_RE);
  if (!helper) {
    throw new MigrationError('no synchronous `function test(name, fn)` helper found');
  }
  if (!RUN_TESTS_CALL_RE.test(source)) {
    throw new MigrationError('file does not end with a `runTests();` call');
  }

  const start = source.indexOf(`\n${RUN_TESTS_OPEN}\n`);
  if (start === -1) {
    throw new MigrationError(`no top-level \`${RUN_TESTS_OPEN}\``);
  }
  const bodyStart = start + RUN_TESTS_OPEN.length + 2;
  const callMatch = source.match(RUN_TESTS_CALL_RE);
  const bodyEnd = source.lastIndexOf('\n}', /** @type {number} */ (callMatch?.index));
  if (bodyEnd < bodyStart) {
    throw new MigrationError('could not find the end of runTests()');
  }

  const body = source.slice(bodyStart, bodyEnd).split('\n');
  /** @type {string[]} */
  const out = [];
  const last = () => out[out.length - 1] ?? '';
  let inDescribe = false;
  let inTest = false;
  let sawTest = false;
  let summary = false;
  /** Comments and blank lines waiting to be attached to the next block. */
  /** @type {string[]} */
  let pending = [];
  const flush = () => {
    while (pending.length > 0 && pending[0] === '') pending.shift();
    out.push(...pending);
    pending = [];
  };

  for (const [index, line] of body.entries()) {
    const where = `runTests() line ${index + 1}`;
    if (summary) continue;

    if (inTest) {
      const end = line.match(TEST_END_RE);
      if (end) {
        out.push(`  ${end[1]};`);
        inTest = false;
      } else {
        out.push(line);
      }
      continue;
    }

    if (line.startsWith('  if (test(')) {
      if (out.length > 0 && last() !== '' && !last().startsWith('describe(')) out.push('');
      flush();
      out.push(`  test(${line.slice('  if (test('.length)}`);
      inTest = true;
      sawTest = true;
      // A one-line test: `if (test('x', () => fn())) passed++;`
      const oneLine = last().match(TEST_END_RE);
      if (oneLine) {
        out[out.length - 1] = `  ${oneLine[1]};`;
        inTest = false;
      }
      continue;
    }

    if (/^ {2}else failed\+\+;$/.test(line) || /^ {2}let (passed|failed) = 0;$/.test(line) || line.trim() === '') {
      if (line.trim() === '' && pending[pending.length - 1] !== '') pending.push('');
      continue;
    }
    if (/^ {2}\/\//.test(line)) {
      pending.push(line);
      continue;
    }

    const header = line.match(/^ {2}console\.log\((.*)\);$/);
    if (header) {
      const text = header[1] ?? '';
      if (/Test Results|Results ===|\$\{(?:passed|failed)\b|\b(?:passed|failed) \+/.test(text)) {
        summary = true;
        pending = []; // the "// Summary" comment belongs to the dropped tally
        continue;
      }
      if (!sawTest && /===/.test(text)) {
        continue; // opening banner; node:test prints the file name itself
      }
      if (inDescribe) out.push('});', '');
      flush();
      // Comments that introduced the section move out to top level with it.
      for (let i = out.length - 1; i >= 0 && out[i]?.startsWith('  //'); i -= 1) out[i] = (out[i] ?? '').slice(2);
      out.push(`describe(sectionTitle(${text}), () => {`);
      inDescribe = true;
      continue;
    }

    if (/^ {2}process\.exit\(/.test(line)) continue;

    throw new MigrationError(`${where}: unsupported statement between tests: ${line.trim().slice(0, 80)}`);
  }

  if (inTest) throw new MigrationError('a test block never reached `) passed++;`');
  if (!sawTest) throw new MigrationError('runTests() contains no tests');
  flush();
  if (inDescribe) out.push('});');

  while (out.length > 0 && out[out.length - 1] === '') out.pop();
  while (out.length > 0 && out[0] === '') out.shift();

  let head = source.slice(0, start).replace(HELPER_RE, '\n');
  head = head.replace(/require\((['"])assert\1\)/, "require('node:assert')");
  if (!/require\('node:assert'\)/.test(head)) {
    throw new MigrationError("no `require('assert')` line to anchor the node:test import");
  }
  // Files without section headers never call describe(); import only what is used.
  const hasSections = out.some(line => line.startsWith('describe('));
  head = head.replace(
    /^(const assert = require\('node:assert'\);)$/m,
    `$1\nconst { ${hasSections ? 'describe, test' : 'test'} } = require('node:test');`
  );
  head = head.replace(/\n\/\/ Test suite\n*$/, '\n').replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '\n');

  const sectionHelper = hasSections ? [
    '',
    '/** Turn a legacy `console.log` section header into a describe() title. */',
    "const sectionTitle = title => String(title).trim().replace(/:$/, '');",
    ''
  ].join('\n') : '';

  return `${head}${sectionHelper}\n${out.join('\n')}\n`;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const files = args.filter(arg => arg !== '--check');
  if (files.length === 0) {
    console.error('Usage: node scripts/dev/migrate-test-to-node-test.js [--check] <file...>');
    process.exit(2);
  }

  let refused = 0;
  for (const file of files) {
    try {
      const migrated = migrate(fs.readFileSync(file, 'utf8'));
      if (!check) fs.writeFileSync(file, migrated);
      console.log(`${check ? 'convertible' : 'migrated'}  ${file}`);
    } catch (err) {
      if (!(err instanceof MigrationError)) throw err;
      refused += 1;
      console.log(`skipped     ${file}: ${err.message}`);
    }
  }
  if (refused > 0 && !check) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { migrate, MigrationError };
