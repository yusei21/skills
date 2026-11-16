#!/usr/bin/env node

const fs = require("node:fs")
const path = require("node:path")
const { execFileSync } = require("node:child_process")

const rootDir = path.resolve(__dirname, "..")
const opencodeDir = path.join(rootDir, ".opencode")
const distDir = path.join(opencodeDir, "dist")

fs.rmSync(distDir, { recursive: true, force: true })

let tscEntrypoint

try {
  // TypeScript 7 ships an `exports` map, so `typescript/bin/tsc` is no longer
  // resolvable directly. Resolve the package manifest and follow its `bin`.
  const manifestPath = require.resolve("typescript/package.json", { paths: [rootDir] })
  const { bin } = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  tscEntrypoint = path.join(path.dirname(manifestPath), typeof bin === "string" ? bin : bin.tsc)
} catch {
  throw new Error(
    "TypeScript compiler not found. Install root dev dependencies before publishing so .opencode/dist can be built."
  )
}

execFileSync(process.execPath, [tscEntrypoint, "-p", path.join(opencodeDir, "tsconfig.json")], {
  cwd: rootDir,
  stdio: "inherit",
})
