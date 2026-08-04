import { expect, test } from "bun:test"
import {
  EasyEdaLibrary,
  EasyEdaPcb,
  EasyEdaSchematicList,
  EasyEdaShape,
  parseEasyEdaPcb,
  parseEasyEdaSchematic,
  parseEasyEdaSchematicList,
  shapeId,
} from "lib"

test("inserts, removes, and reorders document shapes and layers", () => {
  const pcb = parseEasyEdaPcb('{"head":"3~1.11.3~"}')
  const firstTrack = EasyEdaShape.parse("TRACK~1~1~GND~0 0 10 10~gge-track-1")
  const secondTrack = EasyEdaShape.parse(
    "TRACK~2~2~VCC~10 10 20 20~gge-track-2",
  )
  const via = EasyEdaShape.parse("VIA~10~10~3.2~GND~0.8~gge-via")

  expect(pcb.appendShape(via)).toBe(via)
  expect(pcb.insertShape(0, firstTrack)).toBe(firstTrack)
  expect(pcb.insertShape(1, secondTrack)).toBe(secondTrack)
  expect(pcb.shapes).toEqual([firstTrack, secondTrack, via])

  pcb.moveShape(2, 0)
  expect(pcb.shapes).toEqual([via, firstTrack, secondTrack])
  expect(pcb.removeShape(1)).toBe(firstTrack)
  expect(pcb.shapes).toEqual([via, secondTrack])

  const bottom = pcb.appendLayer("2~BottomLayer~#0000FF~true~false~true")
  const top = pcb.insertLayer(0, "1~TopLayer~#FF0000~true~true~true")
  const silk = pcb.appendLayer("3~TopSilkLayer~#FFCC00~true~false~true")
  expect(pcb.layers).toEqual([top, bottom, silk])

  pcb.moveLayer(2, 0)
  expect(pcb.layers).toEqual([silk, top, bottom])
  expect(pcb.removeLayer(2)).toBe(bottom)

  const serialized = pcb.getString({ trailingNewline: false })
  const reparsed = parseEasyEdaPcb(serialized)
  expect(reparsed).toBeInstanceOf(EasyEdaPcb)
  expect(reparsed.shapes.map((shape) => shapeId(shape))).toEqual([
    "gge-via",
    "gge-track-2",
  ])
  expect(reparsed.layers.map((layer) => layer.id)).toEqual([3, 1])
})

test("validates collection mutation indexes", () => {
  const pcb = parseEasyEdaPcb(
    JSON.stringify({
      head: "3~1.11.3~",
      shape: ["VIA~10~10~3.2~GND~0.8~gge-via"],
    }),
  )
  const shape = EasyEdaShape.parse("HOLE~20~20~4~gge-hole")

  expect(() => pcb.insertShape(-1, shape)).toThrow(
    "Cannot insert into EasyEDA shapes at index -1; expected 0 through 1",
  )
  expect(() => pcb.insertShape(1.5, shape)).toThrow("index 1.5")
  expect(() => pcb.removeShape(1)).toThrow("expected 0 through 0")
  expect(() => pcb.moveShape(0, 1)).toThrow("expected 0 through 0")
  expect(() => pcb.removeLayer(0)).toThrow("an empty collection")
})

test("restores exact source bytes after reversible collection mutations", () => {
  const source = `{
  "head": "3~1.11.3~",
  "layers": ["1~TopLayer~#FF0000~true~true~true"],
  "shape": [
    "TRACK~1~1~GND~0 0 10 10~gge-track",
    "VIA~10~10~3.2~GND~0.8~gge-via"
  ]
}`
  const pcb = parseEasyEdaPcb(source)
  const inserted = EasyEdaShape.parse("HOLE~20~20~4~gge-hole")

  pcb.insertShape(1, inserted)
  expect(pcb.removeShape(1)).toBe(inserted)
  pcb.moveShape(0, 1)
  pcb.moveShape(1, 0)
  const insertedLayer = pcb.appendLayer("2~BottomLayer~#0000FF~true~false~true")
  expect(pcb.removeLayer(1)).toBe(insertedLayer)

  expect(pcb.getString()).toBe(source)
})

test("inserts, removes, and reorders LIB children", () => {
  const library = EasyEdaShape.parse(
    "LIB~0~0~~~~0~gge-lib#@$TRACK~1~1~GND~0 0 10 10~gge-track#@$VIA~10~10~3.2~GND~0.8~gge-via",
  )
  if (!(library instanceof EasyEdaLibrary)) {
    throw new Error("Expected library")
  }
  const pad = EasyEdaShape.parse(
    "PAD~ELLIPSE~10~10~6~6~11~GND~1~1.8~~0~gge-pad",
  )
  const hole = EasyEdaShape.parse("HOLE~20~20~4~gge-hole")

  expect(library.insertChild(1, pad)).toBe(pad)
  expect(library.appendChild(hole)).toBe(hole)
  library.moveChild(3, 0)
  expect(library.children.map((child) => shapeId(child))).toEqual([
    "gge-hole",
    "gge-track",
    "gge-pad",
    "gge-via",
  ])
  expect(shapeId(library.removeChild(1))).toBe("gge-track")
  expect(library.getString()).toBe(
    "LIB~0~0~~~~0~gge-lib#@$HOLE~20~20~4~gge-hole#@$PAD~ELLIPSE~10~10~6~6~11~GND~1~1.8~~0~gge-pad#@$VIA~10~10~3.2~GND~0.8~gge-via",
  )
})

test("inserts, removes, and reorders schematic-list sheets with metadata", () => {
  const list = parseEasyEdaSchematicList(
    JSON.stringify({
      docType: "5",
      title: "Mutation test",
      schematics: [
        {
          docType: "1",
          title: "A",
          dataStr: { head: { docType: "1", editorVersion: "6.5.38" } },
        },
        {
          docType: "1",
          title: "B",
          dataStr: { head: { docType: "1", editorVersion: "6.5.38" } },
        },
      ],
    }),
  )
  const inserted = parseEasyEdaSchematic(
    JSON.stringify({ head: { docType: "1", editorVersion: "6.5.38" } }),
  )

  const insertedEntry = list.insertSheet(1, inserted, {
    properties: { docType: "1", title: "Inserted" },
    propertyOrder: ["docType", "title", "dataStr"],
  })
  expect(list.sheets[1]).toBe(inserted)
  expect(insertedEntry.getProperty("title")).toBe("Inserted")

  list.moveSheet(1, 2)
  const removed = list.removeSheet(0)
  expect(removed.getProperty("title")).toBe("A")
  expect(list.appendSheet(removed)).toBe(removed)

  const serialized = list.getString({ trailingNewline: false })
  const parsed = JSON.parse(serialized)
  expect(
    parsed.schematics.map((entry: { title: string }) => entry.title),
  ).toEqual(["B", "Inserted", "A"])
  const reparsed = parseEasyEdaSchematicList(serialized)
  expect(reparsed).toBeInstanceOf(EasyEdaSchematicList)
  expect(reparsed.sheets).toHaveLength(3)
})
