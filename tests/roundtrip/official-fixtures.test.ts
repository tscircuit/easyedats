import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import {
  EasyEdaLibrary,
  EasyEdaPcb,
  EasyEdaSchematic,
  parseEasyEdaSource,
} from "lib"

const fixtures = [
  "tests/fixtures/easyeda-standard-schematic.json",
  "tests/fixtures/easyeda-standard-pcb.json",
] as const

for (const fixture of fixtures) {
  test(`round-trips ${fixture} exactly`, async () => {
    const source = await readFile(fixture, "utf8")
    const document = parseEasyEdaSource(source)

    expect(document.getString()).toBe(source)
    expect(JSON.parse(document.getString())).toEqual(JSON.parse(source))
  })
}

test("selects typed roots and parses embedded library children", async () => {
  const schematicSource = await readFile(fixtures[0], "utf8")
  const pcbSource = await readFile(fixtures[1], "utf8")
  const schematic = parseEasyEdaSource(schematicSource)
  const pcb = parseEasyEdaSource(pcbSource)

  expect(schematic).toBeInstanceOf(EasyEdaSchematic)
  expect(pcb).toBeInstanceOf(EasyEdaPcb)

  const library = schematic.shapes.find(
    (shape): shape is EasyEdaLibrary => shape instanceof EasyEdaLibrary,
  )
  expect(library).toBeDefined()
  if (!library) throw new Error("Expected an embedded library")
  expect(library.getChildren().length).toBeGreaterThan(0)
  expect(library.getString()).toStartWith("LIB~")
})
