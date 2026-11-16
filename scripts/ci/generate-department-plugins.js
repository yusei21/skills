#!/usr/bin/env node
// @ts-check
/**
 * Generate ECC's per-department Claude Code plugins from
 * manifests/skill-departments.json.
 *
 * Loading all ~340 curated skills puts every skill description into every
 * session (~26k tokens). The departments split that up:
 *
 * - `ecc` (the root plugin, .claude-plugin/plugin.json) keeps the runtime
 *   (commands, agents, hooks, MCP, settings) and only the `core` department.
 * - `ecc-<department>` marketplace entries add one department each.
 * - `ecc-all-departments` adds every non-core department at once.
 *
 * Skills live at skills/<department>/<skill>/. Claude Code loads every
 * skills/<skill>/SKILL.md under a plugin root but does not recurse, so the
 * root plugin sees none of them unless plugin.json lists them, while each
 * `ecc-<department>` entry uses `source: "./skills/<department>"` and lists its
 * skills. Rooting a department at "./" instead would also load the root's
 * default `agents/`, `commands/` and `hooks/hooks.json`, running ECC's hooks
 * once per installed department.
 *
 * Usage:
 *   node scripts/ci/generate-department-plugins.js           # print summary
 *   node scripts/ci/generate-department-plugins.js --write   # update manifests
 *   node scripts/ci/generate-department-plugins.js --check   # fail if stale (CI)
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../..');
const DEPARTMENTS_PATH = 'manifests/skill-departments.json';
const PLUGIN_PATH = '.claude-plugin/plugin.json';
const MARKETPLACE_PATH = '.claude-plugin/marketplace.json';
const PACKAGE_PATH = 'package.json';
const CORE_DEPARTMENT = 'core';
const ROOT_PLUGIN = 'ecc';
const ALL_PLUGIN = 'ecc-all-departments';
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * @typedef {object} DepartmentGroup
 * @property {string} id
 * @property {string} title
 * @property {string[]} skills
 */

/**
 * @typedef {object} Department
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {DepartmentGroup[]} groups
 */

/**
 * @typedef {object} DepartmentsManifest
 * @property {number} version
 * @property {Department[]} departments
 */

/**
 * @param {string} root
 * @param {string} rel
 * @returns {any}
 */
function readJson(root, rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

/**
 * @param {string} root
 * @returns {import('../lib/skill-layout').SkillLocation[]}
 */
function listCuratedSkills(root) {
  return require('../lib/skill-layout').listSkills(root);
}

/** @param {Department} department */
function skillsOf(department) {
  return department.groups.flatMap(group => group.skills);
}

/**
 * Check the taxonomy: every curated skill sits in exactly one department group,
 * in the matching skills/<department>/ directory.
 * @param {DepartmentsManifest} manifest
 * @param {import('../lib/skill-layout').SkillLocation[]} curated
 * @returns {string[]} problems, empty when valid
 */
function validateDepartments(manifest, curated) {
  /** @type {string[]} */
  const problems = [];
  if (manifest.version !== 1) problems.push(`unsupported version ${manifest.version}`);
  /** @type {Map<string, string>} */
  const owner = new Map();
  const departmentIds = new Set();
  for (const department of manifest.departments) {
    if (!ID_RE.test(department.id)) problems.push(`department id "${department.id}" is not kebab-case`);
    if (departmentIds.has(department.id)) problems.push(`duplicate department "${department.id}"`);
    departmentIds.add(department.id);
    if (!department.title || !department.description) problems.push(`department "${department.id}" needs a title and description`);
    const groupIds = new Set();
    for (const group of department.groups) {
      if (groupIds.has(group.id)) problems.push(`duplicate group "${department.id}/${group.id}"`);
      groupIds.add(group.id);
      if (group.skills.length === 0) problems.push(`group "${department.id}/${group.id}" is empty`);
      for (const skill of group.skills) {
        const where = `${department.id}/${group.id}`;
        const previous = owner.get(skill);
        if (previous) problems.push(`skill "${skill}" is in both ${previous} and ${where}`);
        owner.set(skill, where);
      }
    }
  }
  if (!departmentIds.has(CORE_DEPARTMENT)) problems.push(`missing the "${CORE_DEPARTMENT}" department`);
  /** @type {Map<string, import('../lib/skill-layout').SkillLocation>} */
  const onDisk = new Map(curated.map(skill => [skill.name, skill]));
  for (const [skill, where] of owner) {
    const location = onDisk.get(skill);
    const department = where.split('/')[0];
    if (!location) problems.push(`skill "${skill}" is listed but skills/${department}/${skill}/SKILL.md does not exist`);
    else if (location.department !== department) problems.push(`skill "${skill}" belongs to ${department} but lives at ${location.relDir}`);
  }
  for (const skill of curated) {
    if (!owner.has(skill.name)) problems.push(`${skill.relDir} is not assigned to any department in ${DEPARTMENTS_PATH}`);
  }
  return problems;
}

/**
 * Build the expected plugin.json and marketplace.json from the current files.
 * @param {string} root
 * @returns {{ plugin: any, marketplace: any, pkg: any, summary: string[] }}
 */
function buildManifests(root) {
  /** @type {DepartmentsManifest} */
  const manifest = readJson(root, DEPARTMENTS_PATH);
  const problems = validateDepartments(manifest, listCuratedSkills(root));
  if (problems.length > 0) {
    throw new Error(`Invalid ${DEPARTMENTS_PATH}:\n  - ${problems.join('\n  - ')}`);
  }

  const plugin = readJson(root, PLUGIN_PATH);
  const marketplace = readJson(root, MARKETPLACE_PATH);
  const rootEntry = marketplace.plugins.find((/** @type {any} */ entry) => entry.name === ROOT_PLUGIN);
  if (!rootEntry) throw new Error(`${MARKETPLACE_PATH} has no "${ROOT_PLUGIN}" entry`);

  const core = manifest.departments.find(department => department.id === CORE_DEPARTMENT);
  const others = manifest.departments.filter(department => department.id !== CORE_DEPARTMENT);
  const coreSkills = skillsOf(/** @type {Department} */ (core));

  const nextPlugin = { ...plugin, skills: coreSkills.map(skill => `./skills/${CORE_DEPARTMENT}/${skill}`) };

  const shared = {
    version: rootEntry.version,
    author: rootEntry.author,
    homepage: rootEntry.homepage,
    repository: rootEntry.repository,
    license: rootEntry.license,
    category: rootEntry.category,
    strict: false
  };
  /**
   * @param {string} name
   * @param {string} source
   * @param {string} description
   * @param {string[]} skillPaths paths relative to `source`
   * @param {string[]} keywords
   */
  const entry = (name, source, description, skillPaths, keywords) => ({
    name,
    source,
    ...shared,
    description,
    keywords,
    tags: keywords,
    skills: skillPaths.map(rel => `./${rel}`)
  });

  const departmentEntries = others.map(department => entry(
    `ecc-${department.id}`,
    `./skills/${department.id}`,
    `ECC ${department.title} department: ${skillsOf(department).length} skills. ${department.description} Install alongside the "${ROOT_PLUGIN}" plugin.`,
    skillsOf(department),
    ['ecc', 'skills', 'department', department.id]
  ));
  const allSkills = others.flatMap(skillsOf);
  const allEntry = entry(
    ALL_PLUGIN,
    './skills',
    `Every ECC department at once: ${allSkills.length} skills. Install alongside the "${ROOT_PLUGIN}" plugin instead of individual ecc-<department> plugins.`,
    others.flatMap(department => skillsOf(department).map(skill => `${department.id}/${skill}`)),
    ['ecc', 'skills', 'department', 'all']
  );

  const generatedNames = new Set([ALL_PLUGIN, ...departmentEntries.map(e => e.name)]);
  const kept = marketplace.plugins.filter((/** @type {any} */ e) => !generatedNames.has(e.name) && !String(e.name).startsWith('ecc-'));
  const nextMarketplace = { ...marketplace, plugins: [...kept, ...departmentEntries, allEntry] };

  const summary = [
    `${ROOT_PLUGIN}: runtime + ${coreSkills.length} core skills`,
    ...others.map(department => `ecc-${department.id}: ${skillsOf(department).length} skills`),
    `${ALL_PLUGIN}: ${allSkills.length} skills`
  ];
  // Pi reads each listed directory one level deep, so it gets one entry per department.
  const pkg = readJson(root, PACKAGE_PATH);
  const nextPackage = pkg.pi
    ? { ...pkg, pi: { ...pkg.pi, skills: manifest.departments.map(department => `./skills/${department.id}`) } }
    : pkg;

  return { plugin: nextPlugin, marketplace: nextMarketplace, pkg: nextPackage, summary };
}

/**
 * JSON with non-ASCII escaped, matching how the repository stores package.json.
 * @param {unknown} value
 */
function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`.replace(/[\u0080-\uffff]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/**
 * @param {string[]} argv
 * @param {string} [root]
 * @returns {number} exit code
 */
function main(argv, root = ROOT) {
  const write = argv.includes('--write');
  const check = argv.includes('--check');
  const { plugin, marketplace, pkg, summary } = buildManifests(root);
  const outputs = [
    [PLUGIN_PATH, serialize(plugin)],
    [MARKETPLACE_PATH, serialize(marketplace)],
    [PACKAGE_PATH, serialize(pkg)]
  ];

  if (check) {
    const stale = outputs.filter(([rel, text]) => fs.readFileSync(path.join(root, /** @type {string} */ (rel)), 'utf8') !== text);
    if (stale.length > 0) {
      console.error(`Department plugins are stale: ${stale.map(([rel]) => rel).join(', ')}`);
      console.error('Run: node scripts/ci/generate-department-plugins.js --write');
      return 1;
    }
    console.log(`Department plugins are up to date (${summary.length} plugins).`);
    return 0;
  }
  if (write) {
    for (const [rel, text] of outputs) fs.writeFileSync(path.join(root, /** @type {string} */ (rel)), /** @type {string} */ (text));
  }
  console.log(summary.join('\n'));
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

module.exports = { buildManifests, validateDepartments, main, CORE_DEPARTMENT, ROOT_PLUGIN, ALL_PLUGIN };
