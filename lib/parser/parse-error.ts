export type EasyEdaParsePathSegment = string | number

export type EasyEdaParseErrorCode =
  | "invalid-json"
  | "invalid-options"
  | "invalid-record"
  | "invalid-type"
  | "limit-exceeded"
  | "truncated-record"
  | "unexpected-document-type"

export interface EasyEdaParseErrorInit {
  cause?: unknown
  code: EasyEdaParseErrorCode
  fieldIndex?: number
  path?: readonly EasyEdaParsePathSegment[]
  recordToken?: string
  sourcePosition?: number
}

export function formatEasyEdaPath(
  path: readonly EasyEdaParsePathSegment[],
): string {
  let result = "$"
  for (const segment of path) {
    if (typeof segment === "number") result += `[${segment}]`
    else if (/^[A-Za-z_$][\w$]*$/.test(segment)) result += `.${segment}`
    else result += `[${JSON.stringify(segment)}]`
  }
  return result
}

export class EasyEdaParseError extends Error {
  readonly code: EasyEdaParseErrorCode
  readonly path: readonly EasyEdaParsePathSegment[]
  readonly recordToken?: string
  readonly fieldIndex?: number
  readonly sourcePosition?: number

  constructor(message: string, init: EasyEdaParseErrorInit) {
    const path = [...(init.path ?? [])]
    const details = [
      `path ${formatEasyEdaPath(path)}`,
      init.recordToken ? `record ${init.recordToken}` : undefined,
      init.fieldIndex === undefined ? undefined : `field ${init.fieldIndex}`,
      init.sourcePosition === undefined
        ? undefined
        : `source position ${init.sourcePosition}`,
    ].filter((value): value is string => value !== undefined)
    super(`${message} (${details.join(", ")})`, { cause: init.cause })
    this.name = "EasyEdaParseError"
    this.code = init.code
    this.path = path
    this.recordToken = init.recordToken
    this.fieldIndex = init.fieldIndex
    this.sourcePosition = init.sourcePosition
  }
}
