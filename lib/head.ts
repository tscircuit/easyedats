import {
  EasyEdaDelimitedRecord,
  type EasyEdaDelimitedRecordInit,
} from "./delimited-record"
import type { EasyEdaJsonValue } from "./document"

export interface EasyEdaHeadInit extends EasyEdaDelimitedRecordInit {
  object?: Record<string, EasyEdaJsonValue>
}

export class EasyEdaHead extends EasyEdaDelimitedRecord {
  private readonly object?: Record<string, EasyEdaJsonValue>

  constructor(init: EasyEdaHeadInit | string = {}) {
    const object = typeof init === "string" ? undefined : init.object
    super(
      typeof init === "string"
        ? { source: init }
        : object
          ? { token: String(object.docType ?? "") }
          : init,
    )
    this.object = object ? structuredClone(object) : undefined
  }

  get documentTypeCode(): number | undefined {
    const parsed = Number(this.object?.docType ?? this.token)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  get version(): string | undefined {
    if (this.object) {
      const version = this.object.editorVersion
      return version === undefined ? undefined : String(version)
    }
    return this.fields[0]
  }

  set version(value: string | undefined) {
    if (this.object) {
      if (value === undefined) delete this.object.editorVersion
      else this.object.editorVersion = value
      return
    }
    this.setField(0, value)
  }

  getProperty<T extends EasyEdaJsonValue = EasyEdaJsonValue>(
    key: string,
  ): T | undefined {
    return this.object?.[key] as T | undefined
  }

  setProperty(key: string, value: EasyEdaJsonValue | undefined): void {
    if (!this.object) {
      throw new Error("Delimited EasyEDA heads do not expose object properties")
    }

    if (value === undefined) delete this.object[key]
    else this.object[key] = value
  }

  toValue(): string | Record<string, EasyEdaJsonValue> {
    return this.object ? structuredClone(this.object) : super.getString()
  }

  override getString(): string {
    return this.object ? JSON.stringify(this.object) : super.getString()
  }
}
