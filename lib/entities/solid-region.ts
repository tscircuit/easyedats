import {
  type EasyEdaPoint,
  parsePoints,
  serializePoints,
  shapeId,
} from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaSolidRegion extends EasyEdaShape {
  static readonly token = "SOLIDREGION"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaSolidRegion.token }
        : init,
    )
  }

  get layerId(): number | undefined {
    return this.getNumberField(0)
  }

  get net(): string | undefined {
    return this.getField(1)
  }

  get points(): EasyEdaPoint[] {
    return parsePoints(this.getField(2))
  }

  set points(value: readonly EasyEdaPoint[]) {
    this.setField(2, serializePoints(value))
  }

  get fillStyle(): string | undefined {
    return this.getField(3)
  }

  set fillStyle(value: string | undefined) {
    this.setField(3, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaSolidRegion)
