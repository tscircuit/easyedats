import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaPad extends EasyEdaShape {
  static readonly token = "PAD"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaPad.token } : init,
    )
  }

  get padShape(): string | undefined {
    return this.getField(0)
  }

  set padShape(value: string | undefined) {
    this.setField(0, value)
  }

  get x(): number | undefined {
    return this.getNumberField(1)
  }

  set x(value: number | undefined) {
    this.setField(1, value)
  }

  get y(): number | undefined {
    return this.getNumberField(2)
  }

  set y(value: number | undefined) {
    this.setField(2, value)
  }

  get width(): number | undefined {
    return this.getNumberField(3)
  }

  set width(value: number | undefined) {
    this.setField(3, value)
  }

  get height(): number | undefined {
    return this.getNumberField(4)
  }

  set height(value: number | undefined) {
    this.setField(4, value)
  }

  get layerId(): number | undefined {
    return this.getNumberField(5)
  }

  set layerId(value: number | undefined) {
    this.setField(5, value)
  }

  get net(): string | undefined {
    return this.getField(6)
  }

  set net(value: string | undefined) {
    this.setField(6, value)
  }

  get number(): string | undefined {
    return this.getField(7)
  }

  set number(value: string | undefined) {
    this.setField(7, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaPad)
