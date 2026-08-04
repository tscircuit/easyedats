import { EasyEdaNode } from "./base-node"
import { EasyEdaCanvas } from "./canvas"
import { insertAt, moveWithin, removeAt } from "./collection-mutations"
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
  | "schematic-list"
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
    this.initialFingerprint = JSON.stringify(this.buildObject())
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

  appendShape<T extends EasyEdaShape>(shape: T): T {
    return this.insertShape(this.shapes.length, shape)
  }

  insertShape<T extends EasyEdaShape>(index: number, shape: T): T {
    return insertAt(this.shapes, index, shape, "shapes")
  }

  removeShape(index: number): EasyEdaShape {
    return removeAt(this.shapes, index, "shapes")
  }

  moveShape(fromIndex: number, toIndex: number): void {
    moveWithin(this.shapes, fromIndex, toIndex, "shapes")
  }

  appendLayer(layer: EasyEdaLayer | string): EasyEdaLayer {
    return this.insertLayer(this.layers.length, layer)
  }

  insertLayer(index: number, layer: EasyEdaLayer | string): EasyEdaLayer {
    const parsed = typeof layer === "string" ? new EasyEdaLayer(layer) : layer
    return insertAt(this.layers, index, parsed, "layers")
  }

  removeLayer(index: number): EasyEdaLayer {
    return removeAt(this.layers, index, "layers")
  }

  moveLayer(fromIndex: number, toIndex: number): void {
    moveWithin(this.layers, fromIndex, toIndex, "layers")
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

  private buildObject(): Record<string, EasyEdaJsonValue> {
    const result: Record<string, EasyEdaJsonValue> = {}
    const seen = new Set<string>()
    const addProperty = (key: string, value: EasyEdaJsonValue | undefined) => {
      seen.add(key)
      if (value !== undefined) result[key] = value
    }
    const valueForKey = (key: string): EasyEdaJsonValue | undefined => {
      if (key === "head") return this.head.toValue()
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

  toObject(): Record<string, EasyEdaJsonValue> {
    return this.buildObject()
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

export interface EasyEdaSchematicListEntryInit {
  document: EasyEdaSchematic
  properties?: Record<string, EasyEdaJsonValue>
  propertyOrder?: readonly string[]
}

export class EasyEdaSchematicListEntry extends EasyEdaNode {
  document: EasyEdaSchematic
  private readonly properties: Record<string, EasyEdaJsonValue>
  private readonly propertyOrder: string[]

  constructor(init: EasyEdaSchematicListEntryInit) {
    super()
    this.document = init.document
    this.properties = { ...(init.properties ?? {}) }
    this.propertyOrder = [...(init.propertyOrder ?? [])]
  }

  override get type(): string {
    return "schematic-list-entry"
  }

  override getChildren(): EasyEdaNode[] {
    return [this.document]
  }

  getProperty<T extends EasyEdaJsonValue = EasyEdaJsonValue>(
    key: string,
  ): T | undefined {
    return this.properties[key] as T | undefined
  }

  setProperty(key: string, value: EasyEdaJsonValue | undefined): void {
    if (key === "dataStr") {
      throw new Error("Use the typed document property instead")
    }
    if (value === undefined) delete this.properties[key]
    else this.properties[key] = value
  }

  toObject(): Record<string, EasyEdaJsonValue> {
    const result: Record<string, EasyEdaJsonValue> = {}
    const seen = new Set<string>()

    for (const key of this.propertyOrder) {
      seen.add(key)
      if (key === "dataStr") result.dataStr = this.document.toObject()
      else if (this.properties[key] !== undefined) {
        result[key] = this.properties[key]
      }
    }

    if (!seen.has("dataStr")) result.dataStr = this.document.toObject()
    for (const [key, value] of Object.entries(this.properties)) {
      if (!seen.has(key)) result[key] = value
    }
    return result
  }

  override getString(): string {
    return JSON.stringify(this.toObject())
  }
}

export interface EasyEdaSchematicListInit {
  schematics: readonly EasyEdaSchematicListEntry[]
  properties?: Record<string, EasyEdaJsonValue>
  propertyOrder?: readonly string[]
  originalSource?: string
}

export class EasyEdaSchematicList extends EasyEdaDocument {
  schematics: EasyEdaSchematicListEntry[]
  private readonly listProperties: Record<string, EasyEdaJsonValue>
  private readonly listPropertyOrder: string[]
  private readonly listOriginalSource?: string
  private readonly listInitialFingerprint: string

  constructor(init: EasyEdaSchematicListInit) {
    super("schematic-list", {
      head: new EasyEdaHead({ object: { docType: 5 } }),
    })
    this.schematics = [...init.schematics]
    this.listProperties = { ...(init.properties ?? {}) }
    this.listPropertyOrder = [...(init.propertyOrder ?? [])]
    this.listOriginalSource = init.originalSource
    this.listInitialFingerprint = JSON.stringify(this.toObject())
  }

  get sheets(): EasyEdaSchematic[] {
    return this.schematics.map((entry) => entry.document)
  }

  appendSheet(sheet: EasyEdaSchematicListEntry): EasyEdaSchematicListEntry
  appendSheet(
    sheet: EasyEdaSchematic,
    init?: Omit<EasyEdaSchematicListEntryInit, "document">,
  ): EasyEdaSchematicListEntry
  appendSheet(
    sheet: EasyEdaSchematic | EasyEdaSchematicListEntry,
    init: Omit<EasyEdaSchematicListEntryInit, "document"> = {},
  ): EasyEdaSchematicListEntry {
    return sheet instanceof EasyEdaSchematicListEntry
      ? this.insertSheet(this.schematics.length, sheet)
      : this.insertSheet(this.schematics.length, sheet, init)
  }

  insertSheet(
    index: number,
    sheet: EasyEdaSchematicListEntry,
  ): EasyEdaSchematicListEntry
  insertSheet(
    index: number,
    sheet: EasyEdaSchematic,
    init?: Omit<EasyEdaSchematicListEntryInit, "document">,
  ): EasyEdaSchematicListEntry
  insertSheet(
    index: number,
    sheet: EasyEdaSchematic | EasyEdaSchematicListEntry,
    init: Omit<EasyEdaSchematicListEntryInit, "document"> = {},
  ): EasyEdaSchematicListEntry {
    const entry =
      sheet instanceof EasyEdaSchematicListEntry
        ? sheet
        : new EasyEdaSchematicListEntry({ ...init, document: sheet })
    return insertAt(this.schematics, index, entry, "schematic sheets")
  }

  removeSheet(index: number): EasyEdaSchematicListEntry {
    return removeAt(this.schematics, index, "schematic sheets")
  }

  moveSheet(fromIndex: number, toIndex: number): void {
    moveWithin(this.schematics, fromIndex, toIndex, "schematic sheets")
  }

  override getChildren(): EasyEdaNode[] {
    return [...this.schematics]
  }

  override getProperty<T extends EasyEdaJsonValue = EasyEdaJsonValue>(
    key: string,
  ): T | undefined {
    return this.listProperties[key] as T | undefined
  }

  override setProperty(key: string, value: EasyEdaJsonValue | undefined): void {
    if (key === "schematics") {
      throw new Error("Use the typed schematics property instead")
    }
    if (value === undefined) delete this.listProperties[key]
    else this.listProperties[key] = value
  }

  override toObject(): Record<string, EasyEdaJsonValue> {
    const result: Record<string, EasyEdaJsonValue> = {}
    const seen = new Set<string>()

    for (const key of this.listPropertyOrder) {
      seen.add(key)
      if (key === "schematics") {
        result.schematics = this.schematics.map((entry) => entry.toObject())
      } else if (this.listProperties[key] !== undefined) {
        result[key] = this.listProperties[key]
      }
    }

    if (!seen.has("schematics")) {
      result.schematics = this.schematics.map((entry) => entry.toObject())
    }
    for (const [key, value] of Object.entries(this.listProperties)) {
      if (!seen.has(key)) result[key] = value
    }
    return result
  }

  override getString(options: EasyEdaSerializeOptions = {}): string {
    const preserveSourceFormatting = options.preserveSourceFormatting ?? true
    const object = this.toObject()

    if (
      preserveSourceFormatting &&
      this.listOriginalSource !== undefined &&
      JSON.stringify(object) === this.listInitialFingerprint
    ) {
      return this.listOriginalSource
    }

    const serialized = JSON.stringify(object, null, options.indent ?? 2)
    return (options.trailingNewline ?? true) ? `${serialized}\n` : serialized
  }
}
