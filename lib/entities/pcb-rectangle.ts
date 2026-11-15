import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaPcbRectangle extends EasyEdaShape {
  static readonly token = "RECT"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaPcbRectangle.token }
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
    return this.getNumberField(2)
  }

  set width(value: number | undefined) {
    this.setField(2, value)
  }

  get height(): number | undefined {
    return this.getNumberField(3)
  }

  set height(value: number | undefined) {
    this.setField(3, value)
  }

  get layerId(): number | undefined {
    return this.getNumberField(4)
  }

  set layerId(value: number | undefined) {
    this.setField(4, value)
  }

  get strokeWidth(): number | undefined {
    return this.getNumberField(7)
  }

  set strokeWidth(value: number | undefined) {
    this.setField(7, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaPcbRectangle)
