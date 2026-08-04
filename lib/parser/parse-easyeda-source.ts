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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function expectString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new Error(`Expected EasyEDA ${name} to be a string`)
  }
  return value
}

function expectStringArray(value: unknown, name: string): string[] {
  if (value === undefined) return []
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(`Expected EasyEDA ${name} to be an array of strings`)
  }
  return value
}

function expectJsonObject(
  value: unknown,
  name: string,
): Record<string, EasyEdaJsonValue> {
  if (!isObject(value)) {
    throw new Error(`Expected EasyEDA ${name} to be a JSON object`)
  }
  return value as Record<string, EasyEdaJsonValue>
}

function parseDocumentObject(
  parsed: Record<string, unknown>,
  originalSource?: string,
): EasyEdaDocument {
  const head =
    typeof parsed.head === "string"
      ? new EasyEdaHead(parsed.head)
      : new EasyEdaHead({ object: expectJsonObject(parsed.head, "head") })
  const canvasSource =
    parsed.canvas === undefined
      ? undefined
      : expectString(parsed.canvas, "canvas")
  const shapeSources = expectStringArray(parsed.shape, "shape")
  const layerSources = expectStringArray(parsed.layers, "layers")
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
): EasyEdaSchematicList {
  if (!Array.isArray(parsed.schematics)) {
    throw new Error("Expected EasyEDA schematics to be an array")
  }

  const schematics = parsed.schematics.map((value, index) => {
    const entry = expectJsonObject(value, `schematics[${index}]`)
    const dataStr = expectJsonObject(
      entry.dataStr,
      `schematics[${index}].dataStr`,
    )
    const document = parseDocumentObject(dataStr)
    if (!(document instanceof EasyEdaSchematic)) {
      throw new Error(
        `Expected EasyEDA schematics[${index}] document type 1, got ${document.documentTypeCode ?? "unknown"}`,
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

export function parseEasyEdaSource(source: string): EasyEdaDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not parse EasyEDA JSON: ${message}`)
  }

  if (!isObject(parsed)) {
    throw new Error("Expected EasyEDA source to be a JSON object")
  }

  if (Number(parsed.docType) === 5 || parsed.schematics !== undefined) {
    return parseSchematicList(parsed, source)
  }
  return parseDocumentObject(parsed, source)
}

export function parseEasyEdaSchematic(source: string): EasyEdaSchematic {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaSchematic)) {
    throw new Error(
      `Expected EasyEDA schematic document type 1, got ${document.documentTypeCode ?? "unknown"}`,
    )
  }
  return document
}

export function parseEasyEdaPcb(source: string): EasyEdaPcb {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaPcb)) {
    throw new Error(
      `Expected EasyEDA PCB document type 3, got ${document.documentTypeCode ?? "unknown"}`,
    )
  }
  return document
}

export function parseEasyEdaSchematicSymbol(
  source: string,
): EasyEdaSchematicSymbol {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaSchematicSymbol)) {
    throw new Error(
      `Expected EasyEDA schematic symbol document type 7, got ${document.documentTypeCode ?? "unknown"}`,
    )
  }
  return document
}

export function parseEasyEdaPcbFootprint(source: string): EasyEdaPcbFootprint {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaPcbFootprint)) {
    throw new Error(
      `Expected EasyEDA PCB footprint document type 4, got ${document.documentTypeCode ?? "unknown"}`,
    )
  }
  return document
}

export function parseEasyEdaSchematicList(
  source: string,
): EasyEdaSchematicList {
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaSchematicList)) {
    throw new Error(
      `Expected EasyEDA schematic list document type 5, got ${document.documentTypeCode ?? "unknown"}`,
    )
  }
  return document
}

export const parseEasyEdaStandard = parseEasyEdaSource
