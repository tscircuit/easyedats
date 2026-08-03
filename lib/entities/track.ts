import {
  type EasyEdaPoint,
  parsePoints,
  serializePoints,
  shapeId,
} from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaTrack extends EasyEdaShape {
  static readonly token = "TRACK"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaTrack.token } : init,
    )
  }

  get width(): number | undefined {
    return this.getNumberField(0)
  }

  set width(value: number | undefined) {
    this.setField(0, value)
  }

  get layerId(): number | undefined {
    return this.getNumberField(1)
  }

  set layerId(value: number | undefined) {
    this.setField(1, value)
  }

  get net(): string | undefined {
    return this.getField(2)
  }

  set net(value: string | undefined) {
    this.setField(2, value)
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

EasyEdaShape.register(EasyEdaTrack)
