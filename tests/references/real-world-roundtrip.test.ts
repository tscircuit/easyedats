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

for (const filename of [
  "simplefocmini-2024-04-26-schematic.json",
  "simplefocmini-2024-04-26-pcb.json",
] as const) {
  test(`edits custom attributes in ${filename}`, async () => {
    const source = await readReference(filename)
    const document = parseEasyEdaSource(source)
    const root =
      document instanceof EasyEdaSchematicList ? document.sheets[0] : document
    const library = root?.shapes.find(
      (shape): shape is EasyEdaLibrary => shape instanceof EasyEdaLibrary,
    )
    if (!library) throw new Error("Expected a library")

    const originalChildren = library.children.map((child) => child.getString())
    const originalPackage = library.customAttributes.get("package")
    library.customAttributes
      .set("package", `${originalPackage ?? "NONE"}-easyedats`)
      .set("easyedats test", "µ-controller 测试")

    const serialized = document.getString({ trailingNewline: false })
    const reparsed = parseEasyEdaSource(serialized)
    const reparsedRoot =
      reparsed instanceof EasyEdaSchematicList ? reparsed.sheets[0] : reparsed
    const reparsedLibrary = reparsedRoot?.shapes.find(
      (shape): shape is EasyEdaLibrary => shape instanceof EasyEdaLibrary,
    )
    if (!reparsedLibrary) throw new Error("Expected a reparsed library")

    expect(reparsedLibrary.customAttributes.get("package")).toBe(
      `${originalPackage ?? "NONE"}-easyedats`,
    )
    expect(reparsedLibrary.customAttributes.get("easyedats test")).toBe(
      "µ-controller 测试",
    )
    expect(reparsedLibrary.children.map((child) => child.getString())).toEqual(
      originalChildren,
    )
  })
}
