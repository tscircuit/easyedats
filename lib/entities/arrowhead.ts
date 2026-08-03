import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaArrowhead extends EasyEdaShape {
  static readonly token = "AR"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaArrowhead.token }
        : init,
    )
  }

  get x(): number | undefined {
    return this.getNumberField(1)
  }

  get y(): number | undefined {
    return this.getNumberField(2)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaArrowhead)
