import "../entities/register-all"
import { EasyEdaCanvas } from "../canvas"
import {
  EasyEdaDocument,
  type EasyEdaDocumentInit,
  type EasyEdaJsonValue,
  EasyEdaPcb,
  EasyEdaSchematic,
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

export function parseEasyEdaSource(source: string): EasyEdaDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Could not parse EasyEDA JSON: ${message}`)
  }

  if (!isObject(parsed))
    throw new Error("Expected EasyEDA source to be a JSON object")

  const headSource = expectString(parsed.head, "head")
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

  const head = new EasyEdaHead(headSource)
  const init: EasyEdaDocumentInit = {
    head,
    canvas:
      canvasSource !== undefined ? new EasyEdaCanvas(canvasSource) : undefined,
    shapes: shapeSources.map((shape) => EasyEdaShape.parse(shape)),
    layers:
      parsed.layers === undefined
        ? undefined
        : layerSources.map((layer) => new EasyEdaLayer(layer)),
    properties,
    propertyOrder: Object.keys(parsed),
    originalSource: source,
  }

  if (head.documentTypeCode === 1) return new EasyEdaSchematic(init)
  if (head.documentTypeCode === 3) return new EasyEdaPcb(init)
  return new EasyEdaDocument("unknown", init)
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

export const parseEasyEdaStandard = parseEasyEdaSource
