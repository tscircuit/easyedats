import {
  type EasyEdaPoint,
  parsePoints,
  serializePoints,
  shapeId,
} from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaCopperArea extends EasyEdaShape {
  static readonly token = "COPPERAREA"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaCopperArea.token }
        : init,
    )
  }

  get strokeWidth(): number | undefined {
    return this.getNumberField(0)
  }

  get layerId(): number | undefined {
    return this.getNumberField(1)
  }

  get net(): string | undefined {
    return this.getField(2)
  }

  get points(): EasyEdaPoint[] {
    return parsePoints(this.getField(3))
  }

  set points(value: readonly EasyEdaPoint[]) {
    this.setField(3, serializePoints(value))
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaCopperArea)
