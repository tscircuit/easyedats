import { shapeId } from "./field-helpers"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export class EasyEdaSchematicText extends EasyEdaShape {
  static readonly token = "T"

  constructor(init: EasyEdaShapeInit = {}) {
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaSchematicText.token }
        : init,
    )
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

  get text(): string | undefined {
    return this.getField(11)
  }

  set text(value: string | undefined) {
    this.setField(11, value)
  }

  get id(): string | undefined {
    return shapeId(this)
  }
}

EasyEdaShape.register(EasyEdaSchematicText)
