import {
  type EasyEdaPoint,
  parsePoints,
  serializePoints,
  shapeId,
} from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaWire extends EasyEdaShape {
  static readonly token = "W"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaWire.token } : init,
    )
  }

  get points(): EasyEdaPoint[] {
    return parsePoints(this.getField(0))
  }

  set points(value: readonly EasyEdaPoint[]) {
    this.setField(0, serializePoints(value))
  }

  get strokeColor(): string | undefined {
    return this.getField(1)
  }

  set strokeColor(value: string | undefined) {
    this.setField(1, value)
  }

  get strokeWidth(): number | undefined {
    return this.getNumberField(2)
  }

  set strokeWidth(value: number | undefined) {
    this.setField(2, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaWire)
