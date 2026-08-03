import type { EasyEdaDelimitedRecord } from "../delimited-record"

export interface EasyEdaPoint {
  x: number
  y: number
}

export function parsePoints(value: string | undefined): EasyEdaPoint[] {
  if (!value) return []
  const numbers = value.trim().split(/[ ,]+/).map(Number)

  if (numbers.some(Number.isNaN) || numbers.length % 2 !== 0) return []

  const points: EasyEdaPoint[] = []
  for (let index = 0; index < numbers.length; index += 2) {
    const x = numbers[index]
    const y = numbers[index + 1]
    if (x === undefined || y === undefined) break
    points.push({ x, y })
  }
  return points
}

export function serializePoints(points: readonly EasyEdaPoint[]): string {
  return points.map(({ x, y }) => `${x} ${y}`).join(" ")
}

export function shapeId(record: EasyEdaDelimitedRecord): string | undefined {
  for (let index = record.fields.length - 1; index >= 0; index -= 1) {
    const field = record.fields[index]
    const match = field?.match(/gge[A-Za-z0-9_-]+/)
    if (match) return match[0]
  }
  return undefined
}
