import { expect, test } from "bun:test"
import { parseEasyEdaPcb, renderEasyEdaSvg } from "lib"
import { readReference } from "../references/read-reference"

test("renders the SimpleFOCMini PCB", async () => {
  const source = await readReference("simplefocmini-2024-04-26-pcb.json")
  const svg = renderEasyEdaSvg(parseEasyEdaPcb(source), {
    title: "SimpleFOCMini PCB",
  })

  expect(svg).toContain('data-easyeda-shape="VIA"')
  expect(svg).toContain('data-easyeda-shape="COPPERAREA"')
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
