import { expect, test } from "bun:test"
import { parseEasyEdaSource } from "lib"

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

const random = createRandom(0xe45eda)
const pieces = [
  "~",
  "~~",
  "^^",
  "`",
  "#@$",
  "\\",
  '"',
  "\n",
  "电机",
  "µΩ",
  "emoji-🔌",
  "null",
  "0",
]

function randomValue(): string {
  const count = 1 + Math.floor(random() * 8)
  let result = ""
  for (let index = 0; index < count; index += 1) {
    result += pieces[Math.floor(random() * pieces.length)]
  }
  return result
}

test("property: delimiter-heavy unknown data round-trips losslessly", () => {
  for (let iteration = 0; iteration < 250; iteration += 1) {
    const unknownField = randomValue()
    const unknownRecord = `FUTURE_${iteration}~${randomValue()}~${randomValue()}`
    const source = JSON.stringify({
      head: "99~1.0~",
      shape: [unknownRecord],
      [`future_${iteration}`]: unknownField,
    })
    const document = parseEasyEdaSource(source)

    expect(document.getString()).toBe(source)
    expect(document.shapes[0]?.getString()).toBe(unknownRecord)

    document.setProperty("mutation", randomValue())
    const normalized = document.getString({ preserveSourceFormatting: false })
    const reparsed = parseEasyEdaSource(normalized)
    expect(reparsed.toObject()).toEqual(document.toObject())
    expect(reparsed.getString({ preserveSourceFormatting: false })).toBe(
      normalized,
    )
  }
})
