import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaCircle extends EasyEdaShape {
  static readonly token = "C"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaCircle.token }
        : init,
    )
  }

  get x(): number | undefined {
    return this.getNumberField(0)
  }

  set x(value: number | undefined) {
    this.setField(0, value)
  }

  get y(): number | undefined {
    return this.getNumberField(1)
  }

  set y(value: number | undefined) {
    this.setField(1, value)
  }

  get radius(): number | undefined {
    return this.getNumberField(2)
  }

  set radius(value: number | undefined) {
    this.setField(2, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaCircle)
