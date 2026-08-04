export interface EasyEdaCustomAttribute {
  key: string
  value?: string
}

export interface EasyEdaCustomAttributesBinding {
  getSource(): string
  setSource(source: string): void
}

function parseEntries(source: string): EasyEdaCustomAttribute[] {
  if (source === "") return []
  const segments = source.split("`")
  if (source.endsWith("`")) segments.pop()

  const entries: EasyEdaCustomAttribute[] = []
  for (let index = 0; index < segments.length; index += 2) {
    entries.push({
      key: segments[index] ?? "",
      ...(segments[index + 1] === undefined
        ? {}
        : { value: segments[index + 1] }),
    })
  }
  return entries
}

function serializeEntries(
  entries: readonly EasyEdaCustomAttribute[],
  trailingDelimiter: boolean,
): string {
  if (entries.length === 0) return ""
  const segments: string[] = []
  for (const [index, entry] of entries.entries()) {
    segments.push(entry.key)
    if (entry.value !== undefined || index < entries.length - 1) {
      segments.push(entry.value ?? "")
    }
  }
  const source = segments.join("`")
  return trailingDelimiter ? `${source}\`` : source
}

function assertAttributePart(kind: "key" | "value", value: string): void {
  if (value.includes("`")) {
    throw new Error(
      `EasyEDA custom attribute ${kind} cannot contain the backtick delimiter`,
    )
  }
}

export class EasyEdaCustomAttributes {
  private source: string
  private readonly binding?: EasyEdaCustomAttributesBinding

  constructor(sourceOrBinding: string | EasyEdaCustomAttributesBinding = "") {
    this.source = typeof sourceOrBinding === "string" ? sourceOrBinding : ""
    this.binding =
      typeof sourceOrBinding === "string" ? undefined : sourceOrBinding
  }

  get size(): number {
    return this.toArray().length
  }

  get trailingDelimiter(): boolean {
    return this.getString().endsWith("`")
  }

  toArray(): EasyEdaCustomAttribute[] {
    return parseEntries(this.getString())
  }

  has(key: string): boolean {
    return this.toArray().some((entry) => entry.key === key)
  }

  get(key: string): string | undefined {
    const entries = this.toArray()
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      if (entries[index]?.key === key) return entries[index]?.value
    }
    return undefined
  }

  getAll(key: string): (string | undefined)[] {
    return this.toArray()
      .filter((entry) => entry.key === key)
      .map((entry) => entry.value)
  }

  set(key: string, value: string): this {
    assertAttributePart("key", key)
    assertAttributePart("value", value)
    const entries = this.toArray()
    let matchIndex = -1
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      if (entries[index]?.key === key) {
        matchIndex = index
        break
      }
    }
    if (matchIndex === -1) entries.push({ key, value })
    else entries[matchIndex] = { key, value }
    this.write(entries)
    return this
  }

  append(key: string, value: string): this {
    assertAttributePart("key", key)
    assertAttributePart("value", value)
    const entries = this.toArray()
    entries.push({ key, value })
    this.write(entries)
    return this
  }

  delete(key: string): boolean {
    const entries = this.toArray()
    const remaining = entries.filter((entry) => entry.key !== key)
    if (remaining.length === entries.length) return false
    this.write(remaining)
    return true
  }

  clear(): void {
    if (this.getString() !== "") this.setSource("")
  }

  getString(): string {
    return this.binding?.getSource() ?? this.source
  }

  toString(): string {
    return this.getString()
  }

  private write(entries: readonly EasyEdaCustomAttribute[]): void {
    const currentSource = this.getString()
    this.setSource(
      serializeEntries(
        entries,
        currentSource === "" || currentSource.endsWith("`"),
      ),
    )
  }

  private setSource(source: string): void {
    if (this.binding) this.binding.setSource(source)
    else this.source = source
  }
}
