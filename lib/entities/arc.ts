import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaArc extends EasyEdaShape {
  static readonly token = "A"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaArc.token } : init,
    )
  }

  get path(): string | undefined {
    return this.getField(0)
  }

  set path(value: string | undefined) {
    this.setField(0, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaArc)
