// @ts-check
/**
 * Where curated skills live on disk.
 *
 * yus groups skills by department: skills/<department>/<skill>/SKILL.md (see
 * manifests/skill-departments.json). Claude Code does not recurse into
 * skills/, which is what lets the root `yus` plugin load only the core
 * department while `yus-<department>` plugins add the rest.
 *
 * Every script that needs "all skills" or "the directory of skill X" goes
 * through this module instead of reading skills/ one level deep. A flat
 * skills/<skill>/SKILL.md entry is still accepted, so fixtures, older checkouts
 * and third-party repos with the classic layout keep working.
 */

const fs = require('node:fs');
const path = require('node:path');

const SKILL_FILE = 'SKILL.md';

/**
 * @typedef {object} SkillLocation
 * @property {string} name Skill directory name (the skill id)
 * @property {string | null} department Department directory, or null for a flat entry
 * @property {string} dir Absolute path of the skill directory
 * @property {string} relDir Path relative to the root, with forward slashes (e.g. "skills/core/tdd-workflow")
 * @property {string} skillFile Absolute path of SKILL.md
 */

/**
 * @param {string} dir
 * @returns {fs.Dirent[]}
 */
function dirEntries(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) return [];
    throw err;
  }
}

/**
 * @param {fs.Dirent} entry
 * @param {string} parent
 */
function isDirectory(entry, parent) {
  if (entry.isDirectory()) return true;
  if (!entry.isSymbolicLink()) return false;
  try {
    return fs.statSync(path.join(parent, entry.name)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * List every skill under `<root>/<skillsDir>`, nested or flat, sorted by name.
 * @param {string} root Repository (or fixture) root
 * @param {{ skillsDir?: string }} [options]
 * @returns {SkillLocation[]}
 */
function listSkills(root, options = {}) {
  const skillsDir = options.skillsDir ?? 'skills';
  const base = path.join(root, skillsDir);
  /** @type {SkillLocation[]} */
  const found = [];
  /**
   * @param {string} dir
   * @param {string} name
   * @param {string | null} department
   */
  const add = (dir, name, department) => {
    const relDir = [skillsDir, ...(department ? [department] : []), name].join('/').split(path.sep).join('/');
    found.push({ name, department, dir, relDir, skillFile: path.join(dir, SKILL_FILE) });
  };
  for (const entry of dirEntries(base)) {
    if (!isDirectory(entry, base) || entry.name.startsWith('.')) continue;
    const dir = path.join(base, entry.name);
    if (fs.existsSync(path.join(dir, SKILL_FILE))) {
      add(dir, entry.name, null);
      continue;
    }
    for (const child of dirEntries(dir)) {
      if (!isDirectory(child, dir) || child.name.startsWith('.')) continue;
      const childDir = path.join(dir, child.name);
      if (fs.existsSync(path.join(childDir, SKILL_FILE))) add(childDir, child.name, entry.name);
    }
  }
  return found.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * Skill names only.
 * @param {string} root
 * @param {{ skillsDir?: string }} [options]
 * @returns {string[]}
 */
function listSkillNames(root, options) {
  return listSkills(root, options).map(skill => skill.name);
}

/**
 * Find one skill by name.
 * @param {string} root
 * @param {string} name
 * @param {{ skillsDir?: string }} [options]
 * @returns {SkillLocation | null}
 */
function findSkill(root, name, options) {
  return listSkills(root, options).find(skill => skill.name === name) ?? null;
}

/**
 * Absolute directory of a skill, or where a flat one would be when it does not exist.
 * @param {string} root
 * @param {string} name
 * @param {{ skillsDir?: string }} [options]
 * @returns {string}
 */
function skillDir(root, name, options = {}) {
  return findSkill(root, name, options)?.dir ?? path.join(root, options.skillsDir ?? 'skills', name);
}

/**
 * Map a repo-relative source path to its flat install path: an installed
 * harness reads `<target>/skills/<skill>`, never a department level.
 * `skills/core/tdd-workflow/x.md` -> `skills/tdd-workflow/x.md`; other paths unchanged.
 * @param {string} relPath forward-slash path relative to the repo root
 * @param {ReadonlySet<string>} departments known department directory names
 * @returns {string}
 */
function flattenSkillPath(relPath, departments) {
  const parts = relPath.split('/');
  if (parts[0] === 'skills' && parts.length >= 3 && departments.has(/** @type {string} */ (parts[1]))) {
    return ['skills', ...parts.slice(2)].join('/');
  }
  return relPath;
}

/**
 * Department directory names present under `<root>/<skillsDir>`.
 * @param {string} root
 * @param {{ skillsDir?: string }} [options]
 * @returns {Set<string>}
 */
function listDepartments(root, options) {
  return new Set(listSkills(root, options).map(skill => skill.department).filter(/** @returns {d is string} */ d => d !== null));
}

/**
 * Install operations copy `skills/<department>/<skill>/...` from the source
 * tree; drop the department level from the destination so the target keeps
 * the flat `skills/<skill>/` layout every harness reads. Only a destination
 * that ends with the department-qualified suffix is changed.
 * @template {{ sourceRelativePath?: string, destinationPath?: string }} T
 * @param {T} operation
 * @param {ReadonlySet<string>} departments
 * @returns {T}
 */
function flattenSkillDestination(operation, departments) {
  const source = operation.sourceRelativePath;
  const destination = operation.destinationPath;
  if (typeof source !== 'string' || typeof destination !== 'string') return operation;
  const parts = source.split(/[\\/]/);
  if (parts[0] !== 'skills' || parts.length < 3 || !departments.has(/** @type {string} */ (parts[1]))) return operation;
  for (const sep of [path.sep, '/']) {
    const suffix = parts.slice(1).join(sep);
    if (destination === suffix || destination.endsWith(sep + suffix)) {
      return { ...operation, destinationPath: destination.slice(0, destination.length - suffix.length) + parts.slice(2).join(sep) };
    }
  }
  return operation;
}

/**
 * Department names an install should flatten: those declared in the source's
 * manifests/skill-departments.json (or the one shipped with this script when
 * the source has none), plus any department directory found on disk.
 * @param {string} [repoRoot]
 * @returns {Set<string>}
 */
function knownDepartments(repoRoot) {
  const bundled = path.join(__dirname, '..', '..', 'manifests', 'skill-departments.json');
  const candidates = repoRoot ? [path.join(repoRoot, 'manifests', 'skill-departments.json'), bundled] : [bundled];
  /** @type {Set<string>} */
  const names = new Set();
  for (const file of candidates) {
    try {
      const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const department of manifest.departments || []) if (typeof department.id === 'string') names.add(department.id);
      break;
    } catch {
      // try the next candidate
    }
  }
  if (repoRoot) for (const name of listDepartments(repoRoot)) names.add(name);
  return names;
}

module.exports = { SKILL_FILE, knownDepartments, listSkills, listSkillNames, findSkill, skillDir, flattenSkillPath, flattenSkillDestination, listDepartments };
