import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaSolidRegion extends EasyEdaShape {
  static readonly token = "SOLIDREGION"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaSolidRegion.token }
        : init,
    )
  }

  get layerId(): number | undefined {
    return this.getNumberField(0)
  }

  get net(): string | undefined {
    return this.getField(1)
  }

  get path(): string | undefined {
    return this.getField(2)
  }

  set path(value: string | undefined) {
    this.setField(2, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaSolidRegion)
