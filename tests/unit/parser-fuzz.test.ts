import { expect, test } from "bun:test"
import { EasyEdaParseError, parseEasyEdaSource } from "lib"

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 0x1_0000_0000
  }
}

const random = createRandom(0xf022)

function randomString(length: number): string {
  let value = ""
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(Math.floor(random() * 256))
  }
  return value
}

test("fuzz: arbitrary inputs either parse or fail with a structured error", () => {
  for (let iteration = 0; iteration < 500; iteration += 1) {
    const candidate = randomString(Math.floor(random() * 300))
    try {
      const document = parseEasyEdaSource(candidate)
      expect(() => document.getString()).not.toThrow()
    } catch (error) {
      expect(error).toBeInstanceOf(EasyEdaParseError)
    }
  }
})

test("fuzz: randomized valid containers do not lose serialized records", () => {
  for (let iteration = 0; iteration < 500; iteration += 1) {
    const shapeCount = Math.floor(random() * 12)
    const shapes = Array.from(
      { length: shapeCount },
      (_, index) =>
        `UNKNOWN_${iteration}_${index}~${randomString(Math.floor(random() * 80)).replaceAll("#@$", "#-at-dollar")}`,
    )
    const source = JSON.stringify({
      head: `${90 + (iteration % 10)}~fuzz~`,
      shape: shapes,
      unknown: randomString(Math.floor(random() * 120)),
    })
    const document = parseEasyEdaSource(source)
    expect(document.getString()).toBe(source)

    const normalized = document.getString({ preserveSourceFormatting: false })
    expect(parseEasyEdaSource(normalized).toObject()).toEqual(
      document.toObject(),
    )
  }
})
