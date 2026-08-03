import {
  EasyEdaDelimitedRecord,
  type EasyEdaDelimitedRecordInit,
} from "../delimited-record"

export type EasyEdaShapeInit = EasyEdaDelimitedRecordInit

export interface EasyEdaShapeClass {
  readonly token: string
  new (init?: EasyEdaShapeInit): EasyEdaShape
}

export class EasyEdaShape extends EasyEdaDelimitedRecord {
  static readonly classes = new Map<string, EasyEdaShapeClass>()

  static register(shapeClass: EasyEdaShapeClass): void {
    if (!shapeClass.token) throw new Error("Shape class must define a token")
    EasyEdaShape.classes.set(shapeClass.token, shapeClass)
  }

  static parse(source: string): EasyEdaShape {
    const separatorIndex = source.indexOf("~")
    const token =
      separatorIndex === -1 ? source : source.slice(0, separatorIndex)
    const ShapeClass = EasyEdaShape.classes.get(token)

    if (ShapeClass) return new ShapeClass({ source })
    return new EasyEdaUnknownShape({ source })
  }
}

export class EasyEdaUnknownShape extends EasyEdaShape {}
