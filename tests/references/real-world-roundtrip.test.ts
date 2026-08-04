import { expect, test } from "bun:test"
import {
  EasyEdaLibrary,
  EasyEdaPcb,
  EasyEdaSchematicList,
  parseEasyEdaSource,
} from "lib"
import { easyEdaReferences } from "../../scripts/reference-manifest"
import { readReference } from "./read-reference"

for (const reference of easyEdaReferences) {
  test(`round-trips ${reference.filename} exactly`, async () => {
    const source = await readReference(reference.filename)
    const document = parseEasyEdaSource(source)

    expect(document.getString()).toBe(source)
    expect(JSON.parse(document.getString())).toEqual(JSON.parse(source))
    if (reference.kind === "pcb") expect(document).toBeInstanceOf(EasyEdaPcb)
    else expect(document).toBeInstanceOf(EasyEdaSchematicList)
  })
}

test("parses the Open_Core0 stress fixture and all embedded footprint records", async () => {
  const source = await readReference("open-core0-v2-pcb.json")
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaPcb)) throw new Error("Expected a PCB")

  const libraries = document.shapes.filter(
    (shape): shape is EasyEdaLibrary => shape instanceof EasyEdaLibrary,
  )
  const embeddedShapes = libraries.flatMap((library) => library.children)
  const tokens = new Set([
    ...document.shapes.map((shape) => shape.token),
    ...embeddedShapes.map((shape) => shape.token),
  ])

  expect(new TextEncoder().encode(source)).toHaveLength(2_639_463)
  expect(document.shapes).toHaveLength(1_236)
  expect(libraries).toHaveLength(147)
  expect(embeddedShapes).toHaveLength(3_437)
  expect(document.shapes.length + embeddedShapes.length).toBe(4_673)
  expect(tokens).toEqual(
    new Set([
      "ARC",
      "CIRCLE",
      "COPPERAREA",
      "HOLE",
      "LIB",
      "PAD",
      "SOLIDREGION",
      "SVGNODE",
      "TEXT",
      "TRACK",
      "VIA",
    ]),
  )
})

test("serializes mutations inside a modern schematic list", async () => {
  const source = await readReference("simplefocmini-2024-04-26-schematic.json")
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaSchematicList)) {
    throw new Error("Expected a schematic list")
  }

  document.sheets[0]?.head.setProperty("editorVersion", "easyedats-test")
  const serialized = document.getString({ trailingNewline: false })
  const reparsed = parseEasyEdaSource(serialized)

  expect(reparsed).toBeInstanceOf(EasyEdaSchematicList)
  expect(JSON.parse(serialized).schematics[0].dataStr.head.editorVersion).toBe(
    "easyedats-test",
  )
})

test("serializes mutations to a modern object head", async () => {
  const source = await readReference("simplefocmini-2024-04-26-pcb.json")
  const document = parseEasyEdaSource(source)
  if (!(document instanceof EasyEdaPcb)) throw new Error("Expected a PCB")

  document.head.version = "easyedats-test"
  const serialized = document.getString({ trailingNewline: false })
  const reparsed = parseEasyEdaSource(serialized)

  expect(reparsed).toBeInstanceOf(EasyEdaPcb)
  expect(JSON.parse(serialized).head.editorVersion).toBe("easyedats-test")
  expect(reparsed.head.version).toBe("easyedats-test")
})
