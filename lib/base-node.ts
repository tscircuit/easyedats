export abstract class EasyEdaNode {
  abstract readonly type: string

  abstract getString(): string

  getChildren(): EasyEdaNode[] {
    return []
  }

  toString(): string {
    return this.getString()
  }

  get [Symbol.toStringTag](): string {
    return this.getString()
  }

  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return this.getString()
  }
}
