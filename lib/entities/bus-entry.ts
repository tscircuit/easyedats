import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaBusEntry extends EasyEdaShape {
  static readonly token = "BE"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaBusEntry.token }
        : init,
    )
  }

  get startX(): number | undefined {
    return this.getNumberField(1)
  }

  get startY(): number | undefined {
    return this.getNumberField(2)
  }

  get endX(): number | undefined {
    return this.getNumberField(3)
  }

  get endY(): number | undefined {
    return this.getNumberField(4)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaBusEntry)
