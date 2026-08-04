import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export type EasyEdaSvgAttributeValue = string | number | boolean | null

export interface EasyEdaSvgNodeData {
  attrs?: Record<string, EasyEdaSvgAttributeValue>
  childNodes?: EasyEdaSvgNodeData[]
  gId?: string
  layerid?: string | number
  nodeName?: string
  nodeType?: number
  textContent?: string
  [key: string]: unknown
}

export class EasyEdaSvgNode extends EasyEdaShape {
  static readonly token = "SVGNODE"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaSvgNode.token }
        : init,
    )
  }

  get svgData(): EasyEdaSvgNodeData | undefined {
    try {
      const value: unknown = JSON.parse(this.fields.join("~"))
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined
      }
      return value as EasyEdaSvgNodeData
    } catch {
      return undefined
    }
  }

  set svgData(value: EasyEdaSvgNodeData | undefined) {
    this.fields = value === undefined ? [] : [JSON.stringify(value)]
  }

  get id(): string | undefined {
    const data = this.svgData
    if (typeof data?.gId === "string") return data.gId
    const id = data?.attrs?.id
    return typeof id === "string" ? id : undefined
  }

  get layerId(): number | undefined {
    const data = this.svgData
    const value = data?.layerid ?? data?.attrs?.layerid
    if (value === undefined || value === null || value === "") return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
}

EasyEdaShape.register(EasyEdaSvgNode)
