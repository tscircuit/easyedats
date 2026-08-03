import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaNetFlag extends EasyEdaShape {
  static readonly token = "F"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaNetFlag.token }
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

EasyEdaShape.register(EasyEdaNetFlag)
