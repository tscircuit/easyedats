import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaEllipse extends EasyEdaShape {
  static readonly token = "E"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaEllipse.token }
        : init,
    )
  }

  get x(): number | undefined {
    return this.getNumberField(0)
  }

  get y(): number | undefined {
    return this.getNumberField(1)
  }

  get radiusX(): number | undefined {
    return this.getNumberField(2)
  }

  get radiusY(): number | undefined {
    return this.getNumberField(3)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaEllipse)
