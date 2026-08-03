import { EasyEdaNode } from "./base-node"

export interface EasyEdaDelimitedRecordInit {
  source?: string
  token?: string
  fields?: readonly string[]
  hasDelimiter?: boolean
}

export class EasyEdaDelimitedRecord extends EasyEdaNode {
  readonly token: string
  fields: string[]
  readonly hasDelimiter: boolean

  constructor(init: EasyEdaDelimitedRecordInit = {}) {
    super()

    if (init.source !== undefined) {
      const separatorIndex = init.source.indexOf("~")
      if (separatorIndex === -1) {
        this.token = init.source
        this.fields = []
        this.hasDelimiter = false
        return
      }

      this.token = init.source.slice(0, separatorIndex)
      this.fields = init.source.slice(separatorIndex + 1).split("~")
      this.hasDelimiter = true
      return
    }

    this.token = init.token ?? ""
    this.fields = [...(init.fields ?? [])]
    this.hasDelimiter = init.hasDelimiter ?? this.fields.length > 0
  }

  override get type(): string {
    return this.token
  }

  override getString(): string {
    if (!this.hasDelimiter && this.fields.length === 0) return this.token
    return `${this.token}~${this.fields.join("~")}`
  }

  protected getField(index: number): string | undefined {
    return this.fields[index]
  }

  protected setField(index: number, value: string | number | undefined): void {
    while (this.fields.length <= index) this.fields.push("")
    this.fields[index] = value === undefined ? "" : String(value)
  }

  protected getNumberField(index: number): number | undefined {
    const value = this.getField(index)
    if (value === undefined || value === "") return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
}
