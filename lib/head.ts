import {
  EasyEdaDelimitedRecord,
  type EasyEdaDelimitedRecordInit,
} from "./delimited-record"

export class EasyEdaHead extends EasyEdaDelimitedRecord {
  constructor(init: EasyEdaDelimitedRecordInit | string = {}) {
    super(typeof init === "string" ? { source: init } : init)
  }

  get documentTypeCode(): number | undefined {
    const parsed = Number(this.token)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  get version(): string | undefined {
    return this.fields[0]
  }

  set version(value: string | undefined) {
    this.setField(0, value)
  }
}
