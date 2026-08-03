import type { EasyEdaNode } from "../base-node"
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

  override getString(): string {
    return [
      super.getString(),
      ...this.children.map((child) => child.getString()),
    ].join("#@$")
  }
}

EasyEdaShape.register(EasyEdaLibrary)
