import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaNetLabel extends EasyEdaShape {
  static readonly token = "N"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaNetLabel.token }
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

  get name(): string | undefined {
    return this.getField(4)
  }

  set name(value: string | undefined) {
    this.setField(4, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaNetLabel)
