import "../entities/register-all"
import { EasyEdaCanvas } from "../canvas"
import {
  EasyEdaDocument,
  type EasyEdaDocumentInit,
  type EasyEdaJsonValue,
  EasyEdaPcb,
  EasyEdaPcbFootprint,
  EasyEdaSchematic,
  EasyEdaSchematicList,
  EasyEdaSchematicListEntry,
  EasyEdaSchematicSymbol,
} from "../document"
import { EasyEdaShape } from "../entities/shape"
import { EasyEdaHead } from "../head"
import { EasyEdaLayer } from "../layer"
import { EasyEdaParseError, type EasyEdaParsePathSegment } from "./parse-error"

export interface EasyEdaParseLimits {
  maxJsonDepth: number
  maxRecordLength: number
  maxShapes: number
  maxSheets: number
  maxSourceBytes: number
}

export interface EasyEdaParseOptions {
  limits?: Partial<EasyEdaParseLimits>
  validateRecords?: boolean
}

export const DEFAULT_EASYEDA_PARSE_LIMITS: Readonly<EasyEdaParseLimits> = {
  maxJsonDepth: 128,
  maxRecordLength: 2 * 1024 * 1024,
  maxShapes: 250_000,
  maxSheets: 1_000,
  maxSourceBytes: 32 * 1024 * 1024,
}

const MINIMUM_RECORD_FIELDS = new Map<string, number>([
  ["A", 1],
  ["ARC", 4],
  ["B", 1],
  ["BE", 5],
  ["C", 3],
  ["CIRCLE", 5],
  ["COPPERAREA", 4],
  ["DIMENSION", 2],
  ["E", 4],
  ["F", 5],
  ["HOLE", 4],
  ["I", 6],
  ["J", 2],
  ["L", 4],
  ["LIB", 1],
  ["N", 5],
  ["O", 2],
  ["P", 6],
  ["PAD", 11],
  ["PG", 1],
  ["PI", 1],
  ["PL", 1],
  ["PT", 1],
  ["R", 6],
  ["RECT", 6],
  ["SOLIDREGION", 3],
  ["SVGNODE", 1],
  ["T", 12],
  ["TEXT", 10],
  ["TRACK", 5],
  ["VIA", 6],
  ["W", 1],
])

interface ParseState {
  limits: EasyEdaParseLimits
  shapeCount: number
  validateRecords: boolean
}

function resolveLimits(
  overrides: Partial<EasyEdaParseLimits> | undefined,
): EasyEdaParseLimits {
  const limits = { ...DEFAULT_EASYEDA_PARSE_LIMITS, ...overrides }
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new EasyEdaParseError(
        `EasyEDA parse limit ${name} must be a positive integer`,
        { code: "invalid-options", path: ["options", "limits", name] },
      )
    }
  }
  return limits
}

function assertJsonDepth(value: unknown, limit: number): void {
  const stack: Array<{
    depth: number
    path: EasyEdaParsePathSegment[]
    value: unknown
  }> = [{ depth: 0, path: [], value }]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) break
    if (current.depth > limit) {
      throw new EasyEdaParseError(
        `EasyEDA JSON exceeds the maximum nesting depth of ${limit}`,
        { code: "limit-exceeded", path: current.path },
      )
    }
    if (!current.value || typeof current.value !== "object") continue
    const entries = Array.isArray(current.value)
      ? current.value.map((child, index) => [index, child] as const)
      : Object.entries(current.value)
    for (const [key, child] of entries) {
      stack.push({
        depth: current.depth + 1,
        path: [...current.path, key],
        value: child,
      })
    }
  }
}

function validateShapeSource(
  source: string,
  path: readonly EasyEdaParsePathSegment[],
  state: ParseState,
): void {
  if (source.length > state.limits.maxRecordLength) {
    throw new EasyEdaParseError(
      `EasyEDA shape record exceeds the maximum length of ${state.limits.maxRecordLength}`,
      { code: "limit-exceeded", path },
    )
  }

  const records = source.startsWith("LIB~") ? source.split("#@$") : [source]
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index] ?? ""
    const recordPath = index === 0 ? path : [...path, "children", index - 1]
    const separatorIndex = record.indexOf("~")
    const token =
      separatorIndex === -1 ? record : record.slice(0, separatorIndex)
    state.shapeCount += 1
    if (state.shapeCount > state.limits.maxShapes) {
      throw new EasyEdaParseError(
        `EasyEDA document exceeds the maximum of ${state.limits.maxShapes} shape records`,
        { code: "limit-exceeded", path: recordPath, recordToken: token },
      )
    }
    if (!token) {
      throw new EasyEdaParseError("EasyEDA shape record is truncated", {
        code: "truncated-record",
        path: recordPath,
        recordToken: records[0]?.split("~", 1)[0] || undefined,
        fieldIndex: 0,
      })
    }
    if (!state.validateRecords) continue
    const fields =
      separatorIndex === -1 ? [] : record.slice(separatorIndex + 1).split("~")
    const minimumFields = MINIMUM_RECORD_FIELDS.get(token)
    if (minimumFields !== undefined && fields.length < minimumFields) {
      throw new EasyEdaParseError(
        `EasyEDA ${token} record is truncated: expected at least ${minimumFields} fields, got ${fields.length}`,
        {
          code: "truncated-record",
          path: recordPath,
          recordToken: token,
          fieldIndex: fields.length,
        },
      )
    }
    if (token === "SVGNODE") {
      try {
        JSON.parse(fields.join("~"))
      } catch (cause) {
        throw new EasyEdaParseError("EasyEDA SVGNODE contains invalid JSON", {
          cause,
          code: "invalid-record",
          path: recordPath,
          recordToken: token,
          fieldIndex: 0,
        })
      }
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function expectString(
  value: unknown,
  path: readonly EasyEdaParsePathSegment[],
): string {
  if (typeof value !== "string") {
    throw new EasyEdaParseError("Expected EasyEDA value to be a string", {
      code: "invalid-type",
      path,
    })
  }
  return value
}

function expectStringArray(
  value: unknown,
  path: readonly EasyEdaParsePathSegment[],
): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    throw new EasyEdaParseError(
      "Expected EasyEDA value to be an array of strings",
      { code: "invalid-type", path },
    )
  }
  for (let index = 0; index < value.length; index += 1) {
    if (typeof value[index] !== "string") {
      throw new EasyEdaParseError(
        "Expected EasyEDA array item to be a string",
        { code: "invalid-type", path: [...path, index] },
      )
    }
  }
  return value as string[]
}

function expectJsonObject(
  value: unknown,
  path: readonly EasyEdaParsePathSegment[],
): Record<string, EasyEdaJsonValue> {
  if (!isObject(value)) {
    throw new EasyEdaParseError("Expected EasyEDA value to be a JSON object", {
      code: "invalid-type",
      path,
    })
  }
  return value as Record<string, EasyEdaJsonValue>
}

function parseDocumentObject(
  parsed: Record<string, unknown>,
  state: ParseState,
  path: readonly EasyEdaParsePathSegment[] = [],
  originalSource?: string,
): EasyEdaDocument {
  const head =
    typeof parsed.head === "string"
      ? new EasyEdaHead(parsed.head)
      : new EasyEdaHead({
          object: expectJsonObject(parsed.head, [...path, "head"]),
        })
  const canvasSource =
    parsed.canvas === undefined
      ? undefined
      : expectString(parsed.canvas, [...path, "canvas"])
  const shapeSources = expectStringArray(parsed.shape, [...path, "shape"])
  const layerSources = expectStringArray(parsed.layers, [...path, "layers"])
  for (let index = 0; index < shapeSources.length; index += 1) {
    validateShapeSource(
      shapeSources[index] ?? "",
      [...path, "shape", index],
      state,
    )
  }
  for (let index = 0; index < layerSources.length; index += 1) {
    const layer = layerSources[index] ?? ""
    if (layer.length > state.limits.maxRecordLength) {
      throw new EasyEdaParseError(
        `EasyEDA layer record exceeds the maximum length of ${state.limits.maxRecordLength}`,
        { code: "limit-exceeded", path: [...path, "layers", index] },
      )
    }
  }
  const properties = { ...parsed } as Record<string, EasyEdaJsonValue>
  delete properties.head
  delete properties.canvas
  delete properties.shape
  delete properties.layers

  const init: EasyEdaDocumentInit = {
    head,
    canvas:
      canvasSource !== undefined ? new EasyEdaCanvas(canvasSource) : undefined,
    shapes:
      parsed.shape === undefined
        ? undefined
        : shapeSources.map((shape) => EasyEdaShape.parse(shape)),
    layers:
      parsed.layers === undefined
        ? undefined
        : layerSources.map((layer) => new EasyEdaLayer(layer)),
    properties,
    propertyOrder: Object.keys(parsed),
    originalSource,
  }

  if (head.documentTypeCode === 1) return new EasyEdaSchematic(init)
  if (head.documentTypeCode === 2) return new EasyEdaSchematicSymbol(init)
  if (head.documentTypeCode === 3) return new EasyEdaPcb(init)
  if (head.documentTypeCode === 4) return new EasyEdaPcbFootprint(init)
  if (head.documentTypeCode === 7) return new EasyEdaSchematicSymbol(init)
  return new EasyEdaDocument("unknown", init)
}

function parseSchematicList(
  parsed: Record<string, unknown>,
  originalSource: string,
  state: ParseState,
): EasyEdaSchematicList {
  if (!Array.isArray(parsed.schematics)) {
    throw new EasyEdaParseError("Expected EasyEDA schematics to be an array", {
      code: "invalid-type",
      path: ["schematics"],
    })
  }
  if (parsed.schematics.length > state.limits.maxSheets) {
    throw new EasyEdaParseError(
      `EasyEDA schematic list exceeds the maximum of ${state.limits.maxSheets} sheets`,
      { code: "limit-exceeded", path: ["schematics"] },
    )
  }

  const schematics = parsed.schematics.map((value, index) => {
    const entry = expectJsonObject(value, ["schematics", index])
    const dataStr = expectJsonObject(entry.dataStr, [
      "schematics",
      index,
      "dataStr",
    ])
    const document = parseDocumentObject(dataStr, state, [
      "schematics",
      index,
      "dataStr",
    ])
    if (!(document instanceof EasyEdaSchematic)) {
      throw new EasyEdaParseError(
        `Expected EasyEDA schematics[${index}] document type 1, got ${document.documentTypeCode ?? "unknown"}`,
        {
          code: "unexpected-document-type",
          path: ["schematics", index, "dataStr", "head"],
        },
      )
    }

    const properties = { ...entry }
    delete properties.dataStr
    return new EasyEdaSchematicListEntry({
      document,
      properties,
      propertyOrder: Object.keys(entry),
    })
  })
  const properties = { ...parsed } as Record<string, EasyEdaJsonValue>
  delete properties.schematics

  return new EasyEdaSchematicList({
    schematics,
    properties,
    propertyOrder: Object.keys(parsed),
    originalSource,
  })
}

export function parseEasyEdaSource(
  source: string,
  options: EasyEdaParseOptions = {},
): EasyEdaDocument {
  const limits = resolveLimits(options.limits)
  const sourceBytes = new TextEncoder().encode(source).byteLength
  if (sourceBytes > limits.maxSourceBytes) {
    throw new EasyEdaParseError(
      `EasyEDA source is ${sourceBytes} bytes, exceeding the maximum of ${limits.maxSourceBytes}`,
      { code: "limit-exceeded", path: [] },
    )
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    const positionMatch = message.match(/position\s+(\d+)/i)
    throw new EasyEdaParseError(`Could not parse EasyEDA JSON: ${message}`, {
      cause,
      code: "invalid-json",
      path: [],
      sourcePosition: positionMatch ? Number(positionMatch[1]) : undefined,
    })
  }

  assertJsonDepth(parsed, limits.maxJsonDepth)

  if (!isObject(parsed)) {
    throw new EasyEdaParseError("Expected EasyEDA source to be a JSON object", {
      code: "invalid-type",
      path: [],
    })
  }

  const state: ParseState = {
    limits,
    shapeCount: 0,
    validateRecords: options.validateRecords ?? false,
  }

  if (Number(parsed.docType) === 5 || parsed.schematics !== undefined) {
    return parseSchematicList(parsed, source, state)
  }
  return parseDocumentObject(parsed, state, [], source)
}

function unexpectedDocumentType(
  expected: string,
  expectedCode: number,
  actual: number | undefined,
): EasyEdaParseError {
  return new EasyEdaParseError(
    `Expected EasyEDA ${expected} document type ${expectedCode}, got ${actual ?? "unknown"}`,
    { code: "unexpected-document-type", path: ["head"] },
  )
}

export function parseEasyEdaSchematic(source: string): EasyEdaSchematic {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaSchematic)) {
    throw unexpectedDocumentType("schematic", 1, document.documentTypeCode)
  }
  return document
}

export function parseEasyEdaPcb(source: string): EasyEdaPcb {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaPcb)) {
    throw unexpectedDocumentType("PCB", 3, document.documentTypeCode)
  }
  return document
}

export function parseEasyEdaSchematicSymbol(
  source: string,
): EasyEdaSchematicSymbol {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaSchematicSymbol)) {
    throw unexpectedDocumentType(
      "schematic symbol",
      7,
      document.documentTypeCode,
    )
  }
  return document
}

export function parseEasyEdaPcbFootprint(source: string): EasyEdaPcbFootprint {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaPcbFootprint)) {
    throw unexpectedDocumentType("PCB footprint", 4, document.documentTypeCode)
  }
  return document
}

export function parseEasyEdaSchematicList(
  source: string,
): EasyEdaSchematicList {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaSchematicList)) {
    throw unexpectedDocumentType("schematic list", 5, document.documentTypeCode)
  }
  return document
}

export const parseEasyEdaStandard = parseEasyEdaSource
