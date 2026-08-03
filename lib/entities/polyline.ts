import {
  type EasyEdaPoint,
  parsePoints,
  serializePoints,
  shapeId,
} from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaPolyline extends EasyEdaShape {
  static readonly token = "PL"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaPolyline.token }
        : init,
    )
  }

  get points(): EasyEdaPoint[] {
    return parsePoints(this.getField(0))
  }

  set points(value: readonly EasyEdaPoint[]) {
    this.setField(0, serializePoints(value))
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaPolyline)
