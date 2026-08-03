import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaImage extends EasyEdaShape {
  static readonly token = "I"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined ? { ...init, token: EasyEdaImage.token } : init,
    )
  }

  get x(): number | undefined {
    return this.getNumberField(0)
  }

  get y(): number | undefined {
    return this.getNumberField(1)
  }

  get width(): number | undefined {
    return this.getNumberField(2)
  }

  get height(): number | undefined {
    return this.getNumberField(3)
  }

  get href(): string | undefined {
    return this.getField(5)
  }

  set href(value: string | undefined) {
    this.setField(5, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaImage)
