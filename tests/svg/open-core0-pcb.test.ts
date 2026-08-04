import { expect, test } from "bun:test"
import { parseEasyEdaPcb, renderEasyEdaSvg } from "lib"
import { readReference } from "../references/read-reference"

test("renders the Open_Core0 v2.0 PCB stress fixture", async () => {
  const source = await readReference("open-core0-v2-pcb.json")
  const svg = renderEasyEdaSvg(parseEasyEdaPcb(source), {
    title: "Open_Core0 v2.0 PCB",
  })

  expect(svg).toContain('data-easyeda-shape="TRACK"')
  expect(svg).toContain('data-easyeda-shape="COPPERAREA"')
  expect(svg).toContain('data-easyeda-shape="SOLIDREGION"')
  expect(svg).toContain('data-easyeda-shape="LIB"')
  expect(svg).toContain('data-easyeda-shape="SVGNODE"')
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
