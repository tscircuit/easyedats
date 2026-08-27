import { expect, test } from "bun:test"
import {
  EasyEdaPcbText,
  EasyEdaShape,
  EasyEdaSvgNode,
  EasyEdaUnknownShape,
  EasyEdaVia,
  parseEasyEdaPcbFootprint,
  parseEasyEdaSchematicSymbol,
} from "lib"

const documentedShapeSamples = [
  "R~10~20~0~0~30~40~#000000~1~0~none~gge1",
  "PL~0 0 10 10~#000000~1~0~none~gge2",
  "PT~M0 0 L10 10~#000000~1~0~none~gge3",
  "A~M0 0 A10 10 0 0 1 10 10~~#000000~1~0~none~gge4",
  "PI~M0 0 L10 0 A10 10 0 0 1 0 10 Z~~#000000~1~0~none~gge5",
  "BE~0~0~0~10~10~gge6",
  "I~0~0~20~10~0~https://example.com/image.png~gge7",
  "PG~0 0 10 0 10 10~#000000~1~0~none~gge8",
  "L~0~0~10~10~#000000~1~0~none~gge9",
  "C~5~5~5~#000000~1~0~none~gge10",
  "B~0 0 10 10~#008800~1~0~none~gge11",
  "P~show~0~1~0~0~~gge12",
  "E~5~5~5~3~#000000~1~0~none~gge13",
  "AR~part_arrowhead~0~0~gge14~0~M0 0 L1 1~#000000",
  "T~L~0~0~0~#000000~~9pt~~~~comment~Text~1~start~gge15",
  "N~0~0~0~#000000~VCC~gge16~start~0~0~~",
  "F~part_netLabel_gnD~0~0~0~gge17",
  "W~0 0 10 10~#008800~1~0~none~gge18",
  "J~0~0~2.5~#CC0000~gge19",
  "O~0~0~gge20~M-1,-1 L1,1~#FF0000",
  "LIB~0~0~~~~0~gge21#@$L~0~0~1~1~#000000~1~0~none~gge22",
  "TRACK~1~1~GND~0 0 10 10~gge23",
  "COPPERAREA~2px~1~GND~0 0 10 0 10 10~1~solid~gge24~spoke~yes~[]",
  "RECT~0~0~10~10~1~gge25",
  "CIRCLE~0~0~10~1~3~gge26",
  "SOLIDREGION~1~~0 0 10 0 10 10~solid~gge27",
  "TEXT~P~0~0~0.7~0~~3~~4.5~R1~~~gge28",
  "ARC~1~1~GND~M0 0 A10 10 0 0 1 10 10~~gge29",
  "PAD~ELLIPSE~0~0~6~6~11~GND~1~1.8~~0~gge30",
  "VIA~0~0~3.2~GND~0.8~gge31",
  "HOLE~0~0~4~gge32",
  "DIMENSION~3~M0 0 L10 10~gge33",
  'SVGNODE~{"gId":"gge34","nodeName":"path","nodeType":1,"layerid":"3","attrs":{"d":"M0 0 L10 10","stroke":"none","id":"gge34"}}',
] as const

test("registers every documented Standard source shape command", () => {
  for (const sample of documentedShapeSamples) {
    const shape = EasyEdaShape.parse(sample)
    expect(shape).not.toBeInstanceOf(EasyEdaUnknownShape)
    expect(shape.getString()).toBe(sample)
  }
})

test("mutates and serializes every documented Standard shape entity", () => {
  for (const [index, sample] of documentedShapeSamples.entries()) {
    const shape = EasyEdaShape.parse(sample)
    const originalClass = shape.constructor
    const originalField = shape.fields[0] ?? ""
    shape.fields[0] = `${originalField}-mutation-${index}`

    const serialized = shape.getString()
    expect(serialized).not.toBe(sample)
    expect(serialized.startsWith(`${shape.token}~`)).toBe(true)

    const reparsed = EasyEdaShape.parse(serialized)
    expect(reparsed.constructor).toBe(originalClass)
    expect(reparsed.getString()).toBe(serialized)
  }
})

test("parses, mutates, and serializes PCB vias", () => {
  const source = "VIA~432~215~3.2~GND~0.8~gge5"
  const via = EasyEdaShape.parse(source)

  expect(via).toBeInstanceOf(EasyEdaVia)
  if (!(via instanceof EasyEdaVia)) throw new Error("Expected via")

  // Confirm the original values were parsed correctly.
  expect(via.x).toBe(432)
  expect(via.y).toBe(215)
  expect(via.diameter).toBe(3.2)
  expect(via.net).toBe("GND")
  expect(via.holeRadius).toBe(0.8)
  expect(via.id).toBe("gge5")

  // Change all editable properties.
  via.x = 500
  via.y = 250
  via.diameter = 4
  via.net = "VCC"
  via.holeRadius = 1

  // Confirm the correct fields were changed.
  const serialized = via.getString()

  expect(serialized).toBe("VIA~500~250~4~VCC~1~gge5")

  // Parse the generated record again.
  const reparsed = EasyEdaShape.parse(serialized)

  expect(reparsed).toBeInstanceOf(EasyEdaVia)
  if (!(reparsed instanceof EasyEdaVia)) {
    throw new Error("Expected reparsed via")
  }

  // Confirm all changes survived serialization and reparsing.
  expect(reparsed.x).toBe(500)
  expect(reparsed.y).toBe(250)
  expect(reparsed.diameter).toBe(4)
  expect(reparsed.net).toBe("VCC")
  expect(reparsed.holeRadius).toBe(1)

  // The ID survives serialization and reparsing.
  expect(reparsed.id).toBe("gge5")
})

test("provides typed accessors for PCB text", () => {
  const text = EasyEdaShape.parse(
    "TEXT~L~4084~3052.5~0.8~90~1~4~~3.937~SimpleFOC~M 0 0 L 1 1~~gge6",
  )
  expect(text).toBeInstanceOf(EasyEdaPcbText)
  if (!(text instanceof EasyEdaPcbText)) throw new Error("Expected PCB text")

  expect(text.text).toBe("SimpleFOC")
  expect(text.rotation).toBe(90)
  expect(text.layerId).toBe(4)
  expect(text.fontSize).toBe(3.937)
})

test("parses and mutates JSON-backed SVG nodes losslessly", () => {
  const source =
    'SVGNODE~{"gId":"gge5","nodeName":"path","nodeType":1,"layerid":"3","attrs":{"d":"M0 0 L10 10","title":"value~with~tildes"}}'
  const shape = EasyEdaShape.parse(source)
  expect(shape).toBeInstanceOf(EasyEdaSvgNode)
  if (!(shape instanceof EasyEdaSvgNode)) throw new Error("Expected SVG node")

  expect(shape.getString()).toBe(source)
  expect(shape.id).toBe("gge5")
  expect(shape.layerId).toBe(3)
  expect(shape.svgData?.attrs?.title).toBe("value~with~tildes")

  shape.svgData = { ...shape.svgData, layerid: "4" }
  expect(shape.layerId).toBe(4)
  expect(JSON.parse(shape.getString().slice("SVGNODE~".length))).toEqual(
    shape.svgData,
  )
})

test("selects Standard symbol and footprint root classes", () => {
  const symbol = parseEasyEdaSchematicSymbol(
    JSON.stringify({ head: "7~1.11.3~400~300~", shape: [] }),
  )
  const modernSymbol = parseEasyEdaSchematicSymbol(
    JSON.stringify({
      head: { docType: "2", editorVersion: "6.5.42" },
      shape: [],
    }),
  )
  const footprint = parseEasyEdaPcbFootprint(
    JSON.stringify({ head: "4~1.11.3~400~300~", shape: [] }),
  )

  expect(symbol.kind).toBe("schematic-symbol")
  expect(modernSymbol.kind).toBe("schematic-symbol")
  expect(footprint.kind).toBe("pcb-footprint")
})
