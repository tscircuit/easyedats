import {
  EasyEdaDelimitedRecord,
  type EasyEdaDelimitedRecordInit,
} from "./delimited-record"

export class EasyEdaCanvas extends EasyEdaDelimitedRecord {
  constructor(init: EasyEdaDelimitedRecordInit | string = {}) {
    super(typeof init === "string" ? { source: init } : init)
  }

  get viewBoxWidth(): number | undefined {
    return this.getNumberField(0)
  }

  set viewBoxWidth(value: number | undefined) {
    this.setField(0, value)
  }

  get viewBoxHeight(): number | undefined {
    return this.getNumberField(1)
  }

  set viewBoxHeight(value: number | undefined) {
    this.setField(1, value)
  }

  get backgroundColor(): string | undefined {
    return this.getField(2)
  }

  set backgroundColor(value: string | undefined) {
    this.setField(2, value)
  }

  get unit(): string | undefined {
    return this.getField(10)
  }

  set unit(value: string | undefined) {
    this.setField(10, value)
  }
}
