import { expect, test } from "bun:test"
import {
  EasyEdaDocument,
  EasyEdaHead,
  EasyEdaTrack,
  EasyEdaUnknownShape,
  parseEasyEdaPcb,
  parseEasyEdaSchematic,
  parseEasyEdaSource,
} from "lib"

test("preserves unknown commands and top-level properties", () => {
  const source = JSON.stringify({
    head: "99~1.0~",
    canvas: "CA~100~100",
    shape: ["FUTURE~one~two~~"],
    futureProperty: { enabled: true },
  })

  const document = parseEasyEdaSource(source)
  const unknownShape = document.shapes[0]

  expect(document).toBeInstanceOf(EasyEdaDocument)
  expect(unknownShape).toBeInstanceOf(EasyEdaUnknownShape)
  expect(unknownShape?.getString()).toBe("FUTURE~one~two~~")
  expect(document.getProperty("futureProperty")).toEqual({ enabled: true })
  expect(document.getString()).toBe(source)
})

test("retains source property order and empty layer arrays after mutation", () => {
  const source = JSON.stringify({
    head: "3~1.11.3~",
    layers: [],
    shape: ["TRACK~1~10~GND~0 0 10 10~gge1"],
    futureProperty: 42,
  })
  const document = parseEasyEdaPcb(source)
  const track = document.shapes[0]
  if (!(track instanceof EasyEdaTrack)) throw new Error("Expected track")

  track.width = 2
  const serialized = document.getString({ trailingNewline: false })
  const parsed = JSON.parse(serialized)

  expect(Object.keys(parsed)).toEqual([
    "head",
    "layers",
    "shape",
    "futureProperty",
  ])
  expect(parsed.layers).toEqual([])
  expect(parsed.futureProperty).toBe(42)
})

test("mutates typed records and produces deterministic JSON", () => {
  const source = JSON.stringify({
    head: "3~1.11.3~",
    shape: ["TRACK~1~10~GND~0 0 10 10~gge1"],
  })
  const pcb = parseEasyEdaPcb(source)
  const track = pcb.shapes[0]

  expect(track).toBeInstanceOf(EasyEdaTrack)
  if (!(track instanceof EasyEdaTrack)) throw new Error("Expected track")
  track.width = 2
  track.net = "VCC"

  const serialized = pcb.getString({ trailingNewline: false })
  expect(serialized).toContain("TRACK~2~10~VCC~0 0 10 10~gge1")
  expect(parseEasyEdaPcb(serialized).getString()).toBe(serialized)
})

test("builds documents with ergonomic constructors", () => {
  const document = new EasyEdaDocument("pcb", {
    head: new EasyEdaHead("3~1.11.3~"),
    shapes: [
      new EasyEdaTrack({
        fields: ["0.8", "1", "GND", "0 0 5 5", "gge1"],
      }),
    ],
  })

  expect(document.getString()).toContain("TRACK~0.8~1~GND~0 0 5 5~gge1")
})

test("specialized parsers reject the wrong document type", () => {
  const schematic = JSON.stringify({ head: "1~1.11.3~", shape: [] })
  const pcb = JSON.stringify({ head: "3~1.11.3~", shape: [] })

  expect(() => parseEasyEdaPcb(schematic)).toThrow("got 1")
  expect(() => parseEasyEdaSchematic(pcb)).toThrow("got 3")
})
