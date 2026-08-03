import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaPin extends EasyEdaShape {
  static readonly token = "P"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaPin.token } : init,
    )
  }

  get x(): number | undefined {
    return this.getNumberField(3)
  }

  get y(): number | undefined {
    return this.getNumberField(4)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaPin)
