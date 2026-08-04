import type { EasyEdaNode } from "../base-node"
import { insertAt, moveWithin, removeAt } from "../collection-mutations"
import { EasyEdaShape, type EasyEdaShapeInit } from "./shape"

export interface EasyEdaLibraryInit extends EasyEdaShapeInit {
  children?: readonly EasyEdaShape[]
}

export class EasyEdaLibrary extends EasyEdaShape {
  static readonly token = "LIB"
  children: EasyEdaShape[]

  constructor(init: EasyEdaLibraryInit = {}) {
    const [ownSource = "LIB", ...childSources] = (init.source ?? "LIB").split(
      "#@$",
    )
    super(
      init.source === undefined
        ? { ...init, token: EasyEdaLibrary.token }
        : { source: ownSource },
    )
    this.children = init.children
      ? [...init.children]
      : childSources.map((source) => EasyEdaShape.parse(source))
  }

  override getChildren(): EasyEdaNode[] {
    return [...this.children]
  }

  appendChild<T extends EasyEdaShape>(child: T): T {
    return this.insertChild(this.children.length, child)
  }

  insertChild<T extends EasyEdaShape>(index: number, child: T): T {
    return insertAt(this.children, index, child, "LIB children")
  }

  removeChild(index: number): EasyEdaShape {
    return removeAt(this.children, index, "LIB children")
  }

  moveChild(fromIndex: number, toIndex: number): void {
    moveWithin(this.children, fromIndex, toIndex, "LIB children")
  }

  override getString(): string {
    return [
      super.getString(),
      ...this.children.map((child) => child.getString()),
    ].join("#@$")
  }
}

EasyEdaShape.register(EasyEdaLibrary)
