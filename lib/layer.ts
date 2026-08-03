import {
  EasyEdaDelimitedRecord,
  type EasyEdaDelimitedRecordInit,
} from "./delimited-record"

export class EasyEdaLayer extends EasyEdaDelimitedRecord {
  constructor(init: EasyEdaDelimitedRecordInit | string = {}) {
    super(typeof init === "string" ? { source: init } : init)
  }

  get id(): number | undefined {
    const parsed = Number(this.token)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  get name(): string | undefined {
    return this.getField(0)
  }

  set name(value: string | undefined) {
    this.setField(0, value)
  }

  get color(): string | undefined {
    return this.getField(1)
  }

  set color(value: string | undefined) {
    this.setField(1, value)
  }
}
