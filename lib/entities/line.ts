import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaLine extends EasyEdaShape {
  static readonly token = "L"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaLine.token } : init,
    )
  }

  get x1(): number | undefined {
    return this.getNumberField(0)
  }

  set x1(value: number | undefined) {
    this.setField(0, value)
  }

  get y1(): number | undefined {
    return this.getNumberField(1)
  }

  set y1(value: number | undefined) {
    this.setField(1, value)
  }

  get x2(): number | undefined {
    return this.getNumberField(2)
  }

  set x2(value: number | undefined) {
    this.setField(2, value)
  }

  get y2(): number | undefined {
    return this.getNumberField(3)
  }

  set y2(value: number | undefined) {
    this.setField(3, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaLine)
