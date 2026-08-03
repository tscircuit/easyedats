import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaPcbArc extends EasyEdaShape {
  static readonly token = "ARC"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaPcbArc.token }
        : init,
    )
  }

  get width(): number | undefined {
    return this.getNumberField(0)
  }

  set width(value: number | undefined) {
    this.setField(0, value)
  }

  get layerId(): number | undefined {
    return this.getNumberField(1)
  }

  set layerId(value: number | undefined) {
    this.setField(1, value)
  }

  get net(): string | undefined {
    return this.getField(2)
  }

  set net(value: string | undefined) {
    this.setField(2, value)
  }

  get path(): string | undefined {
    return this.getField(3)
  }

  set path(value: string | undefined) {
    this.setField(3, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaPcbArc)
