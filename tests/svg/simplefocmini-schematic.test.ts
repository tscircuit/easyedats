import { expect, test } from "bun:test"
import { EasyEdaSchematicList, parseEasyEdaSource, renderEasyEdaSvg } from "lib"
import { readReference } from "../references/read-reference"

test("renders the SimpleFOCMini schematic", async () => {
  const source = await readReference("simplefocmini-2024-04-26-schematic.json")
  const document = parseEasyEdaSource(source)
  expect(document).toBeInstanceOf(EasyEdaSchematicList)

  const svg = renderEasyEdaSvg(document, { title: "SimpleFOCMini schematic" })
  expect(svg).toContain('data-easyeda-shape="W"')
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
