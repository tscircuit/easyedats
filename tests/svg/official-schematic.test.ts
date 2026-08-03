import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { parseEasyEdaSchematic, renderEasyEdaSvg } from "lib"

test("renders the official EasyEDA Standard schematic", async () => {
  const source = await readFile(
    "tests/fixtures/easyeda-standard-schematic.json",
    "utf8",
  )
  const svg = renderEasyEdaSvg(parseEasyEdaSchematic(source), {
    title: "Official EasyEDA Standard schematic",
  })

  expect(svg).toContain('class="easyeda-document easyeda-schematic"')
  expect(svg).toContain('data-easyeda-shape="LIB"')
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
