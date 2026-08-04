#!/usr/bin/env bun

import { writeFile } from "node:fs/promises"
import { EasyEdaSchematicList } from "./document"
import { EasyEdaLibrary } from "./entities/library"
import type { EasyEdaShape } from "./entities/shape"
import { EasyEdaUnknownShape } from "./entities/shape"
import { parseEasyEdaSource } from "./parser/parse-easyeda-source"
import { EasyEdaParseError } from "./parser/parse-error"
import { renderEasyEdaSvgWithDiagnostics } from "./svg/render-easyeda-svg"

const USAGE = `Usage: easyedats <command> <input> [output]

Commands:
  inspect      Print document type, layers, sheets, and shape counts as JSON
  validate     Strictly validate JSON, limits, and known record lengths
  normalize    Write deterministic, two-space EasyEDA JSON
  round-trip   Verify exact and normalized parse/serialize stability
  svg          Render a standalone SVG (remote images are omitted)

Use - as the input or output path for stdin or stdout.`

async function readInput(path: string): Promise<string> {
  return path === "-" ? await Bun.stdin.text() : await Bun.file(path).text()
}

async function writeOutput(
  path: string | undefined,
  value: string,
): Promise<void> {
  if (!path || path === "-") {
    process.stdout.write(value)
    return
  }
  await writeFile(path, value)
}

function countShapes(shapes: readonly EasyEdaShape[]): {
  totalRecords: number
  unknownRecords: number
} {
  let totalRecords = 0
  let unknownRecords = 0
  const visit = (shape: EasyEdaShape): void => {
    totalRecords += 1
    if (shape instanceof EasyEdaUnknownShape) unknownRecords += 1
    if (shape instanceof EasyEdaLibrary) {
      for (const child of shape.children) visit(child)
    }
  }
  for (const shape of shapes) visit(shape)
  return { totalRecords, unknownRecords }
}

export async function runEasyEdaCli(args: readonly string[]): Promise<number> {
  const [command, input, output] = args
  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    process.stdout.write(`${USAGE}\n`)
    return 0
  }
  if (!input) throw new Error(`${command} requires an input path\n\n${USAGE}`)
  if (
    !new Set(["inspect", "normalize", "round-trip", "svg", "validate"]).has(
      command,
    )
  ) {
    throw new Error(`Unknown easyedats command: ${command}\n\n${USAGE}`)
  }

  const source = await readInput(input)
  const document = parseEasyEdaSource(source, {
    validateRecords: command === "validate",
  })

  if (command === "inspect") {
    const documents =
      document instanceof EasyEdaSchematicList ? document.sheets : [document]
    const counts = documents.map((item) => countShapes(item.shapes))
    await writeOutput(
      output,
      `${JSON.stringify(
        {
          documentType: document.documentTypeCode,
          kind: document.kind,
          layers: documents.reduce((sum, item) => sum + item.layers.length, 0),
          sheets:
            document instanceof EasyEdaSchematicList
              ? document.sheets.length
              : 1,
          topLevelShapes: documents.reduce(
            (sum, item) => sum + item.shapes.length,
            0,
          ),
          totalRecords: counts.reduce(
            (sum, item) => sum + item.totalRecords,
            0,
          ),
          unknownRecords: counts.reduce(
            (sum, item) => sum + item.unknownRecords,
            0,
          ),
        },
        null,
        2,
      )}\n`,
    )
    return 0
  }

  if (command === "validate") {
    await writeOutput(
      output,
      `${JSON.stringify({ kind: document.kind, valid: true })}\n`,
    )
    return 0
  }

  if (command === "normalize") {
    await writeOutput(
      output,
      document.getString({ preserveSourceFormatting: false }),
    )
    return 0
  }

  if (command === "round-trip") {
    const exactSourceRoundTrip = document.getString() === source
    const normalized = document.getString({ preserveSourceFormatting: false })
    const normalizedStable =
      parseEasyEdaSource(normalized).getString({
        preserveSourceFormatting: false,
      }) === normalized
    if (!exactSourceRoundTrip || !normalizedStable) {
      throw new Error("EasyEDA round-trip verification failed")
    }
    await writeOutput(
      output,
      `${JSON.stringify({ exactSourceRoundTrip, normalizedStable })}\n`,
    )
    return 0
  }

  const result = renderEasyEdaSvgWithDiagnostics(document)
  await writeOutput(output, `${result.svg}\n`)
  if (result.diagnostics.length > 0) {
    process.stderr.write(`${JSON.stringify(result.diagnostics, null, 2)}\n`)
  }
  return 0
}

if (import.meta.main) {
  try {
    process.exitCode = await runEasyEdaCli(process.argv.slice(2))
  } catch (error) {
    if (error instanceof EasyEdaParseError) {
      process.stderr.write(
        `${JSON.stringify(
          {
            code: error.code,
            fieldIndex: error.fieldIndex,
            message: error.message,
            path: error.path,
            recordToken: error.recordToken,
            sourcePosition: error.sourcePosition,
          },
          null,
          2,
        )}\n`,
      )
    } else {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      )
    }
    process.exitCode = 1
  }
}
