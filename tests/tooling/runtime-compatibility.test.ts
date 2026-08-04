import { afterAll, beforeAll, expect, test } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

let temporaryDirectory = ""

beforeAll(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "easyedats-runtime-"))
})

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true })
})

test("package API runs directly in Bun", async () => {
  const module = await import("lib")
  const document = module.parseEasyEdaSource(
    JSON.stringify({ head: "3~1.0~", shape: [] }),
  )
  expect(document.kind).toBe("pcb")
})

test("package API bundles and runs as Node.js ESM", async () => {
  const result = await Bun.build({
    entrypoints: ["lib/index.ts"],
    format: "esm",
    naming: "easyedats.mjs",
    outdir: temporaryDirectory,
    target: "node",
  })
  expect(result.success).toBe(true)
  expect(result.logs).toEqual([])

  const moduleUrl = pathToFileURL(
    join(temporaryDirectory, "easyedats.mjs"),
  ).href
  const node = Bun.spawn(
    [
      "node",
      "--input-type=module",
      "--eval",
      `const api = await import(${JSON.stringify(moduleUrl)}); const doc = api.parseEasyEdaSource(JSON.stringify({head:"3~1.0~",shape:[]})); if (doc.kind !== "pcb") process.exit(1)`,
    ],
    { stderr: "pipe", stdout: "pipe" },
  )
  const [exitCode, stderr] = await Promise.all([
    node.exited,
    new Response(node.stderr).text(),
  ])
  expect(stderr).toBe("")
  expect(exitCode).toBe(0)
})

test("package API bundles without server built-ins for browsers", async () => {
  const result = await Bun.build({
    entrypoints: ["lib/index.ts"],
    format: "esm",
    naming: "easyedats-browser.js",
    outdir: temporaryDirectory,
    target: "browser",
  })
  expect(result.success).toBe(true)
  expect(result.logs).toEqual([])

  const source = await readFile(
    join(temporaryDirectory, "easyedats-browser.js"),
    "utf8",
  )
  expect(source).toContain("parseEasyEdaSource")
  expect(source).not.toContain('from "node:')
  expect(source).not.toContain("require(")
})
