import { afterAll, beforeAll, expect, test } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let temporaryDirectory = ""

beforeAll(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "easyedats-cli-"))
})

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true })
})

async function runCli(...args: string[]): Promise<{
  exitCode: number
  stderr: string
  stdout: string
}> {
  const process = Bun.spawn(["bun", "run", "lib/cli.ts", ...args], {
    cwd: import.meta.dir.replace(/\/tests\/tooling$/, ""),
    stderr: "pipe",
    stdout: "pipe",
  })
  const [exitCode, stderr, stdout] = await Promise.all([
    process.exited,
    new Response(process.stderr).text(),
    new Response(process.stdout).text(),
  ])
  return { exitCode, stderr, stdout }
}

const fixture = "tests/fixtures/easyeda-standard-pcb.json"

test("CLI inspects, validates, normalizes, round-trips, and renders SVG", async () => {
  const inspect = await runCli("inspect", fixture)
  expect(inspect.exitCode).toBe(0)
  expect(JSON.parse(inspect.stdout)).toMatchObject({
    kind: "pcb",
    sheets: 1,
  })

  const validate = await runCli("validate", fixture)
  expect(validate.exitCode).toBe(0)
  expect(JSON.parse(validate.stdout)).toEqual({ kind: "pcb", valid: true })

  const normalizedPath = join(temporaryDirectory, "normalized.json")
  const normalize = await runCli("normalize", fixture, normalizedPath)
  expect(normalize.exitCode).toBe(0)
  expect(
    (await readFile(normalizedPath, "utf8")).startsWith('{\n  "head"'),
  ).toBe(true)

  const roundTrip = await runCli("round-trip", normalizedPath)
  expect(roundTrip.exitCode).toBe(0)
  expect(JSON.parse(roundTrip.stdout)).toEqual({
    exactSourceRoundTrip: true,
    normalizedStable: true,
  })

  const svgPath = join(temporaryDirectory, "board.svg")
  const svg = await runCli("svg", normalizedPath, svgPath)
  expect(svg.exitCode).toBe(0)
  expect(await readFile(svgPath, "utf8")).toContain("<svg")
})

test("CLI validate returns machine-readable structured errors", async () => {
  const invalidPath = join(temporaryDirectory, "invalid.json")
  await Bun.write(
    invalidPath,
    JSON.stringify({ head: "3~1.0~", shape: ["TRACK~1~1"] }),
  )

  const result = await runCli("validate", invalidPath)
  expect(result.exitCode).toBe(1)
  expect(JSON.parse(result.stderr)).toMatchObject({
    code: "truncated-record",
    fieldIndex: 2,
    path: ["shape", 0],
    recordToken: "TRACK",
  })
})
