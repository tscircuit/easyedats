import { EasyEdaNode } from "./base-node"
import { EasyEdaCanvas } from "./canvas"
import type { EasyEdaShape } from "./entities/shape"
import { EasyEdaHead } from "./head"
import { EasyEdaLayer } from "./layer"

export type EasyEdaJsonPrimitive = string | number | boolean | null
export type EasyEdaJsonValue =
  | EasyEdaJsonPrimitive
  | EasyEdaJsonValue[]
  | { [key: string]: EasyEdaJsonValue }

export type EasyEdaDocumentKind =
  | "schematic"
  | "schematic-symbol"
  | "pcb"
  | "pcb-footprint"
  | "unknown"

export interface EasyEdaDocumentInit {
  head: EasyEdaHead | string
  canvas?: EasyEdaCanvas | string
  shapes?: readonly EasyEdaShape[]
  layers?: readonly (EasyEdaLayer | string)[]
  properties?: Record<string, EasyEdaJsonValue>
  propertyOrder?: readonly string[]
  originalSource?: string
}

export interface EasyEdaSerializeOptions {
  indent?: number | string
  preserveSourceFormatting?: boolean
  trailingNewline?: boolean
}

export class EasyEdaDocument extends EasyEdaNode {
  readonly kind: EasyEdaDocumentKind
  head: EasyEdaHead
  canvas?: EasyEdaCanvas
  shapes: EasyEdaShape[]
  layers: EasyEdaLayer[]
  private readonly properties: Record<string, EasyEdaJsonValue>
  private readonly originalSource?: string
  private readonly initialFingerprint: string
  private readonly includeLayers: boolean
  private readonly includeShapes: boolean
  private readonly propertyOrder: string[]

  constructor(kind: EasyEdaDocumentKind, init: EasyEdaDocumentInit) {
    super()
    this.kind = kind
    this.head =
      typeof init.head === "string" ? new EasyEdaHead(init.head) : init.head
    this.canvas =
      typeof init.canvas === "string"
        ? new EasyEdaCanvas(init.canvas)
        : init.canvas
    this.shapes = [...(init.shapes ?? [])]
    this.includeShapes = init.shapes !== undefined
    this.layers = (init.layers ?? []).map((layer) =>
      typeof layer === "string" ? new EasyEdaLayer(layer) : layer,
    )
    this.includeLayers = init.layers !== undefined
    this.properties = { ...(init.properties ?? {}) }
    this.propertyOrder = [...(init.propertyOrder ?? [])]
    this.originalSource = init.originalSource
    this.initialFingerprint = JSON.stringify(this.toObject())
  }

  override get type(): string {
    return this.kind
  }

  get documentTypeCode(): number | undefined {
    return this.head.documentTypeCode
  }

  override getChildren(): EasyEdaNode[] {
    return [
      this.head,
      ...(this.canvas ? [this.canvas] : []),
      ...this.layers,
      ...this.shapes,
    ]
  }

  getProperty<T extends EasyEdaJsonValue = EasyEdaJsonValue>(
    key: string,
  ): T | undefined {
    return this.properties[key] as T | undefined
  }

  setProperty(key: string, value: EasyEdaJsonValue | undefined): void {
    if (
      key === "head" ||
      key === "canvas" ||
      key === "shape" ||
      key === "layers"
    ) {
      throw new Error(`Use the typed ${key} property instead`)
    }

    if (value === undefined) {
      delete this.properties[key]
      return
    }
    this.properties[key] = value
  }

  toObject(): Record<string, EasyEdaJsonValue> {
    const result: Record<string, EasyEdaJsonValue> = {}
    const seen = new Set<string>()
    const addProperty = (key: string, value: EasyEdaJsonValue | undefined) => {
      seen.add(key)
      if (value !== undefined) result[key] = value
    }
    const valueForKey = (key: string): EasyEdaJsonValue | undefined => {
      if (key === "head") return this.head.getString()
      if (key === "canvas") return this.canvas?.getString()
      if (key === "shape") {
        if (!this.includeShapes && this.shapes.length === 0) return undefined
        return this.shapes.map((shape) => shape.getString())
      }
      if (key === "layers") {
        if (!this.includeLayers && this.layers.length === 0) return undefined
        return this.layers.map((layer) => layer.getString())
      }
      return this.properties[key]
    }

    for (const key of this.propertyOrder) {
      addProperty(key, valueForKey(key))
    }

    addProperty("head", valueForKey("head"))
    addProperty("canvas", valueForKey("canvas"))
    addProperty("shape", valueForKey("shape"))
    addProperty("layers", valueForKey("layers"))
    for (const [key, value] of Object.entries(this.properties)) {
      if (!seen.has(key)) addProperty(key, value)
    }
    return result
  }

  override getString(options: EasyEdaSerializeOptions = {}): string {
    const preserveSourceFormatting = options.preserveSourceFormatting ?? true
    const currentObject = this.toObject()
    const currentFingerprint = JSON.stringify(currentObject)

    if (
      preserveSourceFormatting &&
      this.originalSource !== undefined &&
      currentFingerprint === this.initialFingerprint
    ) {
      return this.originalSource
    }

    const indent = options.indent ?? 2
    const trailingNewline = options.trailingNewline ?? true
    const serialized = JSON.stringify(currentObject, null, indent)
    return trailingNewline ? `${serialized}\n` : serialized
  }
}

export class EasyEdaSchematic extends EasyEdaDocument {
  constructor(init: EasyEdaDocumentInit) {
    super("schematic", init)
  }
}

export class EasyEdaPcb extends EasyEdaDocument {
  constructor(init: EasyEdaDocumentInit) {
    super("pcb", init)
  }
}

export class EasyEdaSchematicSymbol extends EasyEdaDocument {
  constructor(init: EasyEdaDocumentInit) {
    super("schematic-symbol", init)
  }
}

export class EasyEdaPcbFootprint extends EasyEdaDocument {
  constructor(init: EasyEdaDocumentInit) {
    super("pcb-footprint", init)
  }
}
