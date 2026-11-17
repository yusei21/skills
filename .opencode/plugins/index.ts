/**
 * yus Plugins for OpenCode
 *
 * This module exports all yus plugins for OpenCode integration.
 * Plugins provide hook-based automation that mirrors Claude Code's hook system
 * while taking advantage of OpenCode's more sophisticated 20+ event types.
 */

export { YUSHooksPlugin, default } from "./yus-hooks.ts"

// Re-export for named imports
export * from "./yus-hooks.ts"
