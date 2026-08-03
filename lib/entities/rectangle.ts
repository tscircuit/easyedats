import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaRectangle extends EasyEdaShape {
  static readonly token = "R"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaRectangle.token }
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

  get width(): number | undefined {
    return this.getNumberField(4)
  }

  set width(value: number | undefined) {
    this.setField(4, value)
  }

  get height(): number | undefined {
    return this.getNumberField(5)
  }

  set height(value: number | undefined) {
    this.setField(5, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaRectangle)
