// @ts-check
/**
 * Session Manager Library for Claude Code
 * Provides core session CRUD operations for listing, loading, and managing sessions
 *
 * Sessions are stored as markdown files in ~/.claude/session-data/ with
 * legacy read compatibility for ~/.claude/sessions/:
 * - YYYY-MM-DD-session.tmp (old format)
 * - YYYY-MM-DD-<short-id>-session.tmp (new format)
 */

const fs = require('fs');
const path = require('path');

const {
  getSessionsDir,
  getSessionSearchDirs,
  readFile,
  log,
  errorField
} = require('./utils');

/**
 * Metadata parsed from a session filename.
 * `shortId` is "no-id" for the old format; `datetime` is local midnight of `date`.
 * @typedef {{ filename: string, shortId: string, date: string, datetime: Date }} SessionFilenameMeta
 */
/**
 * Metadata parsed from session markdown content.
 * @typedef {{
 *   title: string | null,
 *   date: string | null,
 *   started: string | null,
 *   lastUpdated: string | null,
 *   project: string | null,
 *   branch: string | null,
 *   worktree: string | null,
 *   completed: string[],
 *   inProgress: string[],
 *   notes: string,
 *   context: string
 * }} SessionMetadata
 */
/**
 * @typedef {{
 *   totalItems: number,
 *   completedItems: number,
 *   inProgressItems: number,
 *   lineCount: number,
 *   hasNotes: boolean,
 *   hasContext: boolean
 * }} SessionStats
 */
/**
 * A session returned by getAllSessions and getSessionById. `content`,
 * `metadata` and `stats` are only set when content was requested.
 * @typedef {SessionFilenameMeta & {
 *   sessionPath: string,
 *   hasContent: boolean,
 *   size: number,
 *   modifiedTime: Date,
 *   createdTime: Date,
 *   content?: string | null,
 *   metadata?: SessionMetadata,
 *   stats?: SessionStats
 * }} Session
 */
/** @typedef {{ sessions: Session[], total: number, offset: number, limit: number, hasMore: boolean }} SessionListResult */
/** @typedef {{ date?: string | null, search?: string | null }} SessionFilterOptions */
/** @typedef {SessionFilterOptions & { limit?: number, offset?: number }} GetAllSessionsOptions */

/**
 * Message of a caught value, for logging.
 * @param {unknown} error
 * @returns {string}
 */
function messageOf(error) {
  return errorField(error, 'message') ?? String(error);
}

/**
 * Newest first by modification time.
 * @param {Session} a
 * @param {Session} b
 * @returns {number}
 */
function byModifiedDesc(a, b) {
  return b.modifiedTime.getTime() - a.modifiedTime.getTime();
}

// Session filename pattern: YYYY-MM-DD-[session-id]-session.tmp
// The session-id is optional (old format) and can include letters, digits,
// underscores, and hyphens, but must not start with a hyphen.
// Matches: "2026-02-01-session.tmp", "2026-02-01-a1b2c3d4-session.tmp",
// "2026-02-01-frontend-worktree-1-session.tmp", and
// "2026-02-01-ChezMoi_2-session.tmp"
const SESSION_FILENAME_REGEX = /^(\d{4}-\d{2}-\d{2})(?:-([a-zA-Z0-9_][a-zA-Z0-9_-]*))?-session\.tmp$/;

/**
 * Resolve a file's creation time, preferring birthtime but falling back to
 * ctime when birthtime is unavailable. Some filesystems (e.g. overlayfs in
 * containers) report birthtime as epoch 0; a Date object is always truthy, so
 * `birthtime || ctime` would never fall back. Compare on milliseconds instead.
 * @param {import('fs').Stats} stats
 * @returns {Date}
 */
function resolveCreatedTime(stats) {
  return stats.birthtimeMs > 0 ? stats.birthtime : stats.ctime;
}

/**
 * Parse session filename to extract metadata
 * @param {string} filename - Session filename (e.g., "2026-01-17-abc123-session.tmp" or "2026-01-17-session.tmp")
 * @returns {SessionFilenameMeta | null} Parsed metadata or null if invalid
 */
function parseSessionFilename(filename) {
  if (!filename || typeof filename !== 'string') return null;
  const match = filename.match(SESSION_FILENAME_REGEX);
  if (!match) return null;

  const dateStr = /** @type {string} */ (match[1]);

  // Validate date components are calendar-accurate (not just format)
  const [year = 0, month = 0, day = 0] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Reject impossible dates like Feb 31, Apr 31 — Date constructor rolls
  // over invalid days (e.g., Feb 31 → Mar 3), so check month roundtrips
  const d = new Date(year, month - 1, day);
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return null;

  // match[2] is undefined for old format (no ID)
  const shortId = match[2] || 'no-id';

  return {
    filename,
    shortId,
    date: dateStr,
    // Use local-time constructor (consistent with validation on line 40)
    // new Date(dateStr) interprets YYYY-MM-DD as UTC midnight which shows
    // as the previous day in negative UTC offset timezones
    datetime: new Date(year, month - 1, day)
  };
}

/**
 * Get the full path to a session file
 * @param {string} filename - Session filename
 * @returns {string} Full path to session file
 */
function getSessionPath(filename) {
  return path.join(getSessionsDir(), filename);
}

/**
 * Sessions in every search directory, deduplicated by filename, newest first.
 * @param {SessionFilterOptions} [options]
 * @returns {Session[]}
 */
function getSessionCandidates(options = {}) {
  const {
    date = null,
    search = null
  } = options;

  /** @type {Session[]} */
  const candidates = [];

  for (const sessionsDir of getSessionSearchDirs()) {
    if (!fs.existsSync(sessionsDir)) {
      continue;
    }

    let entries;
    try {
      entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
    } catch (error) {
      log(`[SessionManager] Error reading sessions directory ${sessionsDir}: ${messageOf(error)}`);
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.tmp')) continue;

      const filename = entry.name;
      const metadata = parseSessionFilename(filename);

      if (!metadata) continue;
      if (date && metadata.date !== date) continue;
      if (search && !metadata.shortId.includes(search)) continue;

      const sessionPath = path.join(sessionsDir, filename);

      let stats;
      try {
        stats = fs.statSync(sessionPath);
      } catch (error) {
        log(`[SessionManager] Error stating session ${sessionPath}: ${messageOf(error)}`);
        continue;
      }

      candidates.push({
        ...metadata,
        sessionPath,
        hasContent: stats.size > 0,
        size: stats.size,
        modifiedTime: stats.mtime,
        createdTime: resolveCreatedTime(stats)
      });
    }
  }

  /** @type {Session[]} */
  const deduped = [];
  /** @type {Set<string>} */
  const seenFilenames = new Set();

  for (const session of candidates) {
    if (seenFilenames.has(session.filename)) {
      continue;
    }
    seenFilenames.add(session.filename);
    deduped.push(session);
  }

  deduped.sort(byModifiedDesc);
  return deduped;
}

/**
 * @param {string} sessionPath
 * @param {SessionFilenameMeta} metadata
 * @returns {Session | null} The session, or null if it cannot be stat'ed
 */
function buildSessionRecord(sessionPath, metadata) {
  let stats;
  try {
    stats = fs.statSync(sessionPath);
  } catch (error) {
    log(`[SessionManager] Error stating session ${sessionPath}: ${messageOf(error)}`);
    return null;
  }

  return {
    ...metadata,
    sessionPath,
    hasContent: stats.size > 0,
    size: stats.size,
    modifiedTime: stats.mtime,
    createdTime: resolveCreatedTime(stats)
  };
}

/**
 * @param {SessionFilenameMeta} metadata
 * @param {string} normalizedSessionId - Short ID prefix or filename, trimmed
 * @returns {boolean}
 */
function sessionMatchesId(metadata, normalizedSessionId) {
  const filename = metadata.filename;
  const shortIdMatch = metadata.shortId !== 'no-id' && metadata.shortId.startsWith(normalizedSessionId);
  const filenameMatch = filename === normalizedSessionId || filename === `${normalizedSessionId}.tmp`;
  const noIdMatch = metadata.shortId === 'no-id' && filename === `${normalizedSessionId}-session.tmp`;

  return shortIdMatch || filenameMatch || noIdMatch;
}

/**
 * @param {string} normalizedSessionId
 * @returns {Session[]} Matching sessions, newest first
 */
function getMatchingSessionCandidates(normalizedSessionId) {
  /** @type {Session[]} */
  const matches = [];
  /** @type {Set<string>} */
  const seenFilenames = new Set();

  for (const sessionsDir of getSessionSearchDirs()) {
    if (!fs.existsSync(sessionsDir)) {
      continue;
    }

    let entries;
    try {
      entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
    } catch (error) {
      log(`[SessionManager] Error reading sessions directory ${sessionsDir}: ${messageOf(error)}`);
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.tmp')) continue;

      const metadata = parseSessionFilename(entry.name);
      if (!metadata || !sessionMatchesId(metadata, normalizedSessionId)) {
        continue;
      }

      if (seenFilenames.has(metadata.filename)) {
        continue;
      }

      const sessionPath = path.join(sessionsDir, metadata.filename);
      const sessionRecord = buildSessionRecord(sessionPath, metadata);
      if (!sessionRecord) {
        continue;
      }

      seenFilenames.add(metadata.filename);
      matches.push(sessionRecord);
    }
  }

  matches.sort(byModifiedDesc);
  return matches;
}

/**
 * Read and parse session markdown content
 * @param {string} sessionPath - Full path to session file
 * @returns {string|null} Session content or null if not found
 */
function getSessionContent(sessionPath) {
  return readFile(sessionPath);
}

/**
 * Parse session metadata from markdown content
 * @param {string | null} content - Session markdown content
 * @returns {SessionMetadata} Parsed metadata
 */
function parseSessionMetadata(content) {
  /** @type {SessionMetadata} */
  const metadata = {
    title: null,
    date: null,
    started: null,
    lastUpdated: null,
    project: null,
    branch: null,
    worktree: null,
    completed: [],
    inProgress: [],
    notes: '',
    context: ''
  };

  if (!content) return metadata;

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = /** @type {string} */ (titleMatch[1]).trim();
  }

  // Extract date
  const dateMatch = content.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    metadata.date = /** @type {string} */ (dateMatch[1]);
  }

  // Extract started time
  const startedMatch = content.match(/\*\*Started:\*\*\s*([\d:]+)/);
  if (startedMatch) {
    metadata.started = /** @type {string} */ (startedMatch[1]);
  }

  // Extract last updated
  const updatedMatch = content.match(/\*\*Last Updated:\*\*\s*([\d:]+)/);
  if (updatedMatch) {
    metadata.lastUpdated = /** @type {string} */ (updatedMatch[1]);
  }

  // Extract control-plane metadata
  const projectMatch = content.match(/\*\*Project:\*\*\s*(.+)$/m);
  if (projectMatch) {
    metadata.project = /** @type {string} */ (projectMatch[1]).trim();
  }

  const branchMatch = content.match(/\*\*Branch:\*\*\s*(.+)$/m);
  if (branchMatch) {
    metadata.branch = /** @type {string} */ (branchMatch[1]).trim();
  }

  const worktreeMatch = content.match(/\*\*Worktree:\*\*\s*(.+)$/m);
  if (worktreeMatch) {
    metadata.worktree = /** @type {string} */ (worktreeMatch[1]).trim();
  }

  // Extract completed items
  const completedSection = content.match(/### Completed\s*\n([\s\S]*?)(?=###|\n\n|$)/);
  if (completedSection) {
    const items = /** @type {string} */ (completedSection[1]).match(/- \[x\]\s*(.+)/g);
    if (items) {
      metadata.completed = items.map(item => item.replace(/- \[x\]\s*/, '').trim());
    }
  }

  // Extract in-progress items
  const progressSection = content.match(/### In Progress\s*\n([\s\S]*?)(?=###|\n\n|$)/);
  if (progressSection) {
    const items = /** @type {string} */ (progressSection[1]).match(/- \[ \]\s*(.+)/g);
    if (items) {
      metadata.inProgress = items.map(item => item.replace(/- \[ \]\s*/, '').trim());
    }
  }

  // Extract notes
  const notesSection = content.match(/### Notes for Next Session\s*\n([\s\S]*?)(?=###|\n\n|$)/);
  if (notesSection) {
    metadata.notes = /** @type {string} */ (notesSection[1]).trim();
  }

  // Extract context to load
  const contextSection = content.match(/### Context to Load\s*\n```\n([\s\S]*?)```/);
  if (contextSection) {
    metadata.context = /** @type {string} */ (contextSection[1]).trim();
  }

  return metadata;
}

/**
 * Calculate statistics for a session
 * @param {string} sessionPathOrContent - Full path to session file, OR
 *   the pre-read content string (to avoid redundant disk reads when
 *   the caller already has the content loaded).
 * @returns {SessionStats} Statistics object
 */
function getSessionStats(sessionPathOrContent) {
  // Accept pre-read content string to avoid redundant file reads.
  // If the argument looks like a file path (no newlines, ends with .tmp,
  // starts with / on Unix or drive letter on Windows), read from disk.
  // Otherwise treat it as content.
  const looksLikePath = typeof sessionPathOrContent === 'string' &&
    !sessionPathOrContent.includes('\n') &&
    sessionPathOrContent.endsWith('.tmp') &&
    (sessionPathOrContent.startsWith('/') || /^[A-Za-z]:[/\\]/.test(sessionPathOrContent));
  const content = looksLikePath
    ? getSessionContent(sessionPathOrContent)
    : sessionPathOrContent;

  const metadata = parseSessionMetadata(content);

  return {
    totalItems: metadata.completed.length + metadata.inProgress.length,
    completedItems: metadata.completed.length,
    inProgressItems: metadata.inProgress.length,
    lineCount: content ? content.split('\n').length : 0,
    hasNotes: !!metadata.notes,
    hasContext: !!metadata.context
  };
}

/**
 * Get all sessions with optional filtering and pagination
 * @param {GetAllSessionsOptions} [options] - limit (default 50), offset,
 *   date (YYYY-MM-DD) and search (in the short ID)
 * @returns {SessionListResult} Object with sessions array and pagination info
 */
function getAllSessions(options = {}) {
  const {
    limit: rawLimit = 50,
    offset: rawOffset = 0,
    date = null,
    search = null
  } = options;

  // Clamp offset and limit to safe non-negative integers.
  // Without this, negative offset causes slice() to count from the end,
  // and NaN values cause slice() to return empty or unexpected results.
  // Note: cannot use `|| default` because 0 is falsy — use isNaN instead.
  const offsetNum = Number(rawOffset);
  const offset = Number.isNaN(offsetNum) ? 0 : Math.max(0, Math.floor(offsetNum));
  const limitNum = Number(rawLimit);
  const limit = Number.isNaN(limitNum) ? 50 : Math.max(1, Math.floor(limitNum));

  const sessions = getSessionCandidates({ date, search });

  if (sessions.length === 0) {
    return { sessions: [], total: 0, offset, limit, hasMore: false };
  }

  // Apply pagination
  const paginatedSessions = sessions.slice(offset, offset + limit);

  return {
    sessions: paginatedSessions,
    total: sessions.length,
    offset,
    limit,
    hasMore: offset + limit < sessions.length
  };
}

/**
 * Get a single session by ID (short ID or full path)
 * @param {string} sessionId - Short ID or session filename
 * @param {boolean} [includeContent] - Include session content
 * @returns {Session | null} Session object or null if not found
 */
function getSessionById(sessionId, includeContent = false) {
  if (typeof sessionId !== 'string') {
    return null;
  }

  const normalizedSessionId = sessionId.trim();
  if (!normalizedSessionId) {
    return null;
  }

  const sessions = getMatchingSessionCandidates(normalizedSessionId);

  for (const session of sessions) {
    const sessionRecord = { ...session };

    if (includeContent) {
      sessionRecord.content = getSessionContent(sessionRecord.sessionPath);
      sessionRecord.metadata = parseSessionMetadata(sessionRecord.content);
      // Pass pre-read content to avoid a redundant disk read
      sessionRecord.stats = getSessionStats(sessionRecord.content || '');
    }

    return sessionRecord;
  }

  return null;
}

/**
 * Get session title from content
 * @param {string} sessionPath - Full path to session file
 * @returns {string} Title or default text
 */
function getSessionTitle(sessionPath) {
  const content = getSessionContent(sessionPath);
  const metadata = parseSessionMetadata(content);

  return metadata.title || 'Untitled Session';
}

/**
 * Format session size in human-readable format
 * @param {string} sessionPath - Full path to session file
 * @returns {string} Formatted size (e.g., "1.2 KB")
 */
function getSessionSize(sessionPath) {
  let stats;
  try {
    stats = fs.statSync(sessionPath);
  } catch {
    return '0 B';
  }
  const size = stats.size;

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Write session content to file
 * @param {string} sessionPath - Full path to session file
 * @param {string} content - Markdown content to write
 * @returns {boolean} Success status
 */
function writeSessionContent(sessionPath, content) {
  try {
    fs.writeFileSync(sessionPath, content, 'utf8');
    return true;
  } catch (err) {
    log(`[SessionManager] Error writing session: ${messageOf(err)}`);
    return false;
  }
}

/**
 * Append content to a session
 * @param {string} sessionPath - Full path to session file
 * @param {string} content - Content to append
 * @returns {boolean} Success status
 */
function appendSessionContent(sessionPath, content) {
  try {
    fs.appendFileSync(sessionPath, content, 'utf8');
    return true;
  } catch (err) {
    log(`[SessionManager] Error appending to session: ${messageOf(err)}`);
    return false;
  }
}

/**
 * Delete a session file
 * @param {string} sessionPath - Full path to session file
 * @returns {boolean} Success status
 */
function deleteSession(sessionPath) {
  try {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      return true;
    }
    return false;
  } catch (err) {
    log(`[SessionManager] Error deleting session: ${messageOf(err)}`);
    return false;
  }
}

/**
 * Check if a session exists
 * @param {string} sessionPath - Full path to session file
 * @returns {boolean} True if session exists
 */
function sessionExists(sessionPath) {
  try {
    return fs.statSync(sessionPath).isFile();
  } catch {
    return false;
  }
}

module.exports = {
  parseSessionFilename,
  getSessionPath,
  getSessionContent,
  parseSessionMetadata,
  getSessionStats,
  getSessionTitle,
  getSessionSize,
  getAllSessions,
  getSessionById,
  writeSessionContent,
  appendSessionContent,
  deleteSession,
  sessionExists
};
