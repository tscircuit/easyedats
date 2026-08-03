import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaVia extends EasyEdaShape {
  static readonly token = "VIA"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaVia.token } : init,
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

  get diameter(): number | undefined {
    return this.getNumberField(2)
  }

  set diameter(value: number | undefined) {
    this.setField(2, value)
  }

  get net(): string | undefined {
    return this.getField(3)
  }

  set net(value: string | undefined) {
    this.setField(3, value)
  }

  get holeRadius(): number | undefined {
    return this.getNumberField(4)
  }

  set holeRadius(value: number | undefined) {
    this.setField(4, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaVia)
